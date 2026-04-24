import React, { useState, useEffect, useCallback } from "react";
import {
  Search, Plus, Filter, Edit, Trash2, BookOpen,
  ChevronLeft, ChevronRight, X, Loader2, AlertCircle, Users, Clock, MapPin,
} from "lucide-react";
import { StatusBadge } from "../components/shared/StatusBadge";
import {
  getCourses, createCourse, updateCourse, deleteCourse,
  type Course,
} from "../lib/api";

const emptyForm: { code: string; name: string; teacher: string; schedule: string; room: string; students: number; status: "active" | "inactive" } = {
  code: "", name: "", teacher: "", schedule: "", room: "", students: 0, status: "active",
};

export function AdminCourses() {
  const [courses, setCourses]       = useState<Course[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [saving, setSaving]         = useState(false);

  const [search, setSearch]         = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage]   = useState(1);
  const perPage = 8;

  const [showModal, setShowModal]   = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [form, setForm]             = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCourses();
      setCourses(data.sort((a, b) => a.code.localeCompare(b.code)));
    } catch (err) {
      console.error("Failed to fetch courses:", err);
      setError("Could not load courses. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const filtered = courses.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.teacher.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    return matchSearch && matchStatus;
  });
  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paginated  = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const openAdd = () => {
    setEditCourse(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (c: Course) => {
    setEditCourse(c);
    setForm({ code: c.code, name: c.name, teacher: c.teacher, schedule: c.schedule, room: c.room, students: c.students, status: c.status });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditCourse(null); };

  const handleSave = async () => {
    if (!form.code || !form.name) return;
    setSaving(true);
    try {
      if (editCourse) {
        await updateCourse(editCourse.id, form);
      } else {
        await createCourse(form);
      }
      await fetchCourses();
      closeModal();
    } catch (err) {
      console.error("Save course error:", err);
      alert(`Failed to save course: ${err}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCourse(id);
      setDeleteConfirm(null);
      await fetchCourses();
    } catch (err) {
      console.error("Delete course error:", err);
      alert(`Failed to delete course: ${err}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[1.25rem] text-slate-900" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}>
            Course Management
          </h2>
          <p className="text-[0.8125rem] text-slate-500">
            {loading ? "Loading…" : `${courses.length} courses registered`}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-[0.8125rem] hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Course
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[0.8125rem]">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={fetchCourses} className="ml-auto underline hover:no-underline">Retry</button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search courses…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[0.8125rem] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[0.8125rem] text-slate-600 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Course Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-[0.8125rem]">Loading courses…</span>
        </div>
      ) : paginated.length === 0 ? (
        <div className="text-center py-16 text-[0.8125rem] text-slate-400">No courses found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginated.map((course) => (
            <div key={course.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-200 hover:shadow-sm transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-cyan-100 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-[0.9375rem] text-slate-900" style={{ fontWeight: 600 }}>{course.code}</p>
                    <p className="text-[0.75rem] text-slate-500 mt-0.5">{course.name}</p>
                  </div>
                </div>
                <StatusBadge variant={course.status} dot>{course.status}</StatusBadge>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-[0.8125rem] text-slate-600">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{course.teacher}</span>
                </div>
                <div className="flex items-center gap-2 text-[0.8125rem] text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{course.schedule || "Not scheduled"}</span>
                </div>
                <div className="flex items-center gap-2 text-[0.8125rem] text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{course.room || "TBD"}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-[0.8125rem] text-indigo-600" style={{ fontWeight: 500 }}>
                  {course.students} students
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(course)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    aria-label="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(course.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
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
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[1.125rem] text-slate-900" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}>
                {editCourse ? "Edit Course" : "Add New Course"}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[0.8125rem] text-slate-700 mb-1.5 font-medium">Course Code</label>
                  <input
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[0.8125rem] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                    placeholder="CS-301"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[0.8125rem] text-slate-700 mb-1.5 font-medium">Status</label>
                  <select
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[0.8125rem] focus:outline-none"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "inactive" })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[0.8125rem] text-slate-700 mb-1.5 font-medium">Course Name</label>
                <input
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[0.8125rem] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                  placeholder="Data Structures & Algorithms"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[0.8125rem] text-slate-700 mb-1.5 font-medium">Instructor</label>
                <input
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[0.8125rem] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                  placeholder="Dr. Smith"
                  value={form.teacher}
                  onChange={(e) => setForm({ ...form, teacher: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[0.8125rem] text-slate-700 mb-1.5 font-medium">Schedule</label>
                  <input
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[0.8125rem] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                    placeholder="Mon/Wed 9:00 AM"
                    value={form.schedule}
                    onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[0.8125rem] text-slate-700 mb-1.5 font-medium">Room</label>
                  <input
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[0.8125rem] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                    placeholder="Room 204"
                    value={form.room}
                    onChange={(e) => setForm({ ...form, room: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[0.8125rem] text-slate-700 mb-1.5 font-medium">Students Enrolled</label>
                <input
                  type="number"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[0.8125rem] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                  placeholder="30"
                  value={form.students}
                  onChange={(e) => setForm({ ...form, students: Number(e.target.value) })}
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
                {editCourse ? "Save Changes" : "Add Course"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-[1rem] text-slate-900 font-semibold">Delete Course?</h3>
            <p className="text-[0.8125rem] text-slate-500">This action cannot be undone. The course and its schedule will be permanently removed.</p>
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
