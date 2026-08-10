import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  Edit3,
  Eye,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  X,
  Layers,
  Briefcase,
} from "lucide-react";
import { api } from "../../lib/api";
import DeleteConfirmModal from "../../components/ui/DeleteConfirmModal";
import { slugify } from "../../lib/slugify";
import SEO from "../../components/SEO";
import ServicesAdminTabs from "../../components/admin/ServicesAdminTabs";

interface CategoryItem {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  status: string;
  displayOrder: number;
  subCategoryCount?: number;
  serviceCount?: number;
  createdAt?: string;
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [pendingStatus, setPendingStatus] = useState<string>("All");
  const [activeStatus, setActiveStatus] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("oldest");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<CategoryItem | null>(null);
  const [viewingItem, setViewingItem] = useState<CategoryItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const slugManuallyEdited = useRef(false);

  const [formData, setFormData] = useState<Partial<CategoryItem>>({
    name: "",
    slug: "",
    description: "",
    image: "",
    status: "Active",
    displayOrder: 0,
  });

  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {
        search: searchQuery || undefined,
        status: activeStatus !== "All" ? activeStatus : undefined,
        sortBy,
        page,
        limit: 10,
      };
      Object.keys(params).forEach((k) => {
        if (params[k] === undefined) delete params[k];
      });
      const res = await api.getCategories(params);
      if (res.success && res.data) {
        const d = res.data;
        setCategories(d.categories || []);
        setTotalCount(d.total || 0);
        setTotalPages(d.totalPages || 1);
        if ((d.categories || []).length === 0 && page > 1) setPage(1);
      } else {
        setError(res.error || "Failed to fetch categories");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [activeStatus, sortBy, page]);

  const handleApplyFilters = () => {
    setActiveStatus(pendingStatus);
    setPage(1);
  };

  const handleResetFilters = () => {
    setPendingStatus("All");
    setActiveStatus("All");
    setSearchQuery("");
    setPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCategories();
  };

