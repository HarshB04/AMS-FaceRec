const { supabaseAnon, supabaseAdmin } = require("../config/supabaseClient");

// ── Helpers ──────────────────────────────────────────────────────────────────

function getDetails(d) {
  if (!d) return {};
  return Array.isArray(d) ? (d[0] || {}) : d;
}

/**
 * Sign in a user and verify their role from the profiles table.
 * Returns { session, profile } or throws an error.
 */
async function signInAndVerifyRole(email, password, expectedRole) {
  // Step 1: Authenticate with Supabase Auth
  const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.session) {
    const err = new Error(authError?.message || "Authentication failed.");
    err.statusCode = 401;
    throw err;
  }

  // Step 2: Fetch user from the unified users table (with role extensions)
  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .select(`
      id, role, email, full_name, branch, phone, avatar_url, approval_status,
      student_details ( sbrn, semester, session ),
      teacher_details ( faculty_code, designation )
    `)
    .eq("id", authData.session.user.id)
    .single();

  if (userError || !user) {
    const err = new Error("User account not found. Contact your administrator.");
    err.statusCode = 403;
    throw err;
  }

  // Step 3: Check approval status (for self-registered users)
  if (user.approval_status === "pending") {
    const err = new Error(
      "Your account is waiting for admin approval. You will be notified once access is granted."
    );
    err.statusCode = 403;
    throw err;
  }
  if (user.approval_status === "rejected") {
    const err = new Error(
      "Your registration request was rejected. Please contact your administrator."
    );
    err.statusCode = 403;
    throw err;
  }

  // Step 4: Enforce role
  if (user.role !== expectedRole) {
    const err = new Error(
      `Access denied. This login portal is for '${expectedRole}' accounts only.`
    );
    err.statusCode = 403;
    throw err;
  }

  // Flatten the user object for the frontend
  const studentDetails = getDetails(user.student_details);
  const teacherDetails = getDetails(user.teacher_details);

  const profile = {
    id: user.id,
    role: user.role,
    email: user.email,
    full_name: user.full_name,
    branch: user.branch,
    department: user.branch, // Alias for frontend compatibility
    phone: user.phone,
    profile_image: user.avatar_url,
    approval_status: user.approval_status,
    ...studentDetails, // Adds sbrn, semester, session
    student_id: studentDetails.sbrn, // Alias for frontend compatibility
    ...teacherDetails  // Adds faculty_code, designation
  };

  return { session: authData.session, profile };
}

// ── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/auth/admin/login
 * Body: { email: string, password: string }
 */
async function adminLogin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Bad Request", message: "Email and password are required." });
    }

    const { session, profile } = await signInAndVerifyRole(email, password, "admin");

    return res.status(200).json({
      message: "Admin login successful.",
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        token_type: session.token_type,
      },
      user: profile,
    });
  } catch (err) {
    console.error("[authController] adminLogin error:", err.message);
    return res.status(err.statusCode || 500).json({
      error: err.statusCode === 401 ? "Unauthorized" : err.statusCode === 403 ? "Forbidden" : "Internal Server Error",
      message: err.message,
    });
  }
}

/**
 * POST /api/auth/teacher/login
 * Body: { email: string, password: string }
 */
async function teacherLogin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Bad Request", message: "Email and password are required." });
    }

    const { session, profile } = await signInAndVerifyRole(email, password, "teacher");

    return res.status(200).json({
      message: "Teacher login successful.",
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        token_type: session.token_type,
      },
      user: profile,
    });
  } catch (err) {
    console.error("[authController] teacherLogin error:", err.message);
    return res.status(err.statusCode || 500).json({
      error: err.statusCode === 401 ? "Unauthorized" : err.statusCode === 403 ? "Forbidden" : "Internal Server Error",
      message: err.message,
    });
  }
}

/**
 * POST /api/auth/student/login
 * Body: { email: string, password: string }
 * Note: For SBRN-based login, the frontend should resolve the email first
 * via the existing Edge Function (lookup-sbrn), then call this endpoint.
 */
async function studentLogin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Bad Request", message: "Email and password are required." });
    }

    const { session, profile } = await signInAndVerifyRole(email, password, "student");

    return res.status(200).json({
      message: "Student login successful.",
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        token_type: session.token_type,
      },
      user: profile,
    });
  } catch (err) {
    console.error("[authController] studentLogin error:", err.message);
    return res.status(err.statusCode || 500).json({
      error: err.statusCode === 401 ? "Unauthorized" : err.statusCode === 403 ? "Forbidden" : "Internal Server Error",
      message: err.message,
    });
  }
}

/**
 * GET /api/auth/me
 * Requires: authMiddleware (attaches req.user and req.token)
 */
async function getMe(req, res) {
  try {
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select(`
        id, role, email, full_name, branch, phone, avatar_url, approval_status,
        student_details ( sbrn, semester, session ),
        teacher_details ( faculty_code, designation )
      `)
      .eq("id", req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: "Not Found", message: "User account not found." });
    }

    const studentDetails = getDetails(user.student_details);
    const teacherDetails = getDetails(user.teacher_details);

    const profile = {
      id: user.id,
      role: user.role,
      email: user.email,
      full_name: user.full_name,
      branch: user.branch,
      department: user.branch, // Alias
      phone: user.phone,
      profile_image: user.avatar_url,
      approval_status: user.approval_status,
      ...studentDetails,
      student_id: studentDetails.sbrn, // Alias
      ...teacherDetails
    };

    return res.status(200).json({ user: profile });
  } catch (err) {
    console.error("[authController] getMe error:", err.message);
    return res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
}

/**
 * POST /api/auth/lookup-sbrn
 * Body: { sbrn: string }
 *
 * Public — no auth required.
 * Resolves a Student Board Roll Number → registered email.
 * Used by the frontend login form before calling /student/login.
 */
async function lookupSbrn(req, res) {
  try {
    const sbrn = (req.body.sbrn || "").trim().toUpperCase();

    if (!sbrn) {
      return res.status(400).json({ error: "Bad Request", message: "sbrn is required." });
    }

    // Look up in the new users + student_details table
    // student_details has the sbrn, so we query it and join users
    const { data: studentRecord, error } = await supabaseAdmin
      .from("student_details")
      .select(`
        sbrn,
        users!inner (
          email,
          full_name,
          approval_status,
          is_active
        )
      `)
      .eq("sbrn", sbrn)
      .maybeSingle();

    if (error) {
      console.error("[lookupSbrn] DB error:", error);
      return res.status(500).json({ error: "Database Error", message: "Failed to look up SBRN." });
    }

    if (studentRecord && studentRecord.users) {
      const user = studentRecord.users;

      if (user.approval_status === "pending") {
        return res.status(403).json({
          error: "Pending Approval",
          message: "Your account is waiting for admin approval.",
        });
      }
      
      if (!user.is_active || user.approval_status === "rejected") {
        return res.status(403).json({
          error: "Account Inactive",
          message: "Your account is inactive or rejected. Please contact your administrator.",
        });
      }

      return res.status(200).json({ email: user.email, name: user.full_name });
    }

    return res.status(404).json({
      error: "Not Found",
      message: `Student ID '${sbrn}' is not registered. Check your ID or contact your administrator.`,
    });
  } catch (err) {
    console.error("[authController] lookupSbrn error:", err.message);
    return res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
}

module.exports = { adminLogin, teacherLogin, studentLogin, getMe, lookupSbrn };
