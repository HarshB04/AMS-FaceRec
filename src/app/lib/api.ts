import { supabase } from "../../../utils/supabase/client";

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

const mapStudent = (s: any): Student => ({
  id: String(s.id),
  name: s.name,
  email: s.email,
  studentId: s.student_id_text || s.student_id || "",
  course: s.course || "",
  faceEnrolled: !!s.face_enrolled,
  status: s.status as "active" | "inactive",
  attendance: s.attendance_rate || 0,
});

export const getStudents = async () => {
  const { data, error } = await supabase.from("students").select("*");
  if (error) throw new Error(error.message || JSON.stringify(error));
  return data.map(mapStudent);
};

export const getStudent = async (id: string) => {
  const { data, error } = await supabase.from("students").select("*").eq("id", id).single();
  if (error) throw new Error(error.message || JSON.stringify(error));
  return mapStudent(data);
};

export const createStudent = async (data: Omit<Student, "id">) => {
  const body = {
    name: data.name,
    email: data.email,
    student_id_text: data.studentId,
    course: data.course,
    face_enrolled: data.faceEnrolled,
    status: data.status,
    attendance_rate: data.attendance
  };
  const { data: res, error } = await supabase.from("students").insert(body).select().single();
  if (error) throw new Error(error.message || JSON.stringify(error));
  return mapStudent(res);
};

export const updateStudent = async (id: string, data: Partial<Student>) => {
  const body: any = {};
  if (data.name) body.name = data.name;
  if (data.email) body.email = data.email;
  if (data.studentId) body.student_id_text = data.studentId;
  if (data.course) body.course = data.course;
  if (data.faceEnrolled !== undefined) body.face_enrolled = data.faceEnrolled;
  if (data.status) body.status = data.status;
  if (data.attendance !== undefined) body.attendance_rate = data.attendance;
  const { data: res, error } = await supabase.from("students").update(body).eq("id", id).select().single();
  if (error) throw new Error(error.message || JSON.stringify(error));
  return mapStudent(res);
};

export const deleteStudent = async (id: string) => {
  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) throw new Error(error.message || JSON.stringify(error));
  return { message: "Deleted" };
};

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

const mapCourse = (c: any): Course => ({
  id: String(c.id),
  code: c.course_code || "",
  name: c.course_name || "",
  teacher: c.teacher || "",
  schedule: c.schedule || "",
  room: c.room || "",
  students: c.student_count || 0,
  status: (c.status as "active" | "inactive") || "active",
});

export const getCourses = async () => {
  const { data, error } = await supabase.from("courses").select("*");
  if (error) throw new Error(error.message || JSON.stringify(error));
  return data.map(mapCourse);
};

export const createCourse = async (data: Omit<Course, "id">) => {
  const body = {
    course_name: data.name,
    course_code: data.code,
    teacher: data.teacher,
    schedule: data.schedule,
    room: data.room,
    student_count: data.students,
    status: data.status
  };
  const { data: res, error } = await supabase.from("courses").insert(body).select().single();
  if (error) throw new Error(error.message || JSON.stringify(error));
  return mapCourse(res);
};

export const updateCourse = async (id: string, d: Partial<Course>) => {
  const body: any = {};
  if (d.name) body.course_name = d.name;
  if (d.code) body.course_code = d.code;
  if (d.teacher) body.teacher = d.teacher;
  if (d.schedule) body.schedule = d.schedule;
  if (d.room) body.room = d.room;
  if (d.students !== undefined) body.student_count = d.students;
  if (d.status) body.status = d.status;
  const { data: res, error } = await supabase.from("courses").update(body).eq("id", id).select().single();
  if (error) throw new Error(error.message || JSON.stringify(error));
  return mapCourse(res);
};

export const deleteCourse = async (id: string) => {
  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) throw new Error(error.message || JSON.stringify(error));
  return { message: "Deleted" };
};

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

const mapAttendance = (a: any): AttendanceRecord => ({
  id: String(a.id),
  date: a.date_attended || "",
  course: a.courses?.course_code || a.course_id || "",
  teacher: a.courses?.teacher || "",
  total: a.students?.student_count || 1, // Simplified mapping
  present: a.status === "present" ? 1 : 0,
  late: a.status === "late" ? 1 : 0,
  absent: a.status === "absent" ? 1 : 0,
  rate: a.status === "present" ? 100 : 0,
});

export const getAttendance = async () => {
  const { data, error } = await supabase.from("attendance").select("*, students(*), courses(*)");
  if (error) throw new Error(error.message || JSON.stringify(error));
  return data.map(mapAttendance);
};

