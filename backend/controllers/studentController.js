const { supabaseAdmin } = require("../config/supabaseClient");

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Validate required student registration fields */
function validateStudentPayload(body) {
  const errors = [];

  if (!body.full_name || body.full_name.trim().length < 3)
    errors.push("full_name: required, minimum 3 characters.");
  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email))
    errors.push("email: must be a valid email address.");
  if (!body.student_id || body.student_id.trim().length < 4)
    errors.push("student_id: required, minimum 4 characters.");
  if (!body.department || body.department.trim().length === 0)
    errors.push("department: required.");
  if (
    body.semester === undefined ||
    body.semester === null ||
    isNaN(Number(body.semester)) ||
    Number(body.semester) < 1 ||
    Number(body.semester) > 8
  )
    errors.push("semester: required, must be a number between 1 and 8.");
  if (!body.password || body.password.length < 6)
    errors.push("password: required, minimum 6 characters.");

  return errors;
}

// ── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/students/register
 * Admin only. Creates:
 *   1. A Supabase Auth user
 *   2. A profiles row (via trigger or manual upsert)
 *   3. A students row (for attendance tracking)
 */
async function registerStudent(req, res) {
  try {
    const {
      full_name,
      email,
      student_id,
      department,
      semester,
      phone,
      password,
    } = req.body;

    // Validate
    const errors = validateStudentPayload(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: "Validation Error", messages: errors });
    }

    // Step 1: Create Supabase Auth user (service role — skips email confirmation)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,  // auto-confirm so they can log in immediately
      user_metadata: {
        full_name,
        student_id,
        department,
        semester: Number(semester),
        phone: phone || null,
        role: "student",
      },
    });

    if (authError) {
      // Handle duplicate email gracefully
      if (authError.message?.includes("already") || authError.code === "email_exists") {
        return res.status(409).json({ error: "Conflict", message: "A user with this email already exists." });
      }
      throw authError;
    }

    const userId = authUser.user.id;

    // Step 2: Upsert user row (trigger handle_new_user should fire, but we ensure it)
    const { error: userError } = await supabaseAdmin
      .from("users")
      .upsert({
        id: userId,
        email: email.trim().toLowerCase(),
        role: "student",
        full_name: full_name.trim(),
        branch: department.trim(),
        phone: phone?.trim() || null,
        approval_status: "approved",
        is_active: true
      })
      .eq("id", userId);

    if (userError) {
      console.error("[studentController] Users upsert error:", userError.message);
    }

    // Step 3: Insert / upsert into student_details table
    const { data: studentRow, error: studentError } = await supabaseAdmin
      .from("student_details")
      .upsert({
        user_id: userId,
        sbrn: student_id.trim(),
        semester: Number(semester),
        session: new Date().getFullYear().toString(),
        attendance_rate: 0
      })
      .select()
      .single();

    if (studentError) {
      console.error("[studentController] Students row error:", studentError.message);
    }

    return res.status(201).json({
      message: "Student registered successfully.",
      user: {
        id: userId,
        email: email.trim().toLowerCase(),
        full_name: full_name.trim(),
        student_id: student_id.trim(),
        department: department.trim(),
        semester: Number(semester),
        role: "student",
      },
      student: studentRow || null,
    });
  } catch (err) {
    console.error("[studentController] registerStudent error:", err);
    return res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
}

/**
 * GET /api/students/profile
 * Authenticated student fetches their own profile.
 */
