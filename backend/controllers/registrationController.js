const { supabaseAdmin } = require("../config/supabaseClient");

const VALID_BRANCHES = [
  "Computer Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Electronics & Communication Engineering",
];

/**
 * Validate self-registration payload.
 * Role is locked to 'student' — teachers are created by admins only.
 * SBRN (Student Board Roll No) is required and used as the login identifier.
 */
function validateRegistrationPayload(body) {
  const errors = [];

  if (!body.full_name || body.full_name.trim().length < 3)
    errors.push("full_name: Required, minimum 3 characters.");

  if (!body.sbrn || body.sbrn.trim().length < 2)
    errors.push("sbrn: Student Board Roll Number is required.");

  // SBRN: allow letters, digits, hyphens, underscores (e.g. STU-001, 2024CS001)
  if (body.sbrn && body.sbrn.trim().length >= 2 && !/^[A-Za-z0-9\-_]+$/.test(body.sbrn.trim()))
    errors.push("sbrn: Only letters, numbers, hyphens (-) and underscores (_) are allowed.");

  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email))
    errors.push("email: Must be a valid email address.");

  if (!body.password || body.password.length < 6)
    errors.push("password: Required, minimum 6 characters.");

  if (!body.confirm_password)
    errors.push("confirm_password: Required.");

  if (body.password && body.confirm_password && body.password !== body.confirm_password)
    errors.push("confirm_password: Passwords do not match.");

  // Branch (replaces 'department')
  const branch = (body.branch || body.department || "").trim();
  if (!branch)
    errors.push("branch: Branch is required.");
  else if (!VALID_BRANCHES.includes(branch))
    errors.push(`branch: Must be one of: ${VALID_BRANCHES.join(", ")}.`);

  // Semester: 1–6 only
  if (
    body.semester === undefined ||
    body.semester === null ||
    body.semester === "" ||
    isNaN(Number(body.semester)) ||
    Number(body.semester) < 1 ||
    Number(body.semester) > 6
  )
    errors.push("semester: Required, must be a number between 1 and 6.");

  // Session: format YYYY - YYYY (e.g. 2023 - 2026)
  const session = (body.session || body.section || "").trim();
  if (!session)
    errors.push("session: Academic session is required (e.g. 2023 - 2026).");
  else if (!/^\d{4}\s*-\s*\d{4}$/.test(session))
    errors.push("session: Must be in the format YYYY - YYYY (e.g. 2023 - 2026).");

  // Phone: optional but if provided must be a 10-digit Indian mobile
  if (body.phone && body.phone.trim().length > 0) {
    if (!/^[6-9]\d{9}$/.test(body.phone.replace(/[\s\-]/g, "")))
      errors.push("phone: Must be a valid 10-digit Indian mobile number.");
  }

  return errors;
}

/**
 * POST /api/auth/register
 *
 * Public — no authentication required.
 * Students self-register here. Account starts as 'pending' and requires admin approval.
 *
 * Body: { full_name, sbrn, email, password, confirm_password }
 *
 * SBRN is stored in:
 *   - profiles.student_id   (for auth context)
 *   - students.student_id_text (for the lookup-sbrn Edge Function used at login)
 */
async function register(req, res) {
  try {
    const {
      full_name, sbrn, email, password, confirm_password,
      // Accept both new (branch/session) and legacy (department/section) field names
      branch, department, semester, session, section, phone,
    } = req.body;

    const resolvedBranch  = (branch || department || "").trim();
    const resolvedSession = (session || section || "").trim();

    // 1. Validate input
    const errors = validateRegistrationPayload({
      full_name, sbrn, email, password, confirm_password,
      branch: resolvedBranch, semester, session: resolvedSession, phone,
    });
    if (errors.length > 0) {
      return res.status(400).json({ error: "Validation Error", messages: errors });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedName     = full_name.trim();
    const normalizedSbrn  = sbrn.trim().toUpperCase();
    const semesterNum     = Number(semester);
    const trimmedPhone    = phone ? phone.replace(/[\s\-]/g, "").trim() : null;

    // 2a. Check if email is already registered
    const { data: existingByEmail } = await supabaseAdmin
      .from("users")
      .select("id, approval_status")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingByEmail) {
      if (existingByEmail.approval_status === "pending") {
        return res.status(409).json({
          error: "Already Registered",
          message: "This email already has a pending registration. Please wait for admin approval.",
        });
      }
      if (existingByEmail.approval_status === "rejected") {
        return res.status(409).json({
          error: "Registration Rejected",
          message: "Your previous registration request was rejected. Please contact your administrator.",
        });
      }
      return res.status(409).json({
        error: "Already Registered",
        message: "An account with this email already exists. Please sign in.",
      });
    }

    // 2b. Check if SBRN is already taken (it must be globally unique for login to work)
    const { data: existingBySbrn } = await supabaseAdmin
      .from("student_details")
      .select("user_id, sbrn")
      .eq("sbrn", normalizedSbrn)
      .maybeSingle();

    if (existingBySbrn) {
      return res.status(409).json({
        error: "SBRN Taken",
        message: `Student Board Roll Number '${normalizedSbrn}' is already registered. If this is your number, please contact your administrator.`,
      });
    }

    // 3. Create Supabase Auth user
    //    - email_confirm: true  → skip email verification (by design)
    //    - approval_status in metadata → picked up by handle_new_user trigger
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: trimmedName,
        role: "student",
        student_id: normalizedSbrn,
        approval_status: "pending",
        branch: resolvedBranch,
        // legacy aliases so older edge functions still work
        department: resolvedBranch,
        course: resolvedBranch,
        semester: semesterNum,
        session: resolvedSession,
        section: resolvedSession,
        phone: trimmedPhone,
      },
    });

    if (authError) {
      if (
        authError.message?.toLowerCase().includes("already") ||
        authError.code === "email_exists"
      ) {
        return res.status(409).json({
          error: "Conflict",
          message: "An account with this email already exists.",
        });
      }
      throw authError;
    }

    const userId = authData.user.id;

    // 4. Upsert users row (defensive fallback in case trigger doesn't fire)
    const { error: userError } = await supabaseAdmin
      .from("users")
      .upsert({
        id: userId,
        email: normalizedEmail,
        role: "student",
        full_name: trimmedName,
        approval_status: "pending",
        branch: resolvedBranch,
        phone: trimmedPhone,
        is_active: false
      });

    if (userError) {
      console.error("[registrationController] Users upsert error:", userError.message);
    }

    // 5. Insert into student_details table
    const { error: studentDetailsError } = await supabaseAdmin
      .from("student_details")
      .upsert({
        user_id: userId,
        sbrn: normalizedSbrn,
        semester: semesterNum,
        session: resolvedSession,
      });

    if (studentDetailsError) {
      console.error("[registrationController] student_details upsert error:", studentDetailsError.message);
      console.warn(
        `[registrationController] WARNING: student_details row for SBRN '${normalizedSbrn}' was NOT created. ` +
        "Login via SBRN will fail until this is resolved."
      );
    }

    console.log(
      `[registrationController] New student registration: ${normalizedEmail} | SBRN: ${normalizedSbrn} (pending approval)`
    );

    return res.status(201).json({
      message:
        "Registration submitted successfully. Your account is pending admin approval. " +
        "You will be able to sign in with your Student Board Roll Number once an administrator approves your request.",
    });
  } catch (err) {
    console.error("[registrationController] register error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: err.message || "Registration failed. Please try again.",
    });
  }
}

module.exports = { register };
