import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapPin, Download, Search, X, Trash2, Eye } from 'lucide-react';
import SEO from '../../components/SEO';
import { api } from '../../lib/api';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { getAuthToken } from '../../lib/token';
import { TableSkeleton } from '../../components/ui/Skeleton';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';

interface Visit {
  _id: string;
  ipAddress: string;
  country: string;
  countryCode: string;
  region: string;
  regionCode: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  isp: string;
  organization: string;
  locationStatus: string;
  visitedAt: string;
  pagePath: string;
  referrer: string;
  userAgent: string;
  sessionId: string;
}

interface Stats {
  total: number;
  today: number;
  last7Days: number;
  uniqueSessions: number;
  topCountry: { name: string; code: string; count: number } | null;
  topCity: { name: string; count: number } | null;
}

const DATE_PRESETS = ['all', 'today', 'yesterday', 'last7', 'last30'] as const;

function presetRange(preset: string): { dateFrom?: string; dateTo?: string } {
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const now = new Date();
  if (preset === 'today') return { dateFrom: fmt(now), dateTo: fmt(now) };
  if (preset === 'yesterday') {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    return { dateFrom: fmt(y), dateTo: fmt(y) };
  }
  if (preset === 'last7') {
    const from = new Date(now);
    from.setDate(from.getDate() - 6);
    return { dateFrom: fmt(from), dateTo: fmt(now) };
  }
  if (preset === 'last30') {
    const from = new Date(now);
    from.setDate(from.getDate() - 29);
    return { dateFrom: fmt(from), dateTo: fmt(now) };
  }
  return {};
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'resolved': return 'Located';
    case 'pending': return 'Locating…';
    case 'failed': return 'Lookup failed';
    case 'skipped_private': return 'Local / private IP';
    case 'skipped_bot': return 'Bot (skipped)';
    default: return status || '—';
  }
}

