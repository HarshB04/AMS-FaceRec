import { Hono, Context } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createClient } from "@supabase/supabase-js";

/** Extract a safe error message from an unknown catch value. */
function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

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

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// ────────────────────────────────────────────────
// HEALTH
// ────────────────────────────────────────────────
app.get("/health", (c: Context) => c.json({ status: "ok" }));

// ────────────────────────────────────────────────
// SEED
// ────────────────────────────────────────────────
app.post("/seed", async (c: Context) => {
  try {
    const { data: existing } = await supabase.from("students").select("id").limit(1);
    if (existing && existing.length > 0) {
      return c.json({ message: "Already seeded", count: existing.length });
    }

    const students = [
      { name: "Sarah Johnson", email: "sarah.j@university.edu", student_id_text: "STU-001", course: "Computer Science", face_enrolled: true, status: "active", attendance_rate: 96 },
      { name: "Michael Chen", email: "michael.c@university.edu", student_id_text: "STU-002", course: "Computer Science", face_enrolled: true, status: "active", attendance_rate: 91 },
      { name: "Emily Davis", email: "emily.d@university.edu", student_id_text: "STU-003", course: "Mathematics", face_enrolled: false, status: "active", attendance_rate: 78 },
      { name: "James Wilson", email: "james.w@university.edu", student_id_text: "STU-004", course: "Engineering", face_enrolled: true, status: "active", attendance_rate: 94 },
      { name: "Sophia Martinez", email: "sophia.m@university.edu", student_id_text: "STU-005", course: "Computer Science", face_enrolled: true, status: "active", attendance_rate: 89 },
      { name: "Robert Brown", email: "robert.b@university.edu", student_id_text: "STU-006", course: "Physics", face_enrolled: false, status: "inactive", attendance_rate: 65 },
      { name: "Lisa Thompson", email: "lisa.t@university.edu", student_id_text: "STU-007", course: "Computer Science", face_enrolled: true, status: "active", attendance_rate: 93 },
      { name: "David Garcia", email: "david.g@university.edu", student_id_text: "STU-008", course: "Mathematics", face_enrolled: true, status: "active", attendance_rate: 88 },
      { name: "Amanda White", email: "amanda.w@university.edu", student_id_text: "STU-009", course: "Engineering", face_enrolled: false, status: "active", attendance_rate: 82 },
      { name: "Kevin Lee", email: "kevin.l@university.edu", student_id_text: "STU-010", course: "Physics", face_enrolled: true, status: "active", attendance_rate: 95 },
    ];

    const courses = [
      { course_code: "CS-301", course_name: "Data Structures & Algorithms", teacher: "Dr. Smith", schedule: "Mon/Wed 9:00 AM", room: "Room 204", student_count: 32, status: "active" },
      { course_code: "MATH-201", course_name: "Calculus II", teacher: "Prof. Lee", schedule: "Tue/Thu 10:00 AM", room: "Room 108", student_count: 25, status: "active" },
      { course_code: "ENG-101", course_name: "Technical Writing", teacher: "Ms. Carter", schedule: "Mon/Wed/Fri 11:00 AM", room: "Room 310", student_count: 35, status: "active" },
      { course_code: "PHY-102", course_name: "Mechanics & Thermodynamics", teacher: "Dr. Patel", schedule: "Tue/Thu 1:00 PM", room: "Room 215", student_count: 28, status: "active" },
      { course_code: "CS-405", course_name: "Machine Learning", teacher: "Dr. Smith", schedule: "Tue/Thu 11:00 AM", room: "Room 312", student_count: 28, status: "active" },
    ];

    const instructors = [
      { name: "Dr. Smith", email: "dr.smith@university.edu" },
      { name: "Prof. Lee", email: "prof.lee@university.edu" },
      { name: "Ms. Carter", email: "ms.carter@university.edu" },
      { name: "Dr. Patel", email: "dr.patel@university.edu" },
    ];

    await supabase.from("students").insert(students);
    await supabase.from("courses").insert(courses);
    await supabase.from("instructors").insert(instructors);

    return c.json({ message: "Seeded successfully", students: students.length, courses: courses.length, instructors: instructors.length });
  } catch (err: unknown) {
    console.log("Seed error:", err);
    return c.json({ error: `Seed failed: ${errMsg(err)}` }, 500);
  }
});