export const logAttendance = async (data: any) => {
  const { data: res, error } = await supabase.from("attendance").insert(data).select().single();
  if (error) throw new Error(error.message || JSON.stringify(error));
  return mapAttendance(res);
};

export const deleteAttendance = async (id: string) => {
  const { error } = await supabase.from("attendance").delete().eq("id", id);
  if (error) throw new Error(error.message || JSON.stringify(error));
  return { message: "Deleted" };
};

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

export const getAdminStats = async (): Promise<AdminStats> => {
  const [{ count: totalStudents }, { count: activeStudents }, { count: totalCourses }, { count: totalTeachers }, { data: attendance }, { count: enrolledFace }] = await Promise.all([
    supabase.from("students").select("*", { count: "exact", head: true }),
    supabase.from("students").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("courses").select("*", { count: "exact", head: true }),
    supabase.from("instructors").select("*", { count: "exact", head: true }),
    supabase.from("attendance").select("status"),
    supabase.from("students").select("*", { count: "exact", head: true }).eq("face_enrolled", true)
  ]);

  const totalPresent = attendance?.filter((a: any) => a.status === "present").length ?? 0;
  const totalRecords = attendance?.length ?? 0;
  const overallRate = totalRecords > 0 ? ((totalPresent / totalRecords) * 100).toFixed(1) : "0.0";

  return {
    totalStudents: totalStudents ?? 0,
    activeStudents: activeStudents ?? 0,
    totalCourses: totalCourses ?? 0,
    totalTeachers: totalTeachers ?? 0,
    attendanceRate: overallRate,
    faceEnrolled: enrolledFace ?? 0,
    activeSessions: 3,
  };
};

export const getTeacherStats = async (): Promise<TeacherStats> => {
  const [{ count: totalStudents }, { count: myClasses }, { data: todayAttendance }] = await Promise.all([
    supabase.from("students").select("*", { count: "exact", head: true }),
    supabase.from("courses").select("*", { count: "exact", head: true }),
    supabase.from("attendance").select("status").eq("date_attended", new Date().toISOString().split("T")[0])
  ]);

  const totalPresent = todayAttendance?.filter((a: any) => a.status === "present").length ?? 0;
  const totalRecords = todayAttendance?.length ?? 0;
  const todayRate = totalRecords > 0 ? ((totalPresent / totalRecords) * 100).toFixed(1) : "0.0";

  return {
    myClasses: myClasses ?? 0,
    totalStudents: totalStudents ?? 0,
    todayAttendanceRate: todayRate,
    nextClass: "2:00 PM",
  };
};

export const getStudentStats = async (): Promise<StudentStats> => {
  const { data: student } = await supabase.from("students").select("*").limit(1).maybeSingle();
  return {
    attendanceRate: student?.attendance_rate ?? 96,
    attendedClasses: 23,
    totalClasses: 24,
    gpa: "3.8",
    faceEnrolled: student?.face_enrolled ?? true,
  };
};

// ── Instructors ──────────────────────────────────────────────────────────────
export interface Instructor {
  id: string;
  name: string;
  email: string;
}

const mapInstructor = (i: any): Instructor => ({
  id: String(i.id),
  name: i.name,
  email: i.email,
});

export const getInstructors = async () => {
  const { data, error } = await supabase.from("instructors").select("*");
  if (error) throw new Error(error.message || JSON.stringify(error));
  return data.map(mapInstructor);
};

export const getInstructor = async (id: string) => {
  const { data, error } = await supabase.from("instructors").select("*").eq("id", id).single();
  if (error) throw new Error(error.message || JSON.stringify(error));
  return mapInstructor(data);
};

export const createInstructor = async (data: Omit<Instructor, "id">) => {
  const { data: res, error } = await supabase.from("instructors").insert(data).select().single();
  if (error) throw new Error(error.message || JSON.stringify(error));
  return mapInstructor(res);
};

export const updateInstructor = async (id: string, data: Partial<Instructor>) => {
  const { data: res, error } = await supabase.from("instructors").update(data).eq("id", id).select().single();
  if (error) throw new Error(error.message || JSON.stringify(error));
  return mapInstructor(res);
};

export const deleteInstructor = async (id: string) => {
  const { error } = await supabase.from("instructors").delete().eq("id", id);
  if (error) throw new Error(error.message || JSON.stringify(error));
  return { message: "Deleted" };
};

export const seedData = async () => {
  return { message: "Already seeded" };
};

