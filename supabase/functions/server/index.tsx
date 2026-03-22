import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use("*", logger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  })
);

// ────────────────────────────────────────────────
// HEALTH
// ────────────────────────────────────────────────
app.get("/make-server-803da240/health", (c) => c.json({ status: "ok" }));

// ────────────────────────────────────────────────
// SEED  –  POST /seed
// Creates demo students, courses and attendance
// records the first time it is called.
// ────────────────────────────────────────────────
app.post("/make-server-803da240/seed", async (c) => {
  try {
    const existingStudents = await kv.getByPrefix("students:");
    if (existingStudents.length > 0) {
      return c.json({ message: "Already seeded", count: existingStudents.length });
    }

    const students = [
      { id: "1", name: "Sarah Johnson",   email: "sarah.j@university.edu",   studentId: "STU-001", course: "Computer Science", faceEnrolled: true,  status: "active",   attendance: 96 },
      { id: "2", name: "Michael Chen",    email: "michael.c@university.edu", studentId: "STU-002", course: "Computer Science", faceEnrolled: true,  status: "active",   attendance: 91 },
      { id: "3", name: "Emily Davis",     email: "emily.d@university.edu",   studentId: "STU-003", course: "Mathematics",     faceEnrolled: false, status: "active",   attendance: 78 },
      { id: "4", name: "James Wilson",    email: "james.w@university.edu",   studentId: "STU-004", course: "Engineering",    faceEnrolled: true,  status: "active",   attendance: 94 },
      { id: "5", name: "Sophia Martinez", email: "sophia.m@university.edu",  studentId: "STU-005", course: "Computer Science", faceEnrolled: true,  status: "active",   attendance: 89 },
      { id: "6", name: "Robert Brown",    email: "robert.b@university.edu",  studentId: "STU-006", course: "Physics",        faceEnrolled: false, status: "inactive", attendance: 65 },
      { id: "7", name: "Lisa Thompson",   email: "lisa.t@university.edu",    studentId: "STU-007", course: "Computer Science", faceEnrolled: true,  status: "active",   attendance: 93 },
      { id: "8", name: "David Garcia",    email: "david.g@university.edu",   studentId: "STU-008", course: "Mathematics",     faceEnrolled: true,  status: "active",   attendance: 88 },
      { id: "9", name: "Amanda White",    email: "amanda.w@university.edu",  studentId: "STU-009", course: "Engineering",    faceEnrolled: false, status: "active",   attendance: 82 },
      { id: "10", name: "Kevin Lee",      email: "kevin.l@university.edu",   studentId: "STU-010", course: "Physics",        faceEnrolled: true,  status: "active",   attendance: 95 },
    ];

    const courses = [
      { id: "cs301",  code: "CS-301",   name: "Data Structures & Algorithms", teacher: "Dr. Smith",   schedule: "Mon/Wed 9:00 AM",     room: "Room 204", students: 32, status: "active" },
      { id: "math201",code: "MATH-201", name: "Calculus II",                  teacher: "Prof. Lee",   schedule: "Tue/Thu 10:00 AM",    room: "Room 108", students: 25, status: "active" },
      { id: "eng101", code: "ENG-101",  name: "Technical Writing",            teacher: "Ms. Carter",  schedule: "Mon/Wed/Fri 11:00 AM", room: "Room 310", students: 35, status: "active" },
      { id: "phy102", code: "PHY-102",  name: "Mechanics & Thermodynamics",   teacher: "Dr. Patel",   schedule: "Tue/Thu 1:00 PM",     room: "Room 215", students: 28, status: "active" },
      { id: "cs405",  code: "CS-405",   name: "Machine Learning",             teacher: "Dr. Smith",   schedule: "Tue/Thu 11:00 AM",    room: "Room 312", students: 28, status: "active" },
    ];

    const attendanceRecords = [
      { id: "att1",  date: "2026-03-01", course: "CS-301",   teacher: "Dr. Smith",  total: 32, present: 29, late: 2, absent: 1, rate: 96.9 },
      { id: "att2",  date: "2026-03-01", course: "MATH-201", teacher: "Prof. Lee",  total: 25, present: 22, late: 1, absent: 2, rate: 92.0 },
      { id: "att3",  date: "2026-03-02", course: "ENG-101",  teacher: "Ms. Carter", total: 35, present: 33, late: 1, absent: 1, rate: 97.1 },
      { id: "att4",  date: "2026-03-02", course: "CS-301",   teacher: "Dr. Smith",  total: 32, present: 28, late: 3, absent: 1, rate: 96.9 },
      { id: "att5",  date: "2026-03-03", course: "PHY-102",  teacher: "Dr. Patel",  total: 28, present: 24, late: 2, absent: 2, rate: 92.9 },
      { id: "att6",  date: "2026-03-03", course: "CS-405",   teacher: "Dr. Smith",  total: 28, present: 27, late: 0, absent: 1, rate: 96.4 },
      { id: "att7",  date: "2026-03-04", course: "MATH-201", teacher: "Prof. Lee",  total: 25, present: 23, late: 1, absent: 1, rate: 96.0 },
      { id: "att8",  date: "2026-03-04", course: "CS-301",   teacher: "Dr. Smith",  total: 32, present: 30, late: 1, absent: 1, rate: 96.9 },
      { id: "att9",  date: "2026-03-05", course: "ENG-101",  teacher: "Ms. Carter", total: 35, present: 31, late: 2, absent: 2, rate: 94.3 },
      { id: "att10", date: "2026-03-05", course: "PHY-102",  teacher: "Dr. Patel",  total: 28, present: 25, late: 1, absent: 2, rate: 92.9 },
      { id: "att11", date: "2026-03-06", course: "CS-301",   teacher: "Dr. Smith",  total: 32, present: 29, late: 2, absent: 1, rate: 96.9 },
      { id: "att12", date: "2026-03-06", course: "CS-405",   teacher: "Dr. Smith",  total: 28, present: 26, late: 1, absent: 1, rate: 96.4 },
    ];

    const studentKV = students.map((s) => ({ key: `students:${s.id}`, value: s }));
    const courseKV  = courses.map((c)  => ({ key: `courses:${c.id}`,  value: c }));
    const attKV     = attendanceRecords.map((a) => ({ key: `attendance:${a.id}`, value: a }));

    const allKV = [...studentKV, ...courseKV, ...attKV];
    await kv.mset(
      allKV.map((item) => item.key),
      allKV.map((item) => item.value)
    );

    return c.json({ message: "Seeded successfully", students: students.length, courses: courses.length, attendance: attendanceRecords.length });
  } catch (err) {
    console.log("Seed error:", err);
    return c.json({ error: `Seed failed: ${err}` }, 500);
  }
});

