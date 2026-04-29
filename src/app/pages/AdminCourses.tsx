import React, { useState, useEffect, useCallback } from "react";
import {
  Search, Plus, Filter, Edit, Trash2, Users, Clock, MapPin,
  ChevronLeft, ChevronRight, Loader2, AlertCircle, UserPlus, CheckCircle
} from "lucide-react";
import { StatusBadge } from "../components/shared/StatusBadge";
import {
  getCourses, createCourse, updateCourse, deleteCourse,
  getStudents, updateStudent,
  type Course, type Student
} from "../lib/api";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

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

  // ── Enrollment State ─────────────────────────────────
  const [enrollCourse, setEnrollCourse] = useState<Course | null>(null);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [enrollSearch, setEnrollSearch] = useState("");

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

  // ── CRUD Helpers ─────────────────────────────────────
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

  // ── Enrollment logic ─────────────────────────────────
  const openEnrollment = async (c: Course) => {
    setEnrollCourse(c);
    setLoadingStudents(true);
    setEnrollSearch("");
    try {
      const data = await getStudents();
      setAllStudents(data);
    } catch (err) {
      console.error("Failed to fetch students for enrollment", err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const closeEnrollment = () => { setEnrollCourse(null); setAllStudents([]); };

  const toggleStudentEnrollment = async (student: Student) => {
    if (!enrollCourse) return;
    const isEnrolled = student.course === enrollCourse.name;
    const newCourse = isEnrolled ? "Unassigned" : enrollCourse.name;
    
    // Optimistic update
    setAllStudents(prev => prev.map(s => s.id === student.id ? { ...s, course: newCourse } : s));
    
    try {
      await updateStudent(student.id, { course: newCourse });
    } catch (err) {
      console.error("Failed to update student course", err);
      // Revert on failure
      setAllStudents(prev => prev.map(s => s.id === student.id ? { ...s, course: student.course } : s));
    }
  };

  const filteredStudents = allStudents.filter(s => 
    s.name.toLowerCase().includes(enrollSearch.toLowerCase()) || 
    s.studentId.toLowerCase().includes(enrollSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Course Management</h2>
          <p className="text-sm text-slate-500">
            {loading ? "Loading…" : `${courses.length} courses registered`}
          </p>
        </div>
        <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Add Course
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={fetchCourses} className="ml-auto underline hover:no-underline">Retry</button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search courses…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="pl-9 bg-slate-50 border-slate-200"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <Select value={filterStatus} onValueChange={(val) => { setFilterStatus(val); setCurrentPage(1); }}>
            <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Course Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading courses…</span>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Course Name</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead className="hidden md:table-cell">Schedule</TableHead>
                <TableHead className="hidden lg:table-cell">Room</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-sm text-slate-400">
                    No records found. Click 'Add Course' to get started.
                  </TableCell>
                </TableRow>
              ) : paginated.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>
                    <div>
                      <p className="text-sm text-slate-900 font-medium">{course.code}</p>
                      <p className="text-xs text-slate-500">{course.name}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{course.teacher}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{course.schedule || "Not scheduled"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{course.room || "TBD"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge variant={course.status} dot>{course.status}</StatusBadge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEnrollment(course)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 px-2 text-xs">
                        <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                        Enroll
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(course)} className="text-slate-400 hover:text-blue-600 h-8 w-8">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(course.id)} className="text-slate-400 hover:text-red-600 h-8 w-8">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {!loading && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Showing {filtered.length === 0 ? 0 : (currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editCourse ? "Edit Course" : "Add New Course"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Course Code</Label>
                <Input placeholder="CS-301" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={val => setForm({...form, status: val as "active" | "inactive"})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Course Name</Label>
              <Input placeholder="Data Structures & Algorithms" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Instructor</Label>
              <Input placeholder="Dr. Smith" value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Schedule</Label>
                <Input placeholder="Mon/Wed 9:00 AM" value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Room</Label>
                <Input placeholder="Room 204" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editCourse ? "Save Changes" : "Add Course"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Course?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The course and its schedule will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enrollment Dialog */}
      <Dialog open={!!enrollCourse} onOpenChange={(open) => !open && closeEnrollment()}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Enroll Students</DialogTitle>
            <DialogDescription>
              Assign students to <span className="font-semibold text-slate-900">{enrollCourse?.code} - {enrollCourse?.name}</span>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4 min-h-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search students by name or ID..."
                value={enrollSearch}
                onChange={(e) => setEnrollSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg">
              {loadingStudents ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 py-12">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-sm">Loading students...</span>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 py-12">
                  <span className="text-sm">No students found.</span>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>SBRN</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map(student => {
                      const isEnrolled = student.course === enrollCourse?.name;
                      return (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium text-sm text-slate-900">{student.name}</TableCell>
                          <TableCell className="text-xs text-slate-500">{student.studentId}</TableCell>
                          <TableCell className="text-right">
                            {isEnrolled ? (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => toggleStudentEnrollment(student)}
                                className="border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-red-50 hover:text-red-700 hover:border-red-200 w-[100px]"
                              >
                                <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Enrolled
                              </Button>
                            ) : (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => toggleStudentEnrollment(student)}
                                className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 w-[100px]"
                              >
                                Enroll
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={closeEnrollment} className="bg-slate-900 text-white hover:bg-slate-800">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
