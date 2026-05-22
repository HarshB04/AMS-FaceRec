/**
 * fix_missing_data.js — AMS-FaceRec Data Integrity Fixer
 *
 * Fixes all issues found by audit_tables.js:
 *   1. admin_details missing rows
 *   2. student_details missing rows (placeholder SBRN inserted)
 *   3. enrollments — bulk-link students & teachers to courses by branch+semester
 *   4. activity_logs — seed a system_ready event
 *
 * Run from backend/:  node scripts/fix_missing_data.js
 */
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ── Logger ────────────────────────────────────────────────────────────────────
function log(label, msg) {
  const icons = { ok: "✓", warn: "⚠", info: "ℹ", err: "✗", fix: "🔧" };
  console.log(`  ${icons[label] || " "} ${msg}`);
}

// ── Branch normaliser ─────────────────────────────────────────────────────────
// Expands short forms to canonical lower-case full names
const BRANCH_MAP = {
  "computer":  "computer engineering",
  "cs":        "computer science",
  "ce":        "computer engineering",
  "ee":        "electrical engineering",
  "me":        "mechanical engineering",
  "ece":       "electronics & communication engineering",
  "ec":        "electronics & communication engineering",
  "civil":     "civil engineering",
  "it":        "information technology",
};
function normBranch(raw) {
  if (!raw) return "";
  const lower = raw.toLowerCase().trim();
  return BRANCH_MAP[lower] || lower;
}

// ── Semester normaliser ───────────────────────────────────────────────────────
// Handles Roman numerals (I..VIII) and plain integers
const ROMAN = { I:1, II:2, III:3, IV:4, V:5, VI:6, VII:7, VIII:8 };
function parseSem(val) {
  if (val === null || val === undefined) return null;
  const s = String(val).trim().toUpperCase();
  if (ROMAN[s] !== undefined) return ROMAN[s];
  const n = parseInt(s, 10);
  return isNaN(n) ? null : n;
}

