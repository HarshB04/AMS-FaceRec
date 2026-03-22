import { projectId, publicAnonKey } from "/utils/supabase/info";

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-803da240`;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${publicAnonKey}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ── Seed ──────────────────────────────────────────────────────────────────────
export const seedData = () => request<{ message: string }>("/seed", { method: "POST" });

// ── Students ──────────────────────────────────────────────────────────────────
export interface Student {
  id: string;
  name: string;
  email: string;
  studentId: string;
  course: string;
  faceEnrolled: boolean;
  status: "active" | "inactive";
  attendance: number;
}

export const getStudents   = ()                              => request<Student[]>("/students");
export const getStudent    = (id: string)                    => request<Student>(`/students/${id}`);
export const createStudent = (data: Omit<Student, "id">)    => request<Student>("/students", { method: "POST", body: JSON.stringify(data) });
export const updateStudent = (id: string, data: Partial<Student>) => request<Student>(`/students/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteStudent = (id: string)                    => request<{ message: string }>(`/students/${id}`, { method: "DELETE" });

// ── Courses ───────────────────────────────────────────────────────────────────
export interface Course {
  id: string;
  code: string;
  name: string;
  teacher: string;
  schedule: string;
  room: string;
  students: number;
  status: "active" | "inactive";
}

export const getCourses   = ()                             => request<Course[]>("/courses");
export const createCourse = (data: Omit<Course, "id">)   => request<Course>("/courses",      { method: "POST", body: JSON.stringify(data) });
export const updateCourse = (id: string, d: Partial<Course>) => request<Course>(`/courses/${id}`, { method: "PUT",  body: JSON.stringify(d) });
export const deleteCourse = (id: string)                   => request<{ message: string }>(`/courses/${id}`, { method: "DELETE" });

// ── Attendance ────────────────────────────────────────────────────────────────
export interface AttendanceRecord {
  id: string;
  date: string;
  course: string;
  teacher: string;
  total: number;
  present: number;
  late: number;
  absent: number;
  rate: number;
}

export const getAttendance    = ()                                      => request<AttendanceRecord[]>("/attendance");
export const logAttendance    = (data: Omit<AttendanceRecord, "id">)   => request<AttendanceRecord>("/attendance", { method: "POST", body: JSON.stringify(data) });
export const deleteAttendance = (id: string)                            => request<{ message: string }>(`/attendance/${id}`, { method: "DELETE" });

// ── Stats ─────────────────────────────────────────────────────────────────────
export interface AdminStats {
  totalStudents: number;
  activeStudents: number;
  totalCourses: number;
  totalTeachers: number;
  attendanceRate: string;
  faceEnrolled: number;
  activeSessions: number;
}

export interface TeacherStats {
  myClasses: number;
  totalStudents: number;
  todayAttendanceRate: string;
  nextClass: string;
}

export interface StudentStats {
  attendanceRate: number;
  attendedClasses: number;
  totalClasses: number;
  gpa: string;
  faceEnrolled: boolean;
}

export const getAdminStats   = () => request<AdminStats>("/stats/admin");
export const getTeacherStats = () => request<TeacherStats>("/stats/teacher");
export const getStudentStats = () => request<StudentStats>("/stats/student");
