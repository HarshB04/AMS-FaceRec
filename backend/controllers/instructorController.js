const { supabaseAdmin } = require("../config/supabaseClient");

/**
 * POST /api/instructors/register
 * 
 * Admin only. Creates a Supabase Auth user with the 'teacher' role and 
 * inserts them into the instructors table.
 */
async function registerTeacher(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Validation Error", message: "Name, email, and password are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    // 1. Create Supabase Auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: trimmedName,
        role: "teacher", // This will be copied to profiles table via handle_new_user trigger
      },
    });

    if (authError) {
      if (authError.message?.toLowerCase().includes("already") || authError.code === "email_exists") {
        return res.status(409).json({ error: "Conflict", message: "An account with this email already exists." });
      }
      throw authError;
    }

    // 2. Insert into the instructors table
    const { data: instructorData, error: instructorError } = await supabaseAdmin
      .from("instructors")
      .insert({
        name: trimmedName,
        email: normalizedEmail,
      })
      .select()
      .single();

    if (instructorError) {
      console.error("[instructorController] Failed to insert into instructors table:", instructorError.message);
      // We don't fail the request completely since the auth user was created, but log it.
    }

    return res.status(201).json({
      success: true,
      message: "Teacher registered successfully.",
      teacher: instructorData || { name: trimmedName, email: normalizedEmail },
    });

  } catch (err) {
    console.error("[instructorController] registerTeacher error:", err);
    return res.status(500).json({ error: "Internal Server Error", message: "Failed to register teacher." });
  }
}

module.exports = { registerTeacher };