// ══════════════════════════════════════════════════════════════════════════════
// Fix 1 — admin_details: ensure every admin has a row
// ══════════════════════════════════════════════════════════════════════════════
async function fixAdminDetails() {
  console.log("\n── Fix 1: admin_details ─────────────────────────────────────────");

  const { data: admins, error } = await supabase
    .from("users")
    .select("id, email")
    .eq("role", "admin");

  if (error) { log("err", `Fetch failed: ${error.message}`); return; }

  for (const admin of admins) {
    const { error: uErr } = await supabase
      .from("admin_details")
      .upsert({ user_id: admin.id, permission_scope: "full" });

    if (uErr) log("err", `Failed for ${admin.email}: ${uErr.message}`);
    else      log("ok",  `admin_details upserted: ${admin.email}`);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Fix 2 — student_details: create placeholder rows for orphaned students
// ══════════════════════════════════════════════════════════════════════════════
async function fixMissingStudentDetails() {
  console.log("\n── Fix 2: student_details missing rows ──────────────────────────");

  const { data: allStudents, error: sErr } = await supabase
    .from("users").select("id, email").eq("role", "student");
  if (sErr) { log("err", sErr.message); return; }

  const { data: existing, error: dErr } = await supabase
    .from("student_details").select("user_id");
  if (dErr) { log("err", dErr.message); return; }

  const covered = new Set((existing || []).map(r => r.user_id));
  const missing = allStudents.filter(s => !covered.has(s.id));

  if (missing.length === 0) {
    log("ok", "All students already have a student_details row.");
    return;
  }

  for (const s of missing) {
    const sbrn = `TEMP-${s.id.slice(0, 8).toUpperCase()}`;
    const { error: iErr } = await supabase.from("student_details").upsert({
      user_id: s.id, sbrn, semester: 1,
      session: new Date().getFullYear().toString(), attendance_rate: 0,
    });
    if (iErr) log("err", `Insert failed (${s.email}): ${iErr.message}`);
    else {
      log("fix",  `Created placeholder for ${s.email}  →  SBRN: ${sbrn}`);
      log("info", `  → Update SBRN manually in Supabase dashboard`);
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Fix 3 — enrollments: link students & teachers to courses (branch + semester)
// ══════════════════════════════════════════════════════════════════════════════
async function fixEnrollments() {
  console.log("\n── Fix 3: enrollments (student↔course + teacher↔course) ─────────");

  // ── Fetch all data flat (no nested joins) ──────────────────────────────────
  const { data: users, error: uErr } = await supabase
    .from("users").select("id, role, branch")
    .in("role", ["student", "teacher"])
    .eq("is_active", true);
  if (uErr) { log("err", `users: ${uErr.message}`); return; }

  const { data: details, error: dErr } = await supabase
    .from("student_details").select("user_id, semester");
  if (dErr) { log("err", `student_details: ${dErr.message}`); return; }

  const { data: courses, error: cErr } = await supabase
    .from("courses").select("id, branch, semester");
  if (cErr) { log("err", `courses: ${cErr.message}`); return; }

  log("info", `users: ${users.length}  |  student_details: ${details.length}  |  courses: ${courses.length}`);

  if (!courses || courses.length === 0) {
    log("warn", "No courses found — cannot enroll anyone."); return;
  }

  // ── Build semester lookup for students ─────────────────────────────────────
  const semMap = Object.fromEntries((details || []).map(d => [d.user_id, d.semester]));

  // ── Debug: show normalised distinct branch/sem pairs ──────────────────────
  const students = users.filter(u => u.role === "student");
  const teachers = users.filter(u => u.role === "teacher");

  const sPairs = [...new Set(students.map(s => `${normBranch(s.branch)}|${semMap[s.id]}`).filter(p => !p.startsWith("|")))].slice(0, 5);
  const cPairs = [...new Set(courses.map(c => `${normBranch(c.branch)}|${parseSem(c.semester)}`))].slice(0, 5);
  log("info", `Student branch|sem: ${sPairs.join("  ·  ")}`);
  log("info", `Course  branch|sem: ${cPairs.join("  ·  ")}`);

  // ── Build enrollment pairs ─────────────────────────────────────────────────
  const rows = [];

  // Students → courses matching by branch + semester
  for (const student of students) {
    const sBranch = normBranch(student.branch);
    const sSem    = semMap[student.id];
    if (!sBranch || sSem == null) continue;

    for (const course of courses) {
      if (normBranch(course.branch) === sBranch && parseSem(course.semester) === sSem) {
        rows.push({ user_id: student.id, course_id: course.id, role_in_course: "student" });
      }
    }
  }

  // Teachers → all courses in their branch (across all semesters)
  for (const teacher of teachers) {
    const tBranch = normBranch(teacher.branch);
    if (!tBranch) continue;

    for (const course of courses) {
      if (normBranch(course.branch) === tBranch) {
        rows.push({ user_id: teacher.id, course_id: course.id, role_in_course: "instructor" });
      }
    }
  }

  log("info", `Built ${rows.length} enrollment pairs (${rows.filter(r=>r.role_in_course==="student").length} student + ${rows.filter(r=>r.role_in_course==="instructor").length} teacher)`);

  if (rows.length === 0) {
    // Detailed mismatch diagnostics
    log("warn", "No matching branch+semester pairs found — showing full debug info:");
    const ub = [...new Set(students.map(s => normBranch(s.branch)).filter(Boolean))];
    const cb = [...new Set(courses.map(c => normBranch(c.branch)).filter(Boolean))];
    const us = [...new Set(students.map(s => semMap[s.id]).filter(v => v != null))];
    const cs = [...new Set(courses.map(c => parseSem(c.semester)).filter(v => v != null))];
    log("info", "Student branches: " + ub.join(", "));
    log("info", "Course  branches: " + cb.join(", "));
    log("info", "Student semesters: " + us.join(", "));
    log("info", "Course  semesters: " + cs.join(", "));
    return;
  }

  // ── Batch upsert in chunks of 100 ─────────────────────────────────────────
  let inserted = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100);
    const { error: eErr } = await supabase
      .from("enrollments")
      .upsert(chunk, { onConflict: "user_id,course_id", ignoreDuplicates: true });
    if (eErr) log("err", `Chunk ${Math.floor(i / 100) + 1}: ${eErr.message}`);
    else inserted += chunk.length;
  }

  log("ok", `Upserted ${inserted} enrollment rows into the enrollments table`);
}

// ══════════════════════════════════════════════════════════════════════════════
// Fix 4 — activity_logs: seed one entry so the table isn't empty
// ══════════════════════════════════════════════════════════════════════════════
async function seedActivityLog() {
  console.log("\n── Fix 4: activity_logs (seed system_ready) ─────────────────────");

  const { data: admin } = await supabase
    .from("users").select("id").eq("role", "admin").limit(1).maybeSingle();
  if (!admin) { log("warn", "No admin user found."); return; }

  // Only insert if table is empty
  const { count } = await supabase
    .from("activity_logs").select("*", { count: "exact", head: true });
  if (count > 0) { log("info", `activity_logs already has ${count} row(s) — skipping.`); return; }

  const { error } = await supabase.from("activity_logs").insert({
    user_id:     admin.id,
    action:      "system_ready",
    entity_type: "system",
    entity_id:   "ams-facerec",
    details:     { message: "DB integrity fixed.", script: "fix_missing_data.js" },
    ip_address:  "127.0.0.1",
  });

  if (error) log("err", `Insert failed: ${error.message}`);
  else       log("ok",  "Seeded system_ready log entry.");
}

// ══════════════════════════════════════════════════════════════════════════════
// Main
// ══════════════════════════════════════════════════════════════════════════════
async function main() {
  console.log("\n══════════════════════════════════════════════════════════════════");
  console.log("  AMS-FaceRec — Data Integrity Fixer");
  console.log(`  Target: ${process.env.SUPABASE_URL}`);
  console.log("══════════════════════════════════════════════════════════════════");

  await fixAdminDetails();
  await fixMissingStudentDetails();
  await fixEnrollments();
  await seedActivityLog();

  console.log("\n══════════════════════════════════════════════════════════════════");
  console.log("  ✅ Done! Run:  node scripts/audit_tables.js  to verify.");
  console.log("══════════════════════════════════════════════════════════════════\n");
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