async function getProfile(req, res) {
  try {
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select(`
        id, role, email, full_name, branch, phone, avatar_url, approval_status, is_active, created_at,
        student_details ( sbrn, semester, session, attendance_rate )
      `)
      .eq("id", req.user.id)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: "Not Found", message: "Profile not found." });
    }

    // Check face enrollment in face_embeddings table
    const { data: face } = await supabaseAdmin
      .from("face_embeddings")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    const studentDetails = user.student_details?.[0] || {};

    return res.status(200).json({
      profile: {
        id: user.id,
        role: user.role,
        email: user.email,
        full_name: user.full_name,
        student_id: studentDetails.sbrn,
        department: user.branch,
        semester: studentDetails.semester,
        session: studentDetails.session,
        phone: user.phone,
        profile_image: user.avatar_url,
        attendance_rate: studentDetails.attendance_rate ?? 0,
        face_enrolled: !!face,
        status: user.is_active ? "active" : "inactive",
        registration_date: user.created_at,
      },
    });
  } catch (err) {
    console.error("[studentController] getProfile error:", err.message);
    return res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
}

/**
 * GET /api/students/all
 * Admin only. Returns all student profiles with attendance data.
 */
async function getAllStudents(req, res) {
  try {
    const { data: users, error } = await supabaseAdmin
      .from("users")
      .select(`
        id, email, full_name, branch, phone, avatar_url, role, is_active,
        student_details ( sbrn, semester, session, attendance_rate ),
        face_embeddings ( id )
      `)
      .eq("role", "student")
      .order("full_name", { ascending: true });

    if (error) throw error;

    const enriched = (users || []).map((u) => {
      const details = u.student_details?.[0] || {};
      return {
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        student_id: details.sbrn,
        department: u.branch,
        semester: details.semester,
        phone: u.phone,
        profile_image: u.avatar_url,
        role: u.role,
        attendance_rate: details.attendance_rate ?? 0,
        face_enrolled: u.face_embeddings && u.face_embeddings.length > 0,
        status: u.is_active ? "active" : "inactive",
      };
    });

    return res.status(200).json({ students: enriched, count: enriched.length });
  } catch (err) {
    console.error("[studentController] getAllStudents error:", err.message);
    return res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
}

/**
 * PUT /api/students/:id
 * Admin only. Update profile + students row.
 * :id is the auth user UUID.
 */
async function updateStudent(req, res) {
  try {
    const { id } = req.params;
    const { full_name, department, semester, phone, student_id } = req.body;

    const userUpdate = {};
    if (full_name !== undefined) userUpdate.full_name = full_name;
    if (department !== undefined) userUpdate.branch = department;
    if (phone !== undefined) userUpdate.phone = phone;

    const detailsUpdate = {};
    if (semester !== undefined) detailsUpdate.semester = Number(semester);
    if (student_id !== undefined) detailsUpdate.sbrn = student_id;

    if (Object.keys(userUpdate).length === 0 && Object.keys(detailsUpdate).length === 0) {
      return res.status(400).json({ error: "Bad Request", message: "No fields to update." });
    }

    let updated = null;

    if (Object.keys(userUpdate).length > 0) {
      const { data, error } = await supabaseAdmin
        .from("users")
        .update(userUpdate)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      updated = data;
    }

    if (Object.keys(detailsUpdate).length > 0) {
      const { error } = await supabaseAdmin
        .from("student_details")
        .update(detailsUpdate)
        .eq("user_id", id);
      if (error) throw error;
    }

    return res.status(200).json({ message: "Student updated.", profile: updated || { id } });
  } catch (err) {
    console.error("[studentController] updateStudent error:", err.message);
    return res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
}

/**
 * DELETE /api/students/:id
 * Admin only. Deletes auth user (cascades to profiles via FK).
 * Also removes students row.
 */
async function deleteStudent(req, res) {
  try {
    const { id } = req.params;

    // users table cascade deletes student_details and auth.users cascades to users... wait
    // Actually, deleting auth user cascades to public.users via our foreign key.
    // And public.users cascades to student_details. So we only need to delete the auth user!

    // Delete auth user (cascades to profiles via ON DELETE CASCADE)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) throw error;

    return res.status(200).json({ message: "Student deleted successfully." });
  } catch (err) {
    console.error("[studentController] deleteStudent error:", err.message);
    return res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
}

module.exports = { registerStudent, getProfile, getAllStudents, updateStudent, deleteStudent };
