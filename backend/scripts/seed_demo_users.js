/**
 * seed_demo_users.js
 *
 * Reads existing rows from the `students` and `instructors` tables in Supabase,
 * then creates Supabase Auth accounts + profiles for any that don't have one yet.
 *
 * Run from the backend/ directory:
 *   node scripts/seed_demo_users.js
 *
 * SAFE TO RE-RUN — skips users that already exist in Auth.
 *
 * Passwords assigned:
 *   Students  → Student@AMS2024
 *   Teachers  → Teacher@AMS2024
 */

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

// ─── Supabase admin client ────────────────────────────────────────────────────
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE) {
  console.error("✗ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE in backend/.env");
  process.exit(1);
}

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const STUDENT_PASSWORD = "Student@AMS2024";
const TEACHER_PASSWORD = "Teacher@AMS2024";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function isAlreadyExistsError(err) {
  const msg = (err?.message || "").toLowerCase();
  return (
    msg.includes("already") ||
    msg.includes("duplicate") ||
    msg.includes("exists") ||
    err?.code === "email_exists"
  );
}

// ─── Create Auth + Profile for a student row ──────────────────────────────────
async function processStudent(student) {
  const email    = student.email?.trim().toLowerCase();
  const name     = student.name?.trim();
  const sbrn     = student.student_id_text?.trim().toUpperCase();
  const branch   = (student.branch || student.department || student.course || "").trim();
  const semester = student.semester ? Number(student.semester) : null;
  const session  = (student.session || student.section || "").trim();
  const approval = student.status === "active" ? "approved" : "pending";

  if (!email || !sbrn) {
    console.warn(`  ⚠ Skipping student with missing email or SBRN (id=${student.id})`);
    return;
  }

  // 1. Create auth user
  const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: STUDENT_PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name:       name,
      role:            "student",
      student_id:      sbrn,
      approval_status: approval,
      branch,
      department:      branch,
      semester,
      session,
    },
  });

  if (authError) {
    if (isAlreadyExistsError(authError)) {
      console.log(`  ⚠ Auth already exists: ${email}`);
      return;
    }
    console.error(`  ✗ Auth error for ${email}:`, authError.message);
    return;
  }

  const userId = data.user.id;

  // Removed profile upsert as it is handled by the handle_new_user trigger in the new schema

  console.log(`  ✓ ${name?.padEnd(28) ?? "?"} | ${sbrn} | Sem ${semester ?? "?"} | ${branch}`);
}

// ─── Create Auth + Profile for an instructor row ──────────────────────────────
async function processTeacher(teacher) {
  const email  = teacher.email?.trim().toLowerCase();
  const name   = teacher.name?.trim();
  const branch = (teacher.branch || teacher.department || "").trim();

  if (!email) {
    console.warn(`  ⚠ Skipping instructor with missing email (id=${teacher.id})`);
    return;
  }

  // 1. Create auth user
  const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: TEACHER_PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name:       name,
      role:            "teacher",
      approval_status: "approved",
      branch,
      department:      branch,
    },
  });

  if (authError) {
    if (isAlreadyExistsError(authError)) {
      console.log(`  ⚠ Auth already exists: ${email}`);
      return;
    }
    console.error(`  ✗ Auth error for ${email}:`, authError.message);
    return;
  }

  const userId = data.user.id;

  // Removed profile upsert as it is handled by the handle_new_user trigger in the new schema

  console.log(`  ✓ ${name?.padEnd(28) ?? "?"} | ${email}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n══════════════════════════════════════════════════════════════");
  console.log("  AMS-FaceRec — Link Profiles to Existing DB Rows");
  console.log("══════════════════════════════════════════════════════════════");
  console.log(`  Reading from: ${process.env.SUPABASE_URL}\n`);

  // ── Fetch students from DB ─────────────────────────────────────────────────
  const { data: students, error: studentsError } = await supabaseAdmin
    .from("students")
    .select("*");

  if (studentsError) {
    console.error("✗ Failed to fetch students:", studentsError.message);
    process.exit(1);
  }

  // ── Fetch instructors from DB ──────────────────────────────────────────────
  const { data: instructors, error: instrError } = await supabaseAdmin
    .from("instructors")
    .select("*");

  if (instrError) {
    console.error("✗ Failed to fetch instructors:", instrError.message);
    process.exit(1);
  }

  console.log(`  Found ${students.length} student(s) and ${instructors.length} instructor(s) in DB.\n`);

  // ── Process students ───────────────────────────────────────────────────────
  if (students.length > 0) {
    console.log("Creating student auth accounts...\n");
    for (const student of students) {
      await processStudent(student);
      await sleep(150); // stay under Supabase rate limits
    }
  } else {
    console.log("  No students found in the students table.\n");
  }

  // ── Process teachers ───────────────────────────────────────────────────────
  if (instructors.length > 0) {
    console.log("\nCreating teacher auth accounts...\n");
    for (const teacher of instructors) {
      await processTeacher(teacher);
      await sleep(150);
    }
  } else {
    console.log("\n  No instructors found in the users table.\n");
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\n──────────────────────────────────────────────────────────────");
  console.log("  ✓ Done!\n");
  console.log("  Login credentials:");
  console.log(`  Students  → SBRN as username  | password: ${STUDENT_PASSWORD}`);
  console.log(`  Teachers  → email as username  | password: ${TEACHER_PASSWORD}`);
  console.log("══════════════════════════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