// ────────────────────────────────────────────────
// STUDENTS
// ────────────────────────────────────────────────
app.get("/students", async (c: Context) => {
  try {
    const { data, error } = await supabase.from("students").select("*");
    if (error) throw error;
    return c.json(data);
  } catch (err: unknown) {
    return c.json({ error: `Failed to fetch students: ${errMsg(err)}` }, 500);
  }
});

app.get("/students/:id", async (c: Context) => {
  try {
    const id = c.req.param("id");
    const { data, error } = await supabase.from("students").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) return c.json({ error: "Student not found" }, 404);
    return c.json(data);
  } catch (err: unknown) {
    return c.json({ error: `Failed to fetch student: ${errMsg(err)}` }, 500);
  }
});

app.post("/students", async (c: Context) => {
  try {
    const body = await c.req.json();
    
    if (body.password) {
      const { error: authError } = await supabase.auth.admin.createUser({
        email: body.email,
        password: body.password,
        email_confirm: true,
        user_metadata: { role: "student" }
      });
      if (authError) {
        console.error("Auth creation failed:", authError);
        // Continue even if auth fails (e.g., user already exists) or handle it
      }
      delete body.password;
    }

    const { data, error } = await supabase.from("students").insert(body).select().single();
    if (error) throw error;
    return c.json(data, 201);
  } catch (err: unknown) {
    return c.json({ error: `Failed to create student: ${errMsg(err)}` }, 500);
  }
});

app.post("/lookup-sbrn", async (c: Context) => {
  try {
    const { sbrn } = await c.req.json();
    const { data, error } = await supabase.from("students").select("email").eq("student_id_text", sbrn).maybeSingle();
    if (error) throw error;
    if (!data) return c.json({ error: "SBRN not found" }, 404);
    return c.json({ email: data.email });
  } catch (err: unknown) {
    return c.json({ error: `Failed to lookup SBRN: ${errMsg(err)}` }, 500);
  }
});

app.put("/students/:id", async (c: Context) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { data, error } = await supabase.from("students").update(body).eq("id", id).select().single();
    if (error) throw error;
    return c.json(data);
  } catch (err: unknown) {
    return c.json({ error: `Failed to update student: ${errMsg(err)}` }, 500);
  }
});

app.delete("/students/:id", async (c: Context) => {
  try {
    const id = c.req.param("id");
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) throw error;
    return c.json({ message: "Deleted" });
  } catch (err: unknown) {
    return c.json({ error: `Failed to delete student: ${errMsg(err)}` }, 500);
  }
});

// ────────────────────────────────────────────────
// COURSES
// ────────────────────────────────────────────────
app.get("/courses", async (c: Context) => {
  try {
    const { data, error } = await supabase.from("courses").select("*");
    if (error) throw error;
    return c.json(data);
  } catch (err: unknown) {
    return c.json({ error: `Failed to fetch courses: ${errMsg(err)}` }, 500);
  }
});

app.post("/courses", async (c: Context) => {
  try {
    const body = await c.req.json();
    const { data, error } = await supabase.from("courses").insert(body).select().single();
    if (error) throw error;
    return c.json(data, 201);
  } catch (err: unknown) {
    return c.json({ error: `Failed to create course: ${errMsg(err)}` }, 500);
  }
});

app.put("/courses/:id", async (c: Context) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { data, error } = await supabase.from("courses").update(body).eq("id", id).select().single();
    if (error) throw error;
    return c.json(data);
  } catch (err: unknown) {
    return c.json({ error: `Failed to update course: ${errMsg(err)}` }, 500);
  }
});