// ────────────────────────────────────────────────
// STUDENTS
// ────────────────────────────────────────────────
app.get("/make-server-803da240/students", async (c) => {
  try {
    const items = await kv.getByPrefix("students:");
    return c.json(items);
  } catch (err) {
    console.log("GET /students error:", err);
    return c.json({ error: `Failed to fetch students: ${err}` }, 500);
  }
});

app.get("/make-server-803da240/students/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const student = await kv.get(`students:${id}`);
    if (!student) return c.json({ error: "Student not found" }, 404);
    return c.json(student);
  } catch (err) {
    console.log("GET /students/:id error:", err);
    return c.json({ error: `Failed to fetch student: ${err}` }, 500);
  }
});

app.post("/make-server-803da240/students", async (c) => {
  try {
    const body = await c.req.json();
    const id = crypto.randomUUID().split("-")[0];
    const student = { ...body, id };
    await kv.set(`students:${id}`, student);
    return c.json(student, 201);
  } catch (err) {
    console.log("POST /students error:", err);
    return c.json({ error: `Failed to create student: ${err}` }, 500);
  }
});

app.put("/make-server-803da240/students/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const existing = await kv.get(`students:${id}`);
    if (!existing) return c.json({ error: "Student not found" }, 404);
    const body = await c.req.json();
    const updated = { ...(existing as object), ...body, id };
    await kv.set(`students:${id}`, updated);
    return c.json(updated);
  } catch (err) {
    console.log("PUT /students/:id error:", err);
    return c.json({ error: `Failed to update student: ${err}` }, 500);
  }
});

app.delete("/make-server-803da240/students/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await kv.del(`students:${id}`);
    return c.json({ message: "Deleted" });
  } catch (err) {
    console.log("DELETE /students/:id error:", err);
    return c.json({ error: `Failed to delete student: ${err}` }, 500);
  }
});

// ────────────────────────────────────────────────
// COURSES
// ────────────────────────────────────────────────
app.get("/make-server-803da240/courses", async (c) => {
  try {
    const items = await kv.getByPrefix("courses:");
    return c.json(items);
  } catch (err) {
    console.log("GET /courses error:", err);
    return c.json({ error: `Failed to fetch courses: ${err}` }, 500);
  }
});

app.post("/make-server-803da240/courses", async (c) => {
  try {
    const body = await c.req.json();
    const id = crypto.randomUUID().split("-")[0];
    const course = { ...body, id };
    await kv.set(`courses:${id}`, course);
    return c.json(course, 201);
  } catch (err) {
    console.log("POST /courses error:", err);
    return c.json({ error: `Failed to create course: ${err}` }, 500);
  }
});