export default function Locations() {
  const { hasRole } = useAdminAuth();
  const canDelete = hasRole(['Super Admin', 'Admin']);

  const [stats, setStats] = useState<Stats | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [country, setCountry] = useState('All');
  const [preset, setPreset] = useState<(typeof DATE_PRESETS)[number]>('all');
  const [sortBy, setSortBy] = useState('latest');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [selected, setSelected] = useState<Visit | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Visit | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const filters = useMemo(() => {
    const range = presetRange(preset);
    return {
      search: debouncedSearch || undefined,
      country: country !== 'All' ? country : undefined,
      sortBy,
      page,
      limit: pageSize,
      ...range,
    };
  }, [debouncedSearch, country, sortBy, page, pageSize, preset]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [listRes, statsRes] = await Promise.all([api.getVisits(filters), api.getVisitStats()]);
      if (listRes.success && listRes.data) {
        const data = listRes.data;
        setVisits(Array.isArray(data) ? data : data.visits || []);
        setTotal(Array.isArray(data) ? data.length : data.total || 0);
        setTotalPages(Array.isArray(data) ? 1 : data.totalPages || 1);
      } else {
        setError(listRes.error || 'Failed to load visitor locations');
      }
      if (statsRes.success && statsRes.data) setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to fetch locations', err);
      setError('Failed to load visitor locations. Please retry.');
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setCountry('All');
    setPreset('all');
    setSortBy('latest');
    setPage(1);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      const res = await api.deleteVisit(deleteTarget._id);
      if (!res.success) {
        showToast('error', res.error || 'Failed to delete record');
        return;
      }
      setVisits((prev) => prev.filter((v) => v._id !== deleteTarget._id));
      if (selected?._id === deleteTarget._id) setSelected(null);
      showToast('success', 'Record deleted');
      fetchData();
    } catch (err) {
      console.error('Failed to delete visit', err);
      showToast('error', 'Failed to delete record');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleExport = async () => {
    try {
      const base = (import.meta as any).env?.VITE_API_URL || '/api';
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (country !== 'All') params.set('country', country);
      const range = presetRange(preset);
      if (range.dateFrom) params.set('dateFrom', range.dateFrom);
      if (range.dateTo) params.set('dateTo', range.dateTo);
      const res = await fetch(`${base}/visitors/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${getAuthToken() || ''}` },
      });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'visitor-locations.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed', err);
      showToast('error', 'Export failed. Please try again.');
    }
  };

  const cards = [
    { label: 'Total visits', value: stats?.total ?? '—' },
    { label: 'Unique sessions', value: stats?.uniqueSessions ?? '—' },
    { label: 'Visits today', value: stats?.today ?? '—' },
    { label: 'Last 7 days', value: stats?.last7Days ?? '—' },
    { label: 'Top country', value: stats?.topCountry ? `${stats.topCountry.name} (${stats.topCountry.count})` : '—' },
    { label: 'Top city', value: stats?.topCity ? `${stats.topCity.name} (${stats.topCity.count})` : '—' },
  ];

  return (
    <div>
      <SEO title="Visitor Locations - Admin Panel" description="Approximate visitor locations resolved from page visits." urlPath="/admin/locations" robots="noindex, nofollow" />

      {toast && (
        <div className={`mb-4 px-4 py-2 rounded-xl text-xs font-semibold ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {toast.message}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{c.label}</p>
            <p className="font-serif text-xl font-bold text-secondary mt-1 truncate">{c.value}</p>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-slate-400 mb-4">Locations are approximate city-level estimates from IP geolocation — never exact addresses. Raw records auto-expire after 90 days.</p>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-4 flex flex-col lg:flex-row gap-3 lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search city, country, region, IP…"
            aria-label="Search visitor locations"
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary text-secondary placeholder-slate-400"
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            value={country === 'All' ? '' : country}
            onChange={(e) => { setCountry(e.target.value || 'All'); setPage(1); }}
            placeholder="Country code (e.g. IN)"
            aria-label="Filter by country code"
            className="w-40 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary text-secondary placeholder-slate-400"
          />
          <select
            value={preset}
            onChange={(e) => { setPreset(e.target.value as typeof preset); setPage(1); }}
            aria-label="Filter by date range"
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-secondary focus:outline-none focus:border-primary"
          >
            <option value="all">All time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7">Last 7 days</option>
            <option value="last30">Last 30 days</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            aria-label="Sort visits"
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-secondary focus:outline-none focus:border-primary"
          >
            <option value="latest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
          <button
            onClick={clearFilters}
            className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-secondary hover:bg-slate-100 flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-secondary text-white hover:opacity-90 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : error ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <p className="text-sm font-semibold text-rose-600">{error}</p>
          <button onClick={fetchData} className="mt-3 px-4 py-2 rounded-xl bg-secondary text-white text-xs font-bold">Retry</button>
        </div>
      ) : visits.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="font-serif text-lg font-bold text-secondary">No visitor locations yet</p>
          <p className="text-xs text-slate-500 mt-1">Visits appear here once public pages are browsed. Failed lookups show as pending/failed, never as fake locations.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th className="px-4 py-3">Date & time</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">IP address</th>
                  <th className="px-4 py-3">Page</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((v) => (
                  <tr key={v._id} className="border-b border-slate-50 hover:bg-cream/50 text-xs">
                    <td className="px-4 py-3 whitespace-nowrap font-semibold text-secondary">{formatDateTime(v.visitedAt)}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-secondary">{[v.city, v.region].filter(Boolean).join(', ') || '—'}</span>
                      <span className="block text-slate-400">{[v.country, v.countryCode].filter(Boolean).join(' · ') || 'Unknown'}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500">{v.ipAddress || '—'}</td>
                    <td className="px-4 py-3 font-mono text-slate-500 max-w-[220px] truncate">{v.pagePath}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">{statusLabel(v.locationStatus)}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setSelected(v)} aria-label="View visit details" className="p-1.5 rounded-lg text-slate-400 hover:text-secondary hover:bg-slate-100">
                          <Eye className="w-4 h-4" />
                        </button>
                        {canDelete && (
                          <button onClick={() => setDeleteTarget(v)} aria-label="Delete visit record" className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-xs font-semibold text-slate-500">
            <span>{total} record{total === 1 ? '' : 's'} · Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1.5 rounded-lg bg-slate-100 disabled:opacity-40 hover:bg-slate-200">Previous</button>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 rounded-lg bg-slate-100 disabled:opacity-40 hover:bg-slate-200">Next</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-label="Visit details">
          <div className="absolute inset-0 bg-secondary/40" onClick={() => setSelected(null)} />
          <div className="relative bg-white w-full max-w-md h-full overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <h2 className="font-serif text-xl font-bold text-secondary">Visit details</h2>
              <button onClick={() => setSelected(null)} aria-label="Close details" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <dl className="space-y-3 text-xs">
              {[
                ['Recorded (UTC)', selected.visitedAt ? new Date(selected.visitedAt).toISOString() : '—'],
                ['IP address', selected.ipAddress || '—'],
                ['Country', [selected.country, selected.countryCode].filter(Boolean).join(' / ') || '—'],
                ['Region', [selected.region, selected.regionCode].filter(Boolean).join(' / ') || '—'],
                ['City', selected.city || '—'],
                ['Coordinates (approx.)', selected.latitude !== null && selected.latitude !== undefined ? `${selected.latitude}, ${selected.longitude}` : '—'],
                ['Timezone', selected.timezone || '—'],
                ['ISP', selected.isp || '—'],
                ['Organization', selected.organization || '—'],
                ['Page visited', selected.pagePath],
                ['Referrer', selected.referrer || '—'],
                ['Browser / device', selected.userAgent || '—'],
                ['Session', selected.sessionId || '—'],
                ['Status', statusLabel(selected.locationStatus)],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col gap-0.5 border-b border-slate-50 pb-2">
                  <dt className="font-bold uppercase tracking-wider text-[10px] text-slate-400">{k}</dt>
                  <dd className="font-medium text-secondary break-all">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-[11px] text-slate-400">IP geolocation is approximate (city level). It never identifies an exact street address or person.</p>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete visit record?"
        message="This permanently removes this visit record. Raw records auto-expire after 90 days."
        isLoading={isDeleting}
      />
    </div>
  );
}