app.delete("/courses/:id", async (c: Context) => {
  try {
    const id = c.req.param("id");
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) throw error;
    return c.json({ message: "Deleted" });
  } catch (err: unknown) {
    return c.json({ error: `Failed to delete course: ${errMsg(err)}` }, 500);
  }
});

// ────────────────────────────────────────────────
// ATTENDANCE
// ────────────────────────────────────────────────
app.get("/attendance", async (c: Context) => {
  try {
    const { data, error } = await supabase.from("attendance").select("*, students(*), courses(*)");
    if (error) throw error;
    return c.json(data);
  } catch (err: unknown) {
    return c.json({ error: `Failed to fetch attendance: ${errMsg(err)}` }, 500);
  }
});

app.post("/attendance", async (c: Context) => {
  try {
    const body = await c.req.json();
    const { data, error } = await supabase.from("attendance").insert(body).select().single();
    if (error) throw error;
    return c.json(data, 201);
  } catch (err: unknown) {
    return c.json({ error: `Failed to log attendance: ${errMsg(err)}` }, 500);
  }
});

app.delete("/attendance/:id", async (c: Context) => {
  try {
    const id = c.req.param("id");
    const { error } = await supabase.from("attendance").delete().eq("id", id);
    if (error) throw error;
    return c.json({ message: "Deleted" });
  } catch (err: unknown) {
    return c.json({ error: `Failed to delete attendance record: ${errMsg(err)}` }, 500);
  }
});

// ────────────────────────────────────────────────
// INSTRUCTORS
// ────────────────────────────────────────────────
app.get("/instructors", async (c: Context) => {
  try {
    const { data, error } = await supabase.from("instructors").select("*");
    if (error) throw error;
    return c.json(data);
  } catch (err: unknown) {
    return c.json({ error: `Failed to fetch instructors: ${errMsg(err)}` }, 500);
  }
});

app.get("/instructors/:id", async (c: Context) => {
  try {
    const id = c.req.param("id");
    const { data, error } = await supabase.from("instructors").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) return c.json({ error: "Instructor not found" }, 404);
    return c.json(data);
  } catch (err: unknown) {
    return c.json({ error: `Failed to fetch instructor: ${errMsg(err)}` }, 500);
  }
});

app.post("/instructors", async (c: Context) => {
  try {
    const body = await c.req.json();
    const { data, error } = await supabase.from("instructors").insert(body).select().single();
    if (error) throw error;
    return c.json(data, 201);
  } catch (err: unknown) {
    return c.json({ error: `Failed to create instructor: ${errMsg(err)}` }, 500);
  }
});

app.put("/instructors/:id", async (c: Context) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { data, error } = await supabase.from("instructors").update(body).eq("id", id).select().single();
    if (error) throw error;
    return c.json(data);
  } catch (err: unknown) {
    return c.json({ error: `Failed to update instructor: ${errMsg(err)}` }, 500);
  }
});

app.delete("/instructors/:id", async (c: Context) => {
  try {
    const id = c.req.param("id");
    await supabase.from("course_instructors").delete().eq("instructor_id", id);
    const { error } = await supabase.from("instructors").delete().eq("id", id);
    if (error) throw error;
    return c.json({ message: "Deleted" });
  } catch (err: unknown) {
    return c.json({ error: `Failed to delete instructor: ${errMsg(err)}` }, 500);
  }
});

// ────────────────────────────────────────────────
// COURSE-INSTRUCTOR ASSIGNMENTS
// ────────────────────────────────────────────────
app.get("/course-instructors", async (c: Context) => {
  try {
    const { data, error } = await supabase
      .from("course_instructors")
      .select("*, courses(*), instructors(*)");
    if (error) throw error;
    return c.json(data);
  } catch (err: unknown) {
    return c.json({ error: `Failed to fetch assignments: ${errMsg(err)}` }, 500);
  }
});

