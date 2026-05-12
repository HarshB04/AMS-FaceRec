import React, { useState, useEffect, useCallback, useTransition, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Search, Plus, Filter, Camera, Edit, Trash2,
  ChevronLeft, ChevronRight, Upload, Loader2, AlertCircle,
} from "lucide-react";
import { StatusBadge } from "../components/shared/StatusBadge";
import {
  getStudents, createStudent, updateStudent, deleteStudent,
  type Student,
} from "../lib/api";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

const COURSES = ["Computer Science", "Mathematics", "Engineering", "Physics"];

const emptyForm = {
  firstName: "", lastName: "", email: "", studentId: "", course: "Computer Science", faceEnrolled: false, password: ""
};

export function StudentManagement() {
  const [students, setStudents]     = useState<Student[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [saving, setSaving]         = useState(false);

  const [search, setSearch]         = useState("");
  const [filterCourse, setFilterCourse] = useState("all");
  const [isPending, startTransition]    = useTransition();
  const parentRef = useRef<HTMLDivElement>(null);

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

  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64, // approximate height of a table row with avatars
    overscan: 10,
  });

  // ── modal helpers ────────────────────────────────────
  const openAdd = () => {
    setEditStudent(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (s: Student) => {
    setEditStudent(s);
    const [firstName, ...rest] = s.name.split(" ");
    setForm({ firstName, lastName: rest.join(" "), email: s.email, studentId: s.studentId, course: s.course, faceEnrolled: s.faceEnrolled, password: "" });
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
        faceEnrolled: editStudent?.faceEnrolled ?? form.faceEnrolled,
        status: (editStudent?.status ?? "active") as "active" | "inactive",
        attendance: editStudent?.attendance ?? 0,
        password: form.password || undefined,
      };
      if (editStudent) {
        await updateStudent(editStudent.id, payload);
      } else {
        if (!form.password) throw new Error("Password is required for new students");
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

  const [enrolling, setEnrolling] = useState(false);
  const [enrollStream, setEnrollStream] = useState("");

  const handleFlaskEnroll = async () => {
    if (!form.studentId && !form.firstName) {
        alert("Please enter a SBRN or First Name first!");
        return;
    }

    try {
      await fetch("http://localhost:5000/");
    } catch (err) {
      alert("Python Face Engine is not running. Please start the server on port 5000.");
      return;
    }

    const targetId = form.studentId || form.firstName;
    setEnrolling(true);
    setEnrollStream(`http://localhost:5000/enroll_feed?name=${encodeURIComponent(targetId)}&t=${Date.now()}`);

    const poll = setInterval(async () => {
      try {
        const res = await fetch("http://localhost:5000/enroll_status");
        const data = await res.json();
        if (!data.active && data.count >= 100) {
          clearInterval(poll);
          setEnrolling(false);
          setEnrollStream("");
          setForm({ ...form, faceEnrolled: true });
        }
      } catch { /* server busy */ }
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Student Management</h2>
          <p className="text-sm text-slate-500">
            {loading ? "Loading…" : `${students.length} students registered`}
          </p>
        </div>
        <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Add Student
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={fetchStudents} className="ml-auto underline hover:no-underline">Retry</button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search students…"
            onChange={(e) => startTransition(() => setSearch(e.target.value))}
            className="pl-9 bg-slate-50 border-slate-200"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <Select value={filterCourse} onValueChange={(val) => startTransition(() => setFilterCourse(val))}>
            <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {COURSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading students…</span>
          </div>
        ) : (
          <div ref={parentRef} className="overflow-auto max-h-[600px]">
            <Table className="relative w-full">
              <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>SBRN</TableHead>
                  <TableHead className="hidden md:table-cell">Course</TableHead>
                  <TableHead className="hidden lg:table-cell">Face Data</TableHead>
                  <TableHead className="hidden sm:table-cell">Attendance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  position: 'relative'
                }}
              >
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-sm text-slate-400">
                      No records found. Click 'Add Student' to get started.
                    </TableCell>
                  </TableRow>
                ) : virtualizer.getVirtualItems().map((virtualRow) => {
                  const student = filtered[virtualRow.index];
                  return (
                    <TableRow 
                      key={student.id}
                      className="absolute w-full flex items-center border-b border-slate-50"
                      style={{
                        top: 0,
                        left: 0,
                        transform: `translateY(${virtualRow.start}px)`,
                        height: `${virtualRow.size}px`
                      }}
                    >
                      <TableCell className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs text-blue-700 font-semibold flex-shrink-0">
                            {student.name.split(" ").map(n => n[0]).join("")}
                          </div>
                          <div className="truncate">
                            <p className="text-sm text-slate-900 font-medium truncate">{student.name}</p>
                            <p className="text-xs text-slate-500 truncate">{student.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="flex-1 text-sm text-slate-600 truncate">{student.studentId}</TableCell>
                      <TableCell className="flex-1 hidden md:table-cell text-sm text-slate-600 truncate">{student.course}</TableCell>
                      <TableCell className="flex-1 hidden lg:table-cell">
                        {student.faceEnrolled ? (
                          <span className="flex items-center gap-1.5 text-sm text-emerald-600">
                            <Camera className="w-3.5 h-3.5" /> Enrolled
                          </span>
                        ) : (
                          <button onClick={() => toggleFace(student)} className="flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700">
                            <Upload className="w-3.5 h-3.5" /> Capture
                          </button>
                        )}
                      </TableCell>
                      <TableCell className="flex-1 hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden flex-shrink-0">
                            <div
                              className={`h-full rounded-full ${student.attendance >= 90 ? "bg-emerald-500" : student.attendance >= 75 ? "bg-amber-500" : "bg-red-500"}`}
                              style={{ width: `${student.attendance}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-600">{student.attendance}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="flex-1">
                        <StatusBadge variant={student.status} dot>{student.status}</StatusBadge>
                      </TableCell>
                      <TableCell className="flex-1 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(student)} className="text-slate-400 hover:text-blue-600">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(student.id)} className="text-slate-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {!loading && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
            <p className="text-sm text-slate-500">
              {filtered.length} matching {filtered.length === 1 ? "student" : "students"}
            </p>
          </div>
        )}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editStudent ? "Edit Student" : "Create Student"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} placeholder="John" />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} placeholder="Doe" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="john@example.edu" />
            </div>
            <div className="space-y-2">
              <Label>SBRN</Label>
              <Input value={form.studentId} onChange={e => setForm({...form, studentId: e.target.value})} placeholder="SBRN-001" />
            </div>
            <div className="space-y-2">
              <Label>Course</Label>
              <Select value={form.course} onValueChange={val => setForm({...form, course: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {COURSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {!editStudent && (
              <div className="space-y-2">
                <Label>Login Password</Label>
                <Input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Set initial password" />
              </div>
            )}
            {!editStudent && (
              <div className="space-y-2">
                <Label>Face Enrollment</Label>
                {enrolling && enrollStream ? (
                  <div className="border-2 border-orange-300 rounded-xl overflow-hidden bg-black">
                    <img src={enrollStream} alt="Enrolling..." className="w-full aspect-video object-cover" />
                    <p className="text-center text-orange-500 text-[0.75rem] py-2 animate-pulse">Capturing face data... Look at the camera</p>
                  </div>
                ) : (
                  <div 
                    onClick={handleFlaskEnroll}
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${form.faceEnrolled ? "border-emerald-400 bg-emerald-50" : "border-slate-200 hover:border-blue-300"}`}
                  >
                    <Camera className={`w-8 h-8 mx-auto mb-2 ${form.faceEnrolled ? "text-emerald-500" : "text-slate-400"}`} />
                    <p className={`text-sm font-medium ${form.faceEnrolled ? "text-emerald-700" : "text-slate-600"}`}>
                      {form.faceEnrolled ? "Face Data Captured! ✓" : "Capture Face Data"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editStudent ? "Save Changes" : "Create Student"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Student?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the record.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
