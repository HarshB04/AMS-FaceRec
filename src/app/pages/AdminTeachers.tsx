import React, { useState, useEffect, useCallback } from "react";
import {
  Search, Plus, Edit, Trash2, Mail,
  ChevronLeft, ChevronRight, X, Loader2, AlertCircle,
} from "lucide-react";
import {
  getInstructors, createInstructor, updateInstructor, deleteInstructor,
  type Instructor,
} from "../lib/api";

const emptyForm = { name: "", email: "" };

export function AdminTeachers() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [saving, setSaving]           = useState(false);

  const [search, setSearch]           = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 8;

  const [showModal, setShowModal]     = useState(false);
  const [editInstr, setEditInstr]     = useState<Instructor | null>(null);
  const [form, setForm]               = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchInstructors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInstructors();
      setInstructors(data.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      console.error("Failed to fetch instructors:", err);
      setError("Could not load teachers. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInstructors(); }, [fetchInstructors]);

  const filtered = instructors.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.email.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paginated  = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const openAdd = () => {
    setEditInstr(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (i: Instructor) => {
    setEditInstr(i);
    setForm({ name: i.name, email: i.email });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditInstr(null); };

  const handleSave = async () => {
    if (!form.name || !form.email) return;
    setSaving(true);
    try {
      if (editInstr) {
        await updateInstructor(editInstr.id, form);
      } else {
        await createInstructor(form);
      }
      await fetchInstructors();
      closeModal();
    } catch (err) {
      console.error("Save instructor error:", err);
      alert(`Failed to save teacher: ${err}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteInstructor(id);
      setDeleteConfirm(null);
      await fetchInstructors();
    } catch (err) {
      console.error("Delete instructor error:", err);
      alert(`Failed to delete teacher: ${err}`);
    }
  };

  // Generate initials and a deterministic color
  const getColor = (name: string) => {
    const colors = [
      "from-indigo-500 to-cyan-400",
      "from-emerald-500 to-teal-400",
      "from-violet-500 to-purple-400",
      "from-amber-500 to-orange-400",
      "from-rose-500 to-pink-400",
      "from-sky-500 to-blue-400",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[1.25rem] text-slate-900" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}>
            Teacher Management
          </h2>
          <p className="text-[0.8125rem] text-slate-500">
            {loading ? "Loading…" : `${instructors.length} teachers registered`}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-[0.8125rem] hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Teacher
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[0.8125rem]">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={fetchInstructors} className="ml-auto underline hover:no-underline">Retry</button>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search teachers…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[0.8125rem] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
          />
        </div>
      </div>

      {/* Teacher Cards */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-[0.8125rem]">Loading teachers…</span>
        </div>
      ) : paginated.length === 0 ? (
        <div className="text-center py-16 text-[0.8125rem] text-slate-400">No teachers found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginated.map((instructor) => (
            <div key={instructor.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-200 hover:shadow-sm transition-all group text-center">
              <div className={`w-14 h-14 bg-gradient-to-br ${getColor(instructor.name)} rounded-full flex items-center justify-center text-white text-[1rem] mx-auto mb-3`} style={{ fontWeight: 700 }}>
                {instructor.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <p className="text-[0.9375rem] text-slate-900 mb-1" style={{ fontWeight: 600 }}>{instructor.name}</p>
              <div className="flex items-center justify-center gap-1.5 text-[0.75rem] text-slate-400 mb-4">
                <Mail className="w-3 h-3" />
                <span>{instructor.email}</span>
              </div>

              <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-3 border-t border-slate-100">
                <button
                  onClick={() => openEdit(instructor)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  aria-label="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteConfirm(instructor.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && (
        <div className="flex items-center justify-between">
          <p className="text-[0.8125rem] text-slate-500">
            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-30"
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 rounded-lg text-[0.8125rem] transition-colors ${
                  currentPage === i + 1 ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-30"
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[1.125rem] text-slate-900" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}>
                {editInstr ? "Edit Teacher" : "Add New Teacher"}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[0.8125rem] text-slate-700 mb-1.5 font-medium">Full Name</label>
                <input
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[0.8125rem] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                  placeholder="Dr. Smith"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[0.8125rem] text-slate-700 mb-1.5 font-medium">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[0.8125rem] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                  placeholder="dr.smith@university.edu"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={closeModal}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-[0.8125rem] hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-[0.8125rem] hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editInstr ? "Save Changes" : "Add Teacher"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-[1rem] text-slate-900 font-semibold">Delete Teacher?</h3>
            <p className="text-[0.8125rem] text-slate-500">This will remove the teacher and all their course assignments permanently.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-[0.8125rem] hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-[0.8125rem] hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
