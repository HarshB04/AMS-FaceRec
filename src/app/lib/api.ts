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

export const getStudentsByCourse = async (courseName: string) => {
  const { data, error } = await supabase.from("students").select("*").eq("course", courseName);
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

export const getTodayAttendanceForCourse = async (courseId: string) => {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("attendance")
    .select("*, students(*)")
    .eq("course_id", courseId)
    .eq("date_attended", today);
  if (error) throw new Error(error.message || JSON.stringify(error));
  return data;
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

export interface WeeklyAttendanceSummary {
  week: string;
  dateRange: string;
  startDate: string;
  endDate: string;
  present: number;
  late: number;
  absent: number;
  total: number;
  rate: number;
}

interface WeeklyAttendanceOptions {
  scope: "all" | "student";
  month?: Date;
  studentEmail?: string;
  studentIdText?: string;
}

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateKey = (value: string) => new Date(`${value}T00:00:00`);

const formatShortDate = (date: Date) =>
  date.toLocaleDateString(undefined, { month: "short", day: "numeric" });

const getMonthWeeks = (monthDate = new Date()) => {
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const weeks: Array<{ start: Date; end: Date }> = [];
  let cursor = new Date(monthStart);

  while (cursor <= monthEnd) {
    const dayOfWeek = cursor.getDay();
    const daysUntilSunday = 6 - dayOfWeek;
    const weekEnd = new Date(cursor);
    weekEnd.setDate(cursor.getDate() + daysUntilSunday);
    if (weekEnd > monthEnd) weekEnd.setTime(monthEnd.getTime());

    weeks.push({ start: new Date(cursor), end: new Date(weekEnd) });

    cursor = new Date(weekEnd);
    cursor.setDate(weekEnd.getDate() + 1);
  }

  return weeks;
};

export const getWeeklyAttendanceAnalysis = async ({
  scope,
  month = new Date(),
  studentEmail,
  studentIdText,
}: WeeklyAttendanceOptions): Promise<WeeklyAttendanceSummary[]> => {
  const weeks = getMonthWeeks(month);
  const monthStart = weeks[0]?.start;
  const monthEnd = weeks[weeks.length - 1]?.end;

  if (!monthStart || !monthEnd) return [];

  const { data, error } = await supabase
    .from("attendance")
    .select("id, date_attended, status, students(id, email, student_id_text), courses(id, course_code, teacher)")
    .gte("date_attended", toDateKey(monthStart))
    .lte("date_attended", toDateKey(monthEnd));

  if (error) throw new Error(error.message || JSON.stringify(error));

  const normalizedEmail = studentEmail?.trim().toLowerCase();
  const normalizedStudentId = studentIdText?.trim().toLowerCase();
  const records = (data ?? []).filter((record: any) => {
    if (scope === "all") return true;
    const student = record.students;
    const emailMatches = normalizedEmail && student?.email?.toLowerCase() === normalizedEmail;
    const idMatches =
      normalizedStudentId && student?.student_id_text?.toLowerCase() === normalizedStudentId;
    return Boolean(emailMatches || idMatches);
  });

  if (records.length === 0) return [];

  return weeks.map((week, index) => {
    const summary = records.reduce(
      (acc, record: any) => {
        const attendedDate = parseDateKey(record.date_attended);
        if (attendedDate < week.start || attendedDate > week.end) return acc;

        acc.total += 1;
        if (record.status === "present") acc.present += 1;
        if (record.status === "late") acc.late += 1;
        if (record.status === "absent") acc.absent += 1;
        return acc;
      },
      { present: 0, late: 0, absent: 0, total: 0 }
    );

    return {
      week: `Week ${index + 1}`,
      dateRange: `${formatShortDate(week.start)} - ${formatShortDate(week.end)}`,
      startDate: toDateKey(week.start),
      endDate: toDateKey(week.end),
      ...summary,
      rate: summary.total > 0 ? Math.round((summary.present / summary.total) * 100) : 0,
    };
  });
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

