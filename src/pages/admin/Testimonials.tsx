import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../lib/api';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { connectSocket } from '../../lib/socket';
import {
  Search, Trash2, Eye, Star, Check, XCircle, Clock, CheckCircle2,
  MessageSquare, ChevronLeft, ChevronRight
} from 'lucide-react';
import { TableSkeleton } from '../../components/ui/Skeleton';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';
import SEO from '../../components/SEO';

const STATUS_TABS = ['all', 'Pending', 'Approved', 'Rejected'];
const PAGE_SIZE = 10;

const statusBadgeClass = (status: string) => {
  if (status === 'Approved') return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
  if (status === 'Rejected') return 'bg-rose-50 text-rose-700 border border-rose-100';
  return 'bg-amber-50 text-amber-700 border border-amber-100';
};

export default function Testimonials() {
  const { currentUser } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [page, setPage] = useState(1);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchTestimonials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getAllTestimonials();
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : res.data.testimonials || [];
        setTestimonials(list);
      }
    } catch (err) {
      console.error('Failed to fetch testimonials', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  useEffect(() => {
    const role = currentUser?.role || 'Admin';
    const socket = connectSocket(role);
    const handleNewNotification = (notification: any) => {
      if (notification.relatedModule === 'Testimonial' || notification.type === 'Testimonial') {
        fetchTestimonials();
      }
    };
    socket.on('notification:new', handleNewNotification);
    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [currentUser?.role, fetchTestimonials]);

  const handleStatusChange = async (id: string, status: string) => {
    if (!id) return;
    try {
      const res = await api.updateTestimonialStatus(id, status);
      if (!res.success) {
        showToast('error', res.error || 'Failed to update status');
        return;
      }
      setTestimonials(prev => prev.map(t => (t._id === id || t.id === id ? { ...t, status } : t)));
      if (selected && (selected._id === id || selected.id === id)) {
        setSelected((prev: any) => (prev ? { ...prev, status } : null));
      }
      showToast('success', `Testimonial ${status.toLowerCase()}`);
    } catch (err) {
      console.error('Failed to update testimonial status', err);
      showToast('error', 'Failed to update status');
    }
  };

  const handleDelete = (id: string) => {
    const target = testimonials.find(t => t._id === id || t.id === id);
    setDeleteTarget(target || id);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget._id || deleteTarget.id || deleteTarget;
    setIsDeleting(true);
    try {
      const res = await api.deleteTestimonial(id);
      if (!res.success) {
        showToast('error', res.error || 'Failed to delete testimonial');
      } else {
        setTestimonials(prev => prev.filter(t => t._id !== id && t.id !== id));
        if (selected && (selected._id === id || selected.id === id)) {
          setSelected(null);
        }
        showToast('success', 'Testimonial deleted successfully');
      }
    } catch (err) {
      console.error('Failed to delete testimonial', err);
      showToast('error', 'Failed to delete testimonial');
    }
    setIsDeleting(false);
    setDeleteTarget(null);
  };

  const filtered = useMemo(() => {
    return testimonials.filter(t => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        (t.name || '').toLowerCase().includes(q) ||
        (t.city || '').toLowerCase().includes(q) ||
        (t.eventType || '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [testimonials, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const stats = useMemo(() => {
    const count = (s: string) => testimonials.filter(t => t.status === s).length;
    return {
      total: testimonials.length,
      pending: count('Pending'),
      approved: count('Approved'),
      rejected: count('Rejected'),
    };
  }, [testimonials]);

  return (
    <div className="space-y-6 relative">
      <SEO title="Testimonial Reviews - Admin Panel" description="Approve, reject, and manage testimonials submitted by clients." urlPath="/admin/testimonials" />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Testimonial"
        itemName={deleteTarget?.name ? `"${deleteTarget.name}"'s review` : 'this review'}
        isLoading={isDeleting}
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-60 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-2 ${
              toast.type === 'success'
                ? 'bg-emerald-900/90 text-white border-emerald-500'
                : 'bg-rose-900/90 text-white border-rose-500'
            }`}
          >
            {toast.type === 'success' ? (
              <Check className="w-5 h-5 text-emerald-400" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-400" />
            )}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <h3 className="font-serif text-xl sm:text-2xl font-bold text-secondary">
          Testimonial Moderation
        </h3>
        <p className="text-xs text-slate-400 font-semibold mt-0.5 font-sans">
          Review submissions, approve honest feedback, and keep your wall clean of spam.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Reviews', value: stats.total, color: 'text-secondary' },
          { label: 'Pending', value: stats.pending, color: 'text-amber-600' },
          { label: 'Approved', value: stats.approved, color: 'text-emerald-600' },
          { label: 'Rejected', value: stats.rejected, color: 'text-rose-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{s.label}</span>
            <span className={`font-serif text-2xl font-black mt-1 block ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Search name, city, event..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary text-secondary placeholder-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {STATUS_TABS.map((status) => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setPage(1); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                statusFilter === status
                  ? 'bg-secondary text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden xl:col-span-2 p-4">
          {loading ? (
            <TableSkeleton rows={5} cols={5} />
          ) : paged.length === 0 ? (
            <div className="text-center py-20 text-slate-400 flex flex-col items-center gap-3 font-sans">
              <MessageSquare className="w-12 h-12 text-slate-200 stroke-1" />
              <div>
                <p className="text-sm font-bold">No testimonials match criteria.</p>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">Try widening search tags or parameters.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-5">Reviewer</th>
                    <th className="py-4 px-5">Review</th>
                    <th className="py-4 px-5">Rating</th>
                    <th className="py-4 px-5">Status</th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium text-secondary">
                  {paged.map((t) => {
                    const id = t._id || t.id;
                    const isSelected = (selected?._id || selected?.id) === id;
                    return (
                      <tr
                        key={id}
                        className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${isSelected ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}
                        onClick={() => setSelected(t)}
                      >
                        <td className="py-4 px-5">
                          <p className="font-bold">{t.name}</p>
                          <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                            {[t.city, t.eventType].filter(Boolean).join(' • ') || '—'}
                          </span>
                        </td>
                        <td className="py-4 px-5 max-w-xs">
                          <p className="text-slate-600 line-clamp-1 font-semibold">"{t.comment}"</p>
                          <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                            Submitted: {new Date(t.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${t.rating > i ? 'fill-primary text-primary' : 'text-slate-200'}`} />
                            ))}
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${statusBadgeClass(t.status)}`}>
                            {t.status === 'Pending' && <Clock className="w-2.5 h-2.5" />}
                            {t.status === 'Approved' && <CheckCircle2 className="w-2.5 h-2.5" />}
                            {t.status === 'Rejected' && <XCircle className="w-2.5 h-2.5" />}
                            <span>{t.status}</span>
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => setSelected(t)}
                              className="p-2 border border-slate-100 hover:bg-slate-50 rounded-xl text-slate-500 cursor-pointer"
                              title="Inspect Review"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {t.status !== 'Approved' && (
                              <button
                                onClick={() => handleStatusChange(id, 'Approved')}
                                className="p-2 border border-slate-100 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-xl transition-colors cursor-pointer"
                                title="Approve"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            {t.status !== 'Rejected' && (
                              <button
                                onClick={() => handleStatusChange(id, 'Rejected')}
                                className="p-2 border border-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(id)}
                              className="p-2 border border-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
              <span className="text-[11px] font-bold text-slate-400">
                {filtered.length} review(s) • Page {safePage} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="p-2 border border-slate-100 hover:bg-slate-50 rounded-xl text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="p-2 border border-slate-100 hover:bg-slate-50 rounded-xl text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm text-left">
          {selected ? (
            <div className="space-y-5 animate-fade-in font-sans">
              <div className="flex items-start justify-between border-b border-slate-50 pb-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    Review ID: {((selected._id || selected.id) || '').toString().toUpperCase()}
                  </span>
                  <h4 className="font-serif text-lg font-bold text-secondary mt-1">{selected.name}</h4>
                  <span className="text-[11px] font-bold text-primary block mt-0.5">
                    {[selected.city, selected.eventType].filter(Boolean).join(' • ')}
                  </span>
                </div>
                <button onClick={() => setSelected(null)} className="p-1 rounded-lg hover:bg-slate-50 text-slate-400 cursor-pointer">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div>
                <span className="text-[9px] text-slate-400 font-bold block">RATING</span>
                <div className="flex items-center gap-0.5 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${selected.rating > i ? 'fill-primary text-primary' : 'text-slate-200'}`} />
                  ))}
                  <span className="text-xs font-bold text-slate-600 ml-1.5">{selected.rating}/5</span>
                </div>
              </div>

              {selected.email && (
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block">EMAIL ADDRESS</span>
                  <a href={`mailto:${selected.email}`} className="text-xs text-primary font-semibold underline mt-0.5 block">{selected.email}</a>
                </div>
              )}

              <div>
                <span className="text-[9px] text-slate-400 font-bold block">REVIEW</span>
                <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl mt-1">
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-semibold italic">"{selected.comment}"</p>
                </div>
              </div>

              <div>
                <span className="text-[9px] text-slate-400 font-bold block">SUBMITTED</span>
                <p className="text-xs font-bold text-slate-700 mt-1">{new Date(selected.createdAt).toLocaleString()}</p>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-2">
                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Moderation Actions</h5>
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
                  <button
                    onClick={() => handleStatusChange(selected._id || selected.id, 'Approved')}
                    disabled={selected.status === 'Approved'}
                    className={`py-2 px-1 rounded-xl border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      selected.status === 'Approved' ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs' : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleStatusChange(selected._id || selected.id, 'Rejected')}
                    disabled={selected.status === 'Rejected'}
                    className={`py-2 px-1 rounded-xl border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      selected.status === 'Rejected' ? 'bg-rose-500 border-rose-500 text-white shadow-xs' : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleStatusChange(selected._id || selected.id, 'Pending')}
                    disabled={selected.status === 'Pending'}
                    className={`py-2 px-1 rounded-xl border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      selected.status === 'Pending' ? 'bg-amber-500 border-amber-500 text-white shadow-xs' : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    Pending
                  </button>
                </div>
                <button
                  onClick={() => handleDelete(selected._id || selected.id)}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Review
                </button>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-slate-400 space-y-3.5">
              <MessageSquare className="w-10 h-10 text-slate-200 mx-auto stroke-1" />
              <div className="font-sans">
                <p className="text-xs font-bold text-secondary">No review selected</p>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Click any review in the table to inspect, approve, reject, or delete it.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
