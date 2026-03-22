import React, { useState, useEffect, useCallback } from "react";
import {
  Search, Plus, Filter, Camera, Edit, Trash2,
  ChevronLeft, ChevronRight, Upload, X, Loader2, AlertCircle,
} from "lucide-react";
import { StatusBadge } from "../components/shared/StatusBadge";
import {
  getStudents, createStudent, updateStudent, deleteStudent,
  type Student,
} from "../lib/api";

const COURSES = ["Computer Science", "Mathematics", "Engineering", "Physics"];

const emptyForm = {
  firstName: "", lastName: "", email: "", studentId: "", course: "Computer Science",
};

export function StudentManagement() {
  const [students, setStudents]     = useState<Student[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [saving, setSaving]         = useState(false);

  const [search, setSearch]         = useState("");
  const [filterCourse, setFilterCourse] = useState("all");
  const [currentPage, setCurrentPage]   = useState(1);
  const perPage = 8;

  const [showModal, setShowModal]   = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [form, setForm]             = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // ── fetch ────────────────────────────────────────────
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStudents();
      // Sort by studentId for consistent ordering
      setStudents(data.sort((a, b) => a.studentId.localeCompare(b.studentId)));
    } catch (err) {
      console.error("Failed to fetch students:", err);
      setError("Could not load students. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // ── filter / paginate ────────────────────────────────
  const filtered = students.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase());
    const matchCourse = filterCourse === "all" || s.course === filterCourse;
    return matchSearch && matchCourse;
  });
  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paginated  = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  // ── modal helpers ────────────────────────────────────
  const openAdd = () => {
    setEditStudent(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (s: Student) => {
    setEditStudent(s);
    const [firstName, ...rest] = s.name.split(" ");
    setForm({ firstName, lastName: rest.join(" "), email: s.email, studentId: s.studentId, course: s.course });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditStudent(null); };

  // ── save ─────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.studentId) return;
    setSaving(true);
    try {
      const payload = {
        name: `${form.firstName} ${form.lastName}`,
        email: form.email,
        studentId: form.studentId,
        course: form.course,
        faceEnrolled: editStudent?.faceEnrolled ?? false,
        status: (editStudent?.status ?? "active") as "active" | "inactive",
        attendance: editStudent?.attendance ?? 0,
      };
      if (editStudent) {
        await updateStudent(editStudent.id, payload);
      } else {
        await createStudent(payload);
      }
      await fetchStudents();
      closeModal();
    } catch (err) {
      console.error("Save student error:", err);
      alert(`Failed to save student: ${err}`);
    } finally {
      setSaving(false);
    }
  };

  // ── delete ───────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      await deleteStudent(id);
      setDeleteConfirm(null);
      await fetchStudents();
    } catch (err) {
      console.error("Delete student error:", err);
      alert(`Failed to delete student: ${err}`);
    }
  };

  // ── face enroll toggle ───────────────────────────────
  const toggleFace = async (s: Student) => {
    try {
      await updateStudent(s.id, { faceEnrolled: !s.faceEnrolled });
      await fetchStudents();
    } catch (err) {
      console.error("Face enroll error:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[1.25rem] text-slate-900" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}>
            Student Management
          </h2>
          <p className="text-[0.8125rem] text-slate-500">
            {loading ? "Loading…" : `${students.length} students registered`}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-[0.8125rem] hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Student
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[0.8125rem]">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={fetchStudents} className="ml-auto underline hover:no-underline">Retry</button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search students…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[0.8125rem] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterCourse}
            onChange={(e) => { setFilterCourse(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[0.8125rem] text-slate-600 focus:outline-none"
          >
            <option value="all">All Courses</option>
            {COURSES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-[0.8125rem]">Loading students…</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-[0.75rem] text-slate-500 font-medium">Student</th>
                  <th className="text-left py-3 px-4 text-[0.75rem] text-slate-500 font-medium">ID</th>
                  <th className="text-left py-3 px-4 text-[0.75rem] text-slate-500 font-medium hidden md:table-cell">Course</th>
                  <th className="text-left py-3 px-4 text-[0.75rem] text-slate-500 font-medium hidden lg:table-cell">Face Data</th>
                  <th className="text-left py-3 px-4 text-[0.75rem] text-slate-500 font-medium hidden sm:table-cell">Attendance</th>
                  <th className="text-left py-3 px-4 text-[0.75rem] text-slate-500 font-medium">Status</th>
                  <th className="text-right py-3 px-4 text-[0.75rem] text-slate-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-[0.8125rem] text-slate-400">
                      No students found
                    </td>
                  </tr>
                ) : paginated.map((student) => (
                  <tr key={student.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-cyan-100 rounded-full flex items-center justify-center text-[0.6875rem] text-indigo-700 flex-shrink-0 font-semibold">
                          {student.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <p className="text-[0.8125rem] text-slate-800 font-medium">{student.name}</p>
                          <p className="text-[0.6875rem] text-slate-400">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[0.8125rem] text-slate-600">{student.studentId}</td>
                    <td className="py-3 px-4 text-[0.8125rem] text-slate-600 hidden md:table-cell">{student.course}</td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      {student.faceEnrolled ? (
                        <span className="flex items-center gap-1.5 text-[0.8125rem] text-emerald-600">
                          <Camera className="w-3.5 h-3.5" /> Enrolled
                        </span>
                      ) : (
                        <button
                          onClick={() => toggleFace(student)}
                          className="flex items-center gap-1.5 text-[0.8125rem] text-amber-600 hover:text-amber-700"
                        >
                          <Upload className="w-3.5 h-3.5" /> Capture
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${student.attendance >= 90 ? "bg-emerald-500" : student.attendance >= 75 ? "bg-amber-500" : "bg-red-500"}`}
                            style={{ width: `${student.attendance}%` }}
                          />
                        </div>
                        <span className="text-[0.75rem] text-slate-600">{student.attendance}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge variant={student.status} dot>{student.status}</StatusBadge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(student)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          aria-label="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(student.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
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
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[1.125rem] text-slate-900" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}>
                {editStudent ? "Edit Student" : "Add New Student"}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[0.8125rem] text-slate-700 mb-1.5 font-medium">First Name</label>
                  <input
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[0.8125rem] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                    placeholder="John"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[0.8125rem] text-slate-700 mb-1.5 font-medium">Last Name</label>
                  <input
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[0.8125rem] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                    placeholder="Doe"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[0.8125rem] text-slate-700 mb-1.5 font-medium">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[0.8125rem] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                  placeholder="john.doe@university.edu"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[0.8125rem] text-slate-700 mb-1.5 font-medium">Student ID</label>
                <input
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[0.8125rem] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                  placeholder="STU-XXX"
                  value={form.studentId}
                  onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[0.8125rem] text-slate-700 mb-1.5 font-medium">Course</label>
                <select
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[0.8125rem] focus:outline-none"
                  value={form.course}
                  onChange={(e) => setForm({ ...form, course: e.target.value })}
                >
                  {COURSES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              {!editStudent && (
                <div>
                  <label className="block text-[0.8125rem] text-slate-700 mb-1.5 font-medium">Face Enrollment</label>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-indigo-300 transition-colors cursor-pointer">
                    <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-[0.8125rem] text-slate-600 font-medium">Capture Face Data</p>
                    <p className="text-[0.75rem] text-slate-400">Click to open camera and capture facial data</p>
                  </div>
                </div>
              )}
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
                {editStudent ? "Save Changes" : "Add Student"}
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
            <h3 className="text-[1rem] text-slate-900 font-semibold">Delete Student?</h3>
            <p className="text-[0.8125rem] text-slate-500">This action cannot be undone. The student's data and attendance history will be permanently removed.</p>
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
