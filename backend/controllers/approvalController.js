const { supabaseAdmin } = require("../config/supabaseClient");
const { sendApprovalEmail, sendRejectionEmail } = require("../utils/emailService");

/**
 * GET /api/admin/pending-users
 *
 * Admin only. Returns all profiles with approval_status = 'pending'.
 * Ordered by creation time (oldest first — FIFO review).
 */
async function getPendingUsers(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name, role, approval_status, created_at, branch, phone, student_details(sbrn, semester, session)")
      .eq("approval_status", "pending")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[approvalController] getPendingUsers Supabase error:", error);
      throw new Error(error.message);
    }

    // Flatten student_details
    const flattenedUsers = (data || []).map(u => ({
      ...u,
      department: u.branch, // for backwards compatibility in UI
      student_id: u.student_details?.[0]?.sbrn,
      semester: u.student_details?.[0]?.semester,
      session: u.student_details?.[0]?.session
    }));

    return res.status(200).json({
      users: flattenedUsers,
      count: flattenedUsers.length,
    });
  } catch (err) {
    console.error("[approvalController] getPendingUsers error:", err.message);
    return res.status(500).json({
      error: "Internal Server Error",
      message: err.message || "Failed to fetch pending users.",
    });
  }
}

/**
 * GET /api/admin/all-registration-users
 *
 * Admin only. Returns ALL profiles (any approval_status), merged with
 * auth.users creation timestamps for accurate "Registered" dates.
 * Ordered newest-first.
 */
async function getAllRegistrationUsers(req, res) {
  try {
    // 1. Fetch all users
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name, role, approval_status, created_at, branch, phone, student_details(sbrn, semester, session)");

    if (profilesError) {
      console.error("[approvalController] profiles query error:", profilesError);
      throw new Error(profilesError.message);
    }

    if (!profiles || profiles.length === 0) {
      return res.status(200).json({ users: [], count: 0 });
    }

    // 2. Fetch auth.users creation timestamps (batch — up to 1000 users)
    let authCreatedAtMap = {};
    try {
      const { data: authData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      if (authData?.users) {
        authCreatedAtMap = Object.fromEntries(
          authData.users.map((u) => [u.id, u.created_at])
        );
      }
    } catch (authErr) {
      console.warn("[approvalController] Could not fetch auth timestamps:", authErr.message);
    }

    // 3. Merge and sort newest-first
    const merged = profiles
      .map((p) => ({
        ...p,
        department: p.branch,
        student_id: p.student_details?.[0]?.sbrn,
        semester: p.student_details?.[0]?.semester,
        session: p.student_details?.[0]?.session,
        created_at: authCreatedAtMap[p.id] || p.created_at || new Date().toISOString(),
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return res.status(200).json({ users: merged, count: merged.length });
  } catch (err) {
    console.error("[approvalController] getAllRegistrationUsers error:", err.message);
    return res.status(500).json({
      error: "Internal Server Error",
      message: err.message || "Failed to fetch registration users.",
    });
  }
}

/**
 * POST /api/admin/approve/:id
 *
 * Admin only. Approves a self-registered student:
 *   1. profiles.approval_status → 'approved'
 *   2. students.status          → 'active'  (makes them visible as active in Student Management)
 *   3. Sends an approval email with login instructions
 *
 * :id is the auth user UUID (profiles.id).
 */
async function approveUser(req, res) {
  try {
    const { id } = req.params;

    // 1. Fetch the user (get email, full_name, student_details for email)
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name, approval_status, student_details(sbrn)")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      console.error("[approvalController] approveUser fetch error:", fetchError);
      throw new Error(fetchError.message);
    }
    if (!profile) {
      return res.status(404).json({ error: "Not Found", message: "User not found." });
    }
    if (profile.approval_status === "approved") {
      return res.status(400).json({
        error: "Bad Request",
        message: "This user is already approved.",
      });
    }

    // 2. Update users.approval_status → 'approved' and is_active → true
    const { error: profileUpdateError } = await supabaseAdmin
      .from("users")
      .update({ approval_status: "approved", is_active: true })
      .eq("id", id);

    if (profileUpdateError) {
      console.error("[approvalController] approveUser profile update error:", profileUpdateError);
      throw new Error(profileUpdateError.message);
    }

    // 3. We no longer need to activate a separate 'students' row since the 'users' table handles active status.
    console.log(`[approvalController] users.is_active set to true for ${profile.email}`);

    // 4. Send approval email (fire-and-forget — errors are caught inside emailService)
    const sbrn = profile.student_details?.[0]?.sbrn || "";
    sendApprovalEmail({
      to: profile.email,
      name: profile.full_name || profile.email,
      sbrn: sbrn,
    });

    console.log(
      `[approvalController] Approved: ${profile.email} (${id}) by admin ${req.user?.email}`
    );

    return res.status(200).json({
      message: `User '${profile.full_name || profile.email}' has been approved. They can now log in and will receive a confirmation email.`,
    });
  } catch (err) {
    console.error("[approvalController] approveUser error:", err.message);
    return res.status(500).json({
      error: "Internal Server Error",
      message: err.message || "Failed to approve user.",
    });
  }
}

/**
 * POST /api/admin/reject/:id
 *
 * Admin only. Rejects a registration request:
 *   1. profiles.approval_status → 'rejected'
 *   2. students.status          → 'inactive' (they stay listed but inactive)
 *   3. Sends a rejection notification email
 *
 * :id is the auth user UUID (profiles.id).
 */
async function rejectUser(req, res) {
  try {
    const { id } = req.params;

    // 1. Fetch the user
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name, approval_status")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      console.error("[approvalController] rejectUser fetch error:", fetchError);
      throw new Error(fetchError.message);
    }
    if (!profile) {
      return res.status(404).json({ error: "Not Found", message: "User not found." });
    }
    if (profile.approval_status === "rejected") {
      return res.status(400).json({
        error: "Bad Request",
        message: "This user is already rejected.",
      });
    }

    // 2. Update users.approval_status → 'rejected' and is_active → false
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ approval_status: "rejected", is_active: false })
      .eq("id", id);

    if (updateError) {
      console.error("[approvalController] rejectUser update error:", updateError);
      throw new Error(updateError.message);
    }

    // 3. Keep students row as 'inactive' (already set during registration — no change needed)

    // 4. Send rejection email (fire-and-forget)
    sendRejectionEmail({
      to: profile.email,
      name: profile.full_name || profile.email,
    });

    console.log(
      `[approvalController] Rejected: ${profile.email} (${id}) by admin ${req.user?.email}`
    );

    return res.status(200).json({
      message: `User '${profile.full_name || profile.email}' has been rejected. A notification email has been sent.`,
    });
  } catch (err) {
    console.error("[approvalController] rejectUser error:", err.message);
    return res.status(500).json({
      error: "Internal Server Error",
      message: err.message || "Failed to reject user.",
    });
  }
}

module.exports = { getPendingUsers, getAllRegistrationUsers, approveUser, rejectUser };
