import React, { useState, useEffect, useCallback, useTransition, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Search, Plus, Filter, Camera, Edit, Trash2,
  ChevronLeft, ChevronRight, Upload, Loader2, AlertCircle,
  CheckCircle2, X, Wifi, WifiOff,
} from "lucide-react";
import { StatusBadge } from "../components/shared/StatusBadge";
import {
  getStudents, createStudent, updateStudent, deleteStudent,
  type Student,
} from "../lib/api";
import { backendFaceEnrollComplete, FLASK_URL } from "@/app/lib/backendApi";

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

  // ── face enroll modal state ─────────────────────────
  const [faceModalStudent, setFaceModalStudent] = useState<Student | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollCount, setEnrollCount] = useState(0);
  const [enrollDone, setEnrollDone] = useState(false);
  const [enrollError, setEnrollError] = useState("");
  const [flaskOnline, setFlaskOnline] = useState<boolean | null>(null);
  const [enrollSessionId, setEnrollSessionId] = useState<number>(Date.now());
  const enrollPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const openFaceModal = async (s: Student) => {
    setFaceModalStudent(s);
    setEnrolling(false);
    setEnrollCount(0);
    setEnrollDone(false);
    setEnrollError("");
    setEnrollSessionId(Date.now());

    // Ping Flask
    try {
      const r = await fetch(`${FLASK_URL}/`, { signal: AbortSignal.timeout(2000) });
      setFlaskOnline(r.ok);
    } catch {
      setFlaskOnline(false);
    }
  };

  const closeFaceModal = () => {
    if (enrollPollRef.current) clearInterval(enrollPollRef.current);
    setFaceModalStudent(null);
    setEnrolling(false);
    setEnrollCount(0);
    setEnrollDone(false);
    setEnrollError("");
    // Stop the Flask stream
    fetch(`${FLASK_URL}/stop`, { method: "POST" }).catch(() => {});
  };

  const startEnrollment = (sbrn: string) => {
    setEnrolling(true);
    setEnrollError("");
    setEnrollCount(0);

    // Poll Flask /enroll_status every 500ms
    enrollPollRef.current = setInterval(async () => {
      try {
        const r = await fetch(`${FLASK_URL}/enroll_status`);
        const data: { count: number; active: boolean } = await r.json();
        setEnrollCount(data.count);

        if (!data.active && data.count >= 100) {
          clearInterval(enrollPollRef.current!);
          // Notify Express backend to persist face_enrolled = true
          try {
            await backendFaceEnrollComplete(sbrn);
            setEnrollDone(true);
            setEnrolling(false);
            // Update local student list
            setStudents((prev) =>
              prev.map((st) =>
                st.studentId === sbrn ? { ...st, faceEnrolled: true } : st
              )
            );
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Unknown error";
            setEnrollError(`Backend error: ${msg}`);
            setEnrolling(false);
          }
        }
      } catch {
        /* Flask temporarily busy — ignore */
      }
    }, 500);
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
                          <button
                            onClick={() => openFaceModal(student)}
                            className="flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 hover:underline"
                            title={`Capture face for ${student.name}`}
                          >
                            <Upload className="w-3.5 h-3.5" /> Capture Face
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
                          {!student.faceEnrolled && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openFaceModal(student)}
                              className="text-slate-400 hover:text-amber-600"
                              title="Capture face data"
                            >
                              <Camera className="w-4 h-4" />
                            </Button>
                          )}
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
            {!editStudent && (
              <div className="space-y-2">
                <Label>Login Password</Label>
                <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Set initial password" className="w-full border rounded-md px-3 py-2 text-sm" />
              </div>
            )}
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

      {/* ── Face Enrollment Modal ─────────────────────────────────────────── */}
      <Dialog open={!!faceModalStudent} onOpenChange={(open) => !open && closeFaceModal()}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-amber-500" />
              Face Enrollment
              {faceModalStudent && (
                <span className="font-mono text-sm bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                  {faceModalStudent.studentId}
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              {faceModalStudent?.name} — Capture 100 frames to complete enrollment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Flask status */}
            {flaskOnline === false && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <WifiOff className="w-4 h-4 flex-shrink-0" />
                Python Face Engine is <strong>offline</strong>. Start it with{" "}
                <code className="bg-red-100 px-1 rounded">python face_engine/server.py</code>
              </div>
            )}
            {flaskOnline === true && !enrolling && !enrollDone && (
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
                <Wifi className="w-4 h-4" /> Face Engine is online and ready.
              </div>
            )}

            {/* Error */}
            {enrollError && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle className="w-4 h-4" /> {enrollError}
              </div>
            )}

            {/* Video stream */}
            {faceModalStudent && (enrolling || enrollDone) && (
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-black aspect-video relative">
                {!enrollDone && (
                  <img
                    src={`${FLASK_URL}/enroll_feed?name=${encodeURIComponent(faceModalStudent.studentId)}&t=${enrollSessionId}`}
                    alt="Face capture stream"
                    className="w-full h-full object-cover"
                  />
                )}
                {enrollDone && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-emerald-950 text-emerald-300">
                    <CheckCircle2 className="w-16 h-16 mb-3" />
                    <p className="text-lg font-semibold">Enrollment Complete!</p>
                    <p className="text-sm opacity-75">Face data saved for {faceModalStudent.name}</p>
                  </div>
                )}
              </div>
            )}

            {/* Progress bar */}
            {enrolling && !enrollDone && (
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Frames captured</span>
                  <span className="font-mono">{enrollCount} / 100</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-200"
                    style={{ width: `${Math.min(100, enrollCount)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeFaceModal}>
              {enrollDone ? <><X className="w-4 h-4 mr-1" /> Close</> : "Cancel"}
            </Button>
            {!enrollDone && faceModalStudent && (
              <Button
                onClick={() => startEnrollment(faceModalStudent.studentId)}
                disabled={enrolling || flaskOnline === false}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                {enrolling ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Capturing…</>
                ) : (
                  <><Camera className="w-4 h-4 mr-2" /> Start Capture</>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
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