app.post("/course-instructors", async (c: Context) => {
  try {
    const body = await c.req.json();
    const { data, error } = await supabase.from("course_instructors").insert(body).select().single();
    if (error) throw error;
    return c.json(data, 201);
  } catch (err: unknown) {
    return c.json({ error: `Failed to assign instructor: ${errMsg(err)}` }, 500);
  }
});

app.delete("/course-instructors/:courseId/:instructorId", async (c: Context) => {
  try {
    const courseId = c.req.param("courseId");
    const instructorId = c.req.param("instructorId");
    const { error } = await supabase
      .from("course_instructors")
      .delete()
      .eq("course_id", courseId)
      .eq("instructor_id", instructorId);
    if (error) throw error;
    return c.json({ message: "Unassigned" });
  } catch (err: unknown) {
    return c.json({ error: `Failed to unassign instructor: ${errMsg(err)}` }, 500);
  }
});

// ────────────────────────────────────────────────
// STATS
// ────────────────────────────────────────────────
app.get("/stats/admin", async (c: Context) => {
  try {
    const [
      { count: totalStudents },
      { count: activeStudents },
      { count: totalCourses },
      { count: totalTeachers },
      { data: attendance },
    ] = await Promise.all([
      supabase.from("students").select("*", { count: "exact", head: true }),
      supabase.from("students").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("courses").select("*", { count: "exact", head: true }),
      supabase.from("instructors").select("*", { count: "exact", head: true }),
      supabase.from("attendance").select("status"),
    ]);

    const totalPresent = attendance?.filter((a: { status: string }) => a.status === "present").length ?? 0;
    const totalRecords = attendance?.length ?? 0;
    const overallRate = totalRecords > 0 ? ((totalPresent / totalRecords) * 100).toFixed(1) : "0.0";

    const { count: enrolledFace } = await supabase
      .from("students").select("*", { count: "exact", head: true }).eq("face_enrolled", true);

    return c.json({
      totalStudents,
      activeStudents,
      totalCourses,
      totalTeachers: totalTeachers ?? 0,
      attendanceRate: overallRate,
      faceEnrolled: enrolledFace,
      activeSessions: 3,
    });
  } catch (err: unknown) {
    return c.json({ error: `Failed to fetch admin stats: ${errMsg(err)}` }, 500);
  }
});

app.get("/stats/teacher", async (c: Context) => {
  try {
    const [
      { count: totalStudents },
      { count: myClasses },
      { data: todayAttendance },
    ] = await Promise.all([
      supabase.from("students").select("*", { count: "exact", head: true }),
      supabase.from("courses").select("*", { count: "exact", head: true }),
      supabase.from("attendance").select("status").eq("date_attended", new Date().toISOString().split("T")[0]),
    ]);

    const totalPresent = todayAttendance?.filter((a: { status: string }) => a.status === "present").length ?? 0;
    const totalRecords = todayAttendance?.length ?? 0;
    const todayRate = totalRecords > 0 ? ((totalPresent / totalRecords) * 100).toFixed(1) : "0.0";

    return c.json({
      myClasses,
      totalStudents,
      todayAttendanceRate: todayRate,
      nextClass: "2:00 PM",
    });
  } catch (err: unknown) {
    return c.json({ error: `Failed to fetch teacher stats: ${errMsg(err)}` }, 500);
  }
});

app.get("/stats/student", async (c: Context) => {
  try {
    const { data: student } = await supabase.from("students").select("*").limit(1).maybeSingle();
    return c.json({
      attendanceRate: student?.attendance_rate ?? 96,
      attendedClasses: 23,
      totalClasses: 24,
      gpa: "3.8",
      faceEnrolled: student?.face_enrolled ?? true,
    });
  } catch (err: unknown) {
    return c.json({ error: `Failed to fetch student stats: ${errMsg(err)}` }, 500);
  }
});

Deno.serve(app.fetch);