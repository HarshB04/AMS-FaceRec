const { supabaseAdmin } = require("../config/supabaseClient");

const FACE_ENGINE_SECRET = process.env.FACE_ENGINE_SECRET || "";

/**
 * POST /api/attendance/log
 *
 * Internal endpoint — called ONLY by the Python face engine (localhost:5001).
 * Protected by X-Face-Engine-Secret header to prevent spoofing.
 *
 * Body: { sbrn, date, time, confidence, course_id?, course_code?, department?, semester? }
 *
 * Workflow:
 *  1. Validate secret header
 *  2. Look up student by SBRN — must be active + face_enrolled
 *  3. Look up course by id/code/name (optional)
 *  4. Insert attendance record (idempotent via UNIQUE constraint)
 *  5. Return { success, student_name, sbrn }
 */
async function logAttendance(req, res) {
  try {
    // 1. Validate shared secret
    if (!FACE_ENGINE_SECRET) {
      console.error("[attendanceController] FATAL: FACE_ENGINE_SECRET is not configured in backend environment.");
      return res.status(500).json({ error: "Server Configuration Error", message: "Face engine secret not configured." });
    }
    
    const incoming = req.headers["x-face-engine-secret"] || "";
    if (incoming !== FACE_ENGINE_SECRET) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid face engine secret.",
      });
    }

    const { sbrn, date, time, confidence, course_id, course_code, course_name, department, semester } = req.body;

    if (!sbrn || typeof sbrn !== "string" || sbrn.trim().length === 0) {
      return res.status(400).json({
        error: "Validation Error",
        message: "sbrn is required.",
      });
    }

    const normalizedSbrn = sbrn.trim().toUpperCase();
    const attendanceDate = date || new Date().toISOString().split("T")[0];

    // 2. Fetch student by SBRN from unified schema
    const { data: studentRecord, error: studentError } = await supabaseAdmin
      .from("student_details")
      .select(`
        user_id,
        users!inner(
          full_name,
          email,
          is_active,
          branch,
          face_embeddings(id)
        )
      `)
      .eq("sbrn", normalizedSbrn)
      .maybeSingle();

    if (studentError) {
      console.error("[attendanceController] student lookup error:", studentError.message);
      throw new Error(studentError.message);
    }

    if (!studentRecord || !studentRecord.users) {
      console.warn(`[attendanceController] SBRN not found: ${normalizedSbrn}`);
      return res.status(404).json({
        error: "Not Found",
        message: `Student with SBRN '${normalizedSbrn}' not found.`,
      });
    }

    const studentUser = studentRecord.users;
    const isFaceEnrolled = studentUser.face_embeddings && studentUser.face_embeddings.length > 0;
    const student = {
      id: studentRecord.user_id,
      name: studentUser.full_name,
      email: studentUser.email,
      status: studentUser.is_active ? "active" : "inactive",
      course: studentUser.branch,
      face_enrolled: isFaceEnrolled
    };

    if (!student.face_enrolled) {
      console.warn(`[attendanceController] Face not enrolled for SBRN: ${normalizedSbrn}`);
      return res.status(403).json({
        error: "Not Enrolled",
        message: `Student '${normalizedSbrn}' has not completed face enrollment.`,
      });
    }

    if (student.status !== "active") {
      return res.status(403).json({
        error: "Inactive",
        message: `Student '${normalizedSbrn}' account is not active.`,
      });
    }

    // 3. Look up course_id (optional — log without course if not provided)
    let courseId = course_id || null;

    const applyProgramFilters = (query) => {
      let next = query;
      if (department && String(department).trim()) {
        next = next.eq("department", String(department).trim());
      }
      if (semester && String(semester).trim()) {
        next = next.eq("semester", String(semester).trim());
      }
      return next;
    };

    if (course_code && course_code.trim().length > 0) {
      const courseLookup = String(course_code).trim();

      const { data: codeMatches, error: codeError } = await applyProgramFilters(
        supabaseAdmin.from("courses").select("id").eq("course_code", courseLookup)
      ).limit(1);
      if (codeError) throw new Error(codeError.message);
      if (codeMatches?.[0]) courseId = codeMatches[0].id;

      if (!courseId) {
        const { data: nameMatches, error: nameError } = await applyProgramFilters(
          supabaseAdmin.from("courses").select("id").eq("course_name", courseLookup)
        ).limit(1);
        if (nameError) throw new Error(nameError.message);
        if (nameMatches?.[0]) courseId = nameMatches[0].id;
      }
    }

    // If no course_code given, try to find the student's default course
    if (!courseId && student.course) {
      const { data: courseMatches, error: courseError } = await supabaseAdmin
        .from("courses")
        .select("id")
        .eq("course_name", student.course)
        .limit(1);
      if (courseError) throw new Error(courseError.message);
      if (courseMatches?.[0]) courseId = courseMatches[0].id;
    }

    // 4. Insert attendance (idempotent — UNIQUE constraint on student_id + course_id + date_attended)
    // In the new schema, attendance expects a valid course_id or just uses null if not tracked by course
    const attendancePayload = {
      student_id: student.id,
      date_attended: attendanceDate,
      status: "present",
    };
    if (courseId) {
      attendancePayload.course_id = courseId;
    } else {
      // If course tracking is not required, we can still log a daily attendance entry
      // For AMS-FaceRec, we expect unique (student_id, date_attended) if course_id is null
    }

    const onConflict = "student_id,course_id,date_attended";

    const { data: record, error: insertError } = await supabaseAdmin
      .from("attendance")
      .upsert(attendancePayload, {
        onConflict,
        ignoreDuplicates: true,
      })
      .select()
      .maybeSingle();

    if (insertError) {
      // If unique violation (409 style from Supabase), treat as already-logged — success
      if (insertError.code === "23505") {
        console.log(`[attendanceController] Already logged for ${normalizedSbrn} on ${attendanceDate}`);
        return res.status(200).json({
          success: true,
          message: `Attendance already recorded for ${normalizedSbrn} today.`,
          student_name: student.name,
          sbrn: normalizedSbrn,
          already_logged: true,
        });
      }
      console.error("[attendanceController] insert error:", insertError.message);
      throw new Error(insertError.message);
    }

    console.log(
      `[attendanceController] Attendance logged: ${student.name} (${normalizedSbrn}) | ` +
      `date=${attendanceDate} | course_id=${courseId ?? "none"} | confidence=${confidence ?? "n/a"}`
    );

    return res.status(201).json({
      success: true,
      message: `Attendance marked present for ${student.name}.`,
      student_name: student.name,
      sbrn: normalizedSbrn,
      date: attendanceDate,
      time: time || null,
      course_id: courseId,
    });
  } catch (err) {
    console.error("[attendanceController] logAttendance error:", err.message);
    return res.status(500).json({
      error: "Internal Server Error",
      message: err.message || "Failed to log attendance.",
    });
  }
}

module.exports = { logAttendance };
