/**
 * audit_tables.js — AMS-FaceRec Database Audit
 * Checks every table for row counts and data integrity issues.
 * Run from backend/: node scripts/audit_tables.js
 */
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function count(table, filter = null) {
  let q = supabase.from(table).select("*", { count: "exact", head: true });
  if (filter) q = q.eq(filter[0], filter[1]);
  const { count: n, error } = await q;
  if (error) return `ERROR: ${error.message}`;
  return n ?? 0;
}

async function sample(table, columns = "*", limit = 3) {
  const { data, error } = await supabase.from(table).select(columns).limit(limit);
  if (error) return `ERROR: ${error.message}`;
  return data;
}

async function main() {
  console.log("\n══════════════════════════════════════════════════════════════════");
  console.log("  AMS-FaceRec — Full Database Audit");
  console.log("══════════════════════════════════════════════════════════════════\n");

  // ── 1. users ────────────────────────────────────────────────────────────────
  const totalUsers   = await count("users");
  const adminCount   = await count("users", ["role", "admin"]);
  const teacherCount = await count("users", ["role", "teacher"]);
  const studentCount = await count("users", ["role", "student"]);
  const pendingCount = await count("users", ["approval_status", "pending"]);

  console.log("┌─ TABLE: users ───────────────────────────────────────────────────");
  console.log(`│  Total rows       : ${totalUsers}`);
  console.log(`│  Admins           : ${adminCount}`);
  console.log(`│  Teachers         : ${teacherCount}`);
  console.log(`│  Students         : ${studentCount}`);
  console.log(`│  Pending approval : ${pendingCount}`);
  console.log("└──────────────────────────────────────────────────────────────────\n");

  // ── 2. student_details ───────────────────────────────────────────────────────
  const sdCount = await count("student_details");
  const sdSample = await sample("student_details", "user_id, sbrn, semester, session, attendance_rate");
  console.log("┌─ TABLE: student_details ─────────────────────────────────────────");
  console.log(`│  Total rows : ${sdCount}`);
  if (sdCount < studentCount) {
    console.log(`│  ⚠ WARNING  : ${studentCount - sdCount} student(s) missing student_details row!`);
  } else {
    console.log(`│  ✓ All ${studentCount} students have student_details rows`);
  }
  console.log("│  Sample rows:");
  (sdSample || []).forEach(r =>
    console.log(`│    SBRN: ${r.sbrn?.padEnd(12)} | Sem: ${r.semester} | Session: ${r.session || "—"} | Rate: ${r.attendance_rate}%`)
  );
  console.log("└──────────────────────────────────────────────────────────────────\n");

  // ── 3. teacher_details ───────────────────────────────────────────────────────
  const tdCount = await count("teacher_details");
  const tdSample = await sample("teacher_details", "user_id, faculty_code, designation");
  console.log("┌─ TABLE: teacher_details ─────────────────────────────────────────");
  console.log(`│  Total rows : ${tdCount}`);
  if (tdCount < teacherCount) {
    console.log(`│  ⚠ WARNING  : ${teacherCount - tdCount} teacher(s) missing teacher_details row!`);
  } else {
    console.log(`│  ✓ All ${teacherCount} teachers have teacher_details rows`);
  }
  (tdSample || []).forEach(r =>
    console.log(`│    Code: ${r.faculty_code || "—"} | Designation: ${r.designation || "—"}`)
  );
  console.log("└──────────────────────────────────────────────────────────────────\n");

  // ── 4. admin_details ─────────────────────────────────────────────────────────
  const adCount = await count("admin_details");
  const adSample = await sample("admin_details", "user_id, permission_scope, managed_branches");
  console.log("┌─ TABLE: admin_details ───────────────────────────────────────────");
  console.log(`│  Total rows : ${adCount}`);
  if (adCount < adminCount) {
    console.log(`│  ⚠ WARNING  : ${adminCount - adCount} admin(s) missing admin_details row!`);
  } else {
    console.log(`│  ✓ All ${adminCount} admins have admin_details rows`);
  }
  (adSample || []).forEach(r =>
    console.log(`│    Scope: ${r.permission_scope} | Branches: ${r.managed_branches || "all"}`)
  );
  console.log("└──────────────────────────────────────────────────────────────────\n");

  // ── 5. face_embeddings ───────────────────────────────────────────────────────
  const feCount = await count("face_embeddings");
  const feActive = await count("face_embeddings", ["is_active", true]);
  const feSample = await sample("face_embeddings", "user_id, sample_count, model_version, enrolled_at, is_active");
  console.log("┌─ TABLE: face_embeddings ─────────────────────────────────────────");
  console.log(`│  Total rows  : ${feCount}`);
  console.log(`│  Active      : ${feActive}`);
  console.log(`│  Placeholder (empty embedding) vs real: checking...`);
  // Check for empty embeddings (placeholder from enrollComplete)
  const { data: empties } = await supabase.from("face_embeddings").select("user_id, embedding").limit(100);
  const emptyCount = (empties || []).filter(r => !r.embedding || r.embedding.length === 0).length;
  const realCount  = feCount - emptyCount;
  console.log(`│  Real vectors: ${realCount}  |  Placeholders (empty []): ${emptyCount}`);
  if (emptyCount > 0) {
    console.log(`│  ⚠ NOTE: ${emptyCount} student(s) enrolled via UI but face vector not yet synced from Python engine`);
  }
  (feSample || []).forEach(r =>
    console.log(`│    Model: ${r.model_version} | Samples: ${r.sample_count} | Active: ${r.is_active} | Enrolled: ${r.enrolled_at?.split("T")[0]}`)
  );
  console.log("└──────────────────────────────────────────────────────────────────\n");

  // ── 6. courses ───────────────────────────────────────────────────────────────
  const courseCount = await count("courses");
  const courseSample = await sample("courses", "id, course_code, course_name, branch, semester, status");
  console.log("┌─ TABLE: courses ─────────────────────────────────────────────────");
  console.log(`│  Total rows : ${courseCount}`);
  (courseSample || []).forEach(r =>
    console.log(`│    [${r.id}] ${r.course_code?.padEnd(10)} | ${r.course_name?.substring(0, 30).padEnd(30)} | Branch: ${r.branch} | Sem: ${r.semester}`)
  );
  console.log("└──────────────────────────────────────────────────────────────────\n");

  // ── 7. enrollments ───────────────────────────────────────────────────────────
  const enrollTotal = await count("enrollments");
  const enrollStudents = await count("enrollments", ["role_in_course", "student"]);
  const enrollTeachers = await count("enrollments", ["role_in_course", "instructor"]);
  console.log("┌─ TABLE: enrollments ─────────────────────────────────────────────");
  console.log(`│  Total rows       : ${enrollTotal}`);
  console.log(`│  Student links    : ${enrollStudents}`);
  console.log(`│  Instructor links : ${enrollTeachers}`);
  if (enrollTotal === 0 && courseCount > 0 && studentCount > 0) {
    console.log(`│  ⚠ WARNING: Courses and students exist but NO enrollments! Students won't see courses.`);
  }
  console.log("└──────────────────────────────────────────────────────────────────\n");

  // ── 8. attendance ────────────────────────────────────────────────────────────
  const attTotal = await count("attendance");
  const attPresent = await count("attendance", ["status", "present"]);
  const attSample = await sample("attendance", "id, user_id, course_id, date_attended, status, source", 5);
  console.log("┌─ TABLE: attendance ──────────────────────────────────────────────");
  console.log(`│  Total records : ${attTotal}`);
  console.log(`│  Present       : ${attPresent}`);
  (attSample || []).forEach(r =>
    console.log(`│    ${r.date_attended} | status: ${r.status} | source: ${r.source || "—"} | course: ${r.course_id || "none"}`)
  );
  console.log("└──────────────────────────────────────────────────────────────────\n");

  // ── 9. timetable_entries ─────────────────────────────────────────────────────
  const ttCount = await count("timetable_entries");
  const ttSample = await sample("timetable_entries", "id, branch, semester, day_of_week, start_time, end_time, room");
  console.log("┌─ TABLE: timetable_entries ───────────────────────────────────────");
  console.log(`│  Total rows : ${ttCount}`);
  if (ttCount === 0) {
    console.log(`│  ⚠ WARNING: No timetable entries. Run 'npm run db:import-timetable' to import.`);
  }
  if (Array.isArray(ttSample)) {
    ttSample.forEach(r =>
      console.log(`│    ${r.day_of_week?.padEnd(10)} | ${r.start_time}–${r.end_time} | ${r.branch} Sem${r.semester} | Room: ${r.room || "—"}`)
    );
  }
  console.log("└──────────────────────────────────────────────────────────────────\n");

  // ── 10. activity_logs ────────────────────────────────────────────────────────
  const logCount = await count("activity_logs");
  const logSample = await sample("activity_logs", "action, entity_type, entity_id, created_at");
  console.log("┌─ TABLE: activity_logs ───────────────────────────────────────────");
  console.log(`│  Total rows : ${logCount}`);
  if (logCount === 0) {
    console.log(`│  ℹ NOTE: No audit logs yet. Logs are created as actions occur.`);
  }
  (logSample || []).forEach(r =>
    console.log(`│    ${r.action?.padEnd(20)} | ${r.entity_type || "—"} | ${r.created_at?.split("T")[0]}`)
  );
  console.log("└──────────────────────────────────────────────────────────────────\n");

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log("══════════════════════════════════════════════════════════════════");
  console.log("  SUMMARY");
  console.log("══════════════════════════════════════════════════════════════════");

  const issues = [];
  if (sdCount < studentCount)  issues.push(`student_details missing ${studentCount - sdCount} rows`);
  if (tdCount < teacherCount)  issues.push(`teacher_details missing ${teacherCount - tdCount} rows`);
  if (adCount < adminCount)    issues.push(`admin_details missing ${adminCount - adCount} rows`);
  if (enrollTotal === 0 && courseCount > 0 && studentCount > 0) issues.push("enrollments is EMPTY — students can't see courses");
  if (ttCount === 0)           issues.push("timetable_entries is EMPTY — run import-timetable script");
  if (realCount === 0 && feCount > 0) issues.push("face_embeddings has only placeholder rows — Python engine needs to sync");

  if (issues.length === 0) {
    console.log("  ✅ All tables have data — system looks healthy!\n");
  } else {
    console.log("  ⚠ Issues found:");
    issues.forEach(i => console.log(`    • ${i}`));
    console.log();
  }
}

main().catch(err => {
  console.error("Audit failed:", err);
  process.exit(1);
});