  const handleNameChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      name: val,
      slug: slugManuallyEdited.current ? prev.slug : slugify(val),
    }));
  };

  const handleOpenCreate = () => {
    slugManuallyEdited.current = false;
    setEditingItem(null);
    setFormData({ name: "", slug: "", description: "", image: "", status: "Active", displayOrder: 0 });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: CategoryItem) => {
    slugManuallyEdited.current = true;
    setEditingItem(item);
    setFormData({
      name: item.name,
      slug: item.slug,
      description: item.description || "",
      image: item.image || "",
      status: item.status || "Active",
      displayOrder: item.displayOrder ?? 0,
    });
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      showToast("error", "Please fill in the Category Name.");
      return;
    }
    const slugValue = formData.slug?.trim() || slugify(formData.name || "");
    if (!slugValue) {
      showToast("error", "Slug is required.");
      return;
    }
    const payload = {
      ...formData,
      name: formData.name.trim(),
      slug: slugValue,
      displayOrder: Number(formData.displayOrder) || 0,
    };
    try {
      const id = editingItem?._id || editingItem?.id;
      let res;
      if (id) {
        res = await api.updateCategory(id, payload);
      } else {
        res = await api.createCategory(payload);
      }
      if (res.success) {
        showToast("success", id ? "Category updated successfully" : "Category created successfully");
        setIsFormOpen(false);
        fetchCategories();
      } else {
        showToast("error", res.error || "Operation failed");
      }
    } catch (err: any) {
      showToast("error", err.message || "An error occurred");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const res = await api.deleteCategory(deletingId);
      if (res.success) {
        showToast("success", "Category deleted successfully");
        fetchCategories();
      } else {
        showToast("error", res.error || "Failed to delete category");
      }
    } catch (err: any) {
      showToast("error", err.message || "Error deleting category");
    }
    setIsDeleting(false);
    setDeletingId(null);
  };

  const handleToggleStatus = async (item: CategoryItem) => {
    const id = item._id || item.id;
    if (!id) return;
    const newStatus = item.status === "Active" ? "Inactive" : "Active";
    try {
      const res = await api.updateCategory(id, { status: newStatus });
      if (res.success) {
        showToast("success", newStatus === "Active" ? "Category activated" : "Category deactivated");
        fetchCategories();
      }
    } catch (_) {
      showToast("error", "Failed to update status");
    }
  };

  const deletingName = categories.find((c) => (c._id || c.id) === deletingId)?.name || "this category";

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <SEO title="Category Management - Admin Panel" description="Manage service categories for the catering services module." urlPath="/admin/services/categories" />
      <ServicesAdminTabs />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-2 ${
              toast.type === "success" ? "bg-emerald-900/90 text-white border-emerald-500" : "bg-rose-900/90 text-white border-rose-500"
            }`}
          >
            {toast.type === "success" ? <Check className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-primary/10 text-primary">
              <FolderOpen className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-serif font-bold text-secondary">Category Management</h1>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Organize services into dynamic, searchable categories.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-secondary font-bold text-xs sm:text-sm shadow-md hover:bg-primary/90 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add New Category
        </button>
      </div>

      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="flex-1 relative min-w-[280px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search categories by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-primary font-sans"
            />
          </form>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500">Status:</label>
              <select
                value={pendingStatus}
                onChange={(e) => setPendingStatus(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-slate-50 focus:outline-none focus:border-primary"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500">Sort:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-slate-50 focus:outline-none focus:border-primary"
              >
                <option value="oldest">Oldest</option>
                <option value="latest">Latest</option>
                <option value="name">Name A-Z</option>
                <option value="displayOrder">Display Order</option>
              </select>
            </div>

            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 rounded-xl bg-secondary text-white font-bold text-xs hover:bg-secondary/90 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Filter className="w-3.5 h-3.5" />
              Apply Filters
            </button>

            {(activeStatus !== "All" || searchQuery) && (
              <button
                onClick={handleResetFilters}
                className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 font-medium text-xs hover:bg-slate-200 transition-all cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-sm font-semibold">Loading categories...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-rose-500 space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto text-rose-400" />
            <p className="text-sm font-bold">{error}</p>
            <button onClick={fetchCategories} className="text-xs text-primary underline mt-2 cursor-pointer">Retry</button>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <FolderOpen className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-base font-bold text-slate-600">No categories found</p>
            <p className="text-xs text-slate-400">Try adjusting your filters or add a new category.</p>
            <button onClick={handleOpenCreate} className="px-4 py-2 rounded-xl bg-primary text-secondary text-xs font-bold mt-2 cursor-pointer">
              Create First Category
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="py-3.5 pl-4 pr-2">Category</th>
                  <th className="py-3.5 px-4">Slug</th>
                  <th className="py-3.5 px-4">Sub-Cats</th>
                  <th className="py-3.5 px-4">Services</th>
                  <th className="py-3.5 px-4">Order</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-sans text-slate-700">
                {categories.map((cat) => {
                  const id = cat._id || cat.id || "";
                  return (
                    <tr key={id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 pl-4 pr-2">
                        <div className="flex items-center gap-3">
                          {cat.image ? (
                            <img src={cat.image} alt={cat.name} className="w-12 h-10 object-cover rounded-lg border border-slate-200 shrink-0" />
                          ) : (
                            <div className="w-12 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                              <FolderOpen className="w-5 h-5" />
                            </div>
                          )}
                          <div className="truncate">
                            <p className="font-bold text-slate-900 truncate leading-snug">{cat.name}</p>
                            <span className="text-[10px] text-slate-400 font-mono">/{cat.slug}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">{cat.slug}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold text-[10px]">
                          <Layers className="w-3 h-3" /> {cat.subCategoryCount ?? 0}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px]">
                          <Briefcase className="w-3 h-3" /> {cat.serviceCount ?? 0}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">{cat.displayOrder ?? 0}</td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleStatus(cat)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide transition-all cursor-pointer ${
                            cat.status === "Active"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-rose-100 text-rose-800 border border-rose-200"
                          }`}
                        >
                          {cat.status}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingItem(cat)}
                            className="p-1.5 text-slate-500 hover:text-secondary hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Quick View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(cat)}
                            className="p-1.5 text-slate-500 hover:text-primary hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Category"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingId(id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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

        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing page <b>{page}</b> of <b>{totalPages}</b> ({totalCount} categories)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-secondary/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h2 className="text-lg font-serif font-bold text-secondary">
                {editingItem ? "Edit Category" : "Create New Category"}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ""}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g., Catering Services"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-primary text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Slug (Auto-generated)</label>
                  <input
                    type="text"
                    value={formData.slug || ""}
                    onChange={(e) => {
                      slugManuallyEdited.current = true;
                      setFormData({ ...formData, slug: e.target.value });
                    }}
                    placeholder="e.g., catering-services"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-[11px]"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Auto-generated from name. Can be edited manually.</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status || "Active"}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-primary text-xs bg-slate-50"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={formData.displayOrder ?? 0}
                    onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-primary text-xs"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Lower numbers appear first.</p>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Short description of this category..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-primary text-xs resize-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Image URL (Optional)</label>
                  <input
                    type="text"
                    value={formData.image || ""}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-primary text-xs"
                  />
                  {formData.image && (
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="mt-2 h-28 w-full object-cover rounded-xl border border-slate-200"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-primary text-secondary font-bold hover:bg-primary/90 cursor-pointer shadow-sm">
                  {editingItem ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        itemName={deletingName}
        message="Deleting a category that contains sub-categories or services is not allowed. Reassign or delete those records first."
        isLoading={isDeleting}
      />

      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-secondary/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-primary uppercase">{viewingItem.status}</span>
              <button onClick={() => setViewingItem(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <h2 className="text-xl font-serif font-bold text-secondary">{viewingItem.name}</h2>
            <p className="text-[11px] font-mono text-slate-400">/{viewingItem.slug}</p>
            {viewingItem.image && (
              <img src={viewingItem.image} alt={viewingItem.name} className="w-full h-44 object-cover rounded-xl border border-slate-200" />
            )}
            {viewingItem.description && <p className="text-xs text-slate-600 leading-relaxed">{viewingItem.description}</p>}
            <div className="flex gap-4 text-xs">
              <span className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold">
                {viewingItem.subCategoryCount ?? 0} Sub-Categories
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-bold">
                {viewingItem.serviceCount ?? 0} Services
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-bold">
                Order: {viewingItem.displayOrder ?? 0}
              </span>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setViewingItem(null)} className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer">
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