app.put("/make-server-803da240/courses/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const existing = await kv.get(`courses:${id}`);
    if (!existing) return c.json({ error: "Course not found" }, 404);
    const body = await c.req.json();
    const updated = { ...(existing as object), ...body, id };
    await kv.set(`courses:${id}`, updated);
    return c.json(updated);
  } catch (err) {
    console.log("PUT /courses/:id error:", err);
    return c.json({ error: `Failed to update course: ${err}` }, 500);
  }
});

app.delete("/make-server-803da240/courses/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await kv.del(`courses:${id}`);
    return c.json({ message: "Deleted" });
  } catch (err) {
    console.log("DELETE /courses/:id error:", err);
    return c.json({ error: `Failed to delete course: ${err}` }, 500);
  }
});

// ────────────────────────────────────────────────
// ATTENDANCE
// ────────────────────────────────────────────────
app.get("/make-server-803da240/attendance", async (c) => {
  try {
    const items = await kv.getByPrefix("attendance:");
    return c.json(items);
  } catch (err) {
    console.log("GET /attendance error:", err);
    return c.json({ error: `Failed to fetch attendance: ${err}` }, 500);
  }
});

app.post("/make-server-803da240/attendance", async (c) => {
  try {
    const body = await c.req.json();
    const id = `att${Date.now()}`;
    const record = { ...body, id };
    await kv.set(`attendance:${id}`, record);
    return c.json(record, 201);
  } catch (err) {
    console.log("POST /attendance error:", err);
    return c.json({ error: `Failed to log attendance: ${err}` }, 500);
  }
});

app.delete("/make-server-803da240/attendance/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await kv.del(`attendance:${id}`);
    return c.json({ message: "Deleted" });
  } catch (err) {
    console.log("DELETE /attendance/:id error:", err);
    return c.json({ error: `Failed to delete attendance record: ${err}` }, 500);
  }
});

// ────────────────────────────────────────────────
// STATS
// ────────────────────────────────────────────────
app.get("/make-server-803da240/stats/admin", async (c) => {
  try {
    const [students, courses, attendance] = await Promise.all([
      kv.getByPrefix("students:"),
      kv.getByPrefix("courses:"),
      kv.getByPrefix("attendance:"),
    ]);

    const totalStudents = students.length;
    const activeStudents = (students as any[]).filter((s) => s.status === "active").length;
    const totalCourses = courses.length;

    const attRecords = attendance as any[];
    const totalPresent = attRecords.reduce((s, a) => s + (a.present || 0), 0);
    const totalStudentsInAtt = attRecords.reduce((s, a) => s + (a.total || 0), 0);
    const overallRate = totalStudentsInAtt > 0 ? ((totalPresent / totalStudentsInAtt) * 100).toFixed(1) : "0.0";

    const enrolledFace = (students as any[]).filter((s) => s.faceEnrolled).length;

    return c.json({
      totalStudents,
      activeStudents,
      totalCourses,
      totalTeachers: 86,
      attendanceRate: overallRate,
      faceEnrolled: enrolledFace,
      activeSessions: 3,
    });
  } catch (err) {
    console.log("GET /stats/admin error:", err);
    return c.json({ error: `Failed to fetch admin stats: ${err}` }, 500);
  }
});

app.get("/make-server-803da240/stats/teacher", async (c) => {
  try {
    const [students, courses, attendance] = await Promise.all([
      kv.getByPrefix("students:"),
      kv.getByPrefix("courses:"),
      kv.getByPrefix("attendance:"),
    ]);

    const attRecords = attendance as any[];
    const todayRecords = attRecords.filter((a) => a.date === "2026-03-06");
    const totalPresent = todayRecords.reduce((s, a) => s + (a.present || 0), 0);
    const totalStudents = todayRecords.reduce((s, a) => s + (a.total || 0), 0);
    const todayRate = totalStudents > 0 ? ((totalPresent / totalStudents) * 100).toFixed(1) : "0.0";

    return c.json({
      myClasses: courses.length,
      totalStudents: students.length,
      todayAttendanceRate: todayRate,
      nextClass: "2:00 PM",
    });
  } catch (err) {
    console.log("GET /stats/teacher error:", err);
    return c.json({ error: `Failed to fetch teacher stats: ${err}` }, 500);
  }
});

app.get("/make-server-803da240/stats/student", async (c) => {
  try {
    const students = await kv.getByPrefix("students:");
    const sarah = (students as any[]).find((s) => s.studentId === "STU-001");
    return c.json({
      attendanceRate: sarah ? sarah.attendance : 96,
      attendedClasses: 23,
      totalClasses: 24,
      gpa: "3.8",
      faceEnrolled: sarah ? sarah.faceEnrolled : true,
    });
  } catch (err) {
    console.log("GET /stats/student error:", err);
    return c.json({ error: `Failed to fetch student stats: ${err}` }, 500);
  }
});

Deno.serve(app.fetch);