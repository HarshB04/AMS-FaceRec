import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const csvPath = path.resolve(__dirname, "../src/app/data/masterTimetable.csv");

const SEMESTER_NUMERAL = {
  "1": "I",
  "2": "II",
  "3": "III",
  "4": "IV",
  "5": "V",
  "6": "VI",
  "7": "VII",
  "8": "VIII",
};

function parseCsvLine(line) {
  const cells = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      cells.push(cell);
      cell = "";
      continue;
    }

    cell += char;
  }

  cells.push(cell);
  return cells;
}

function parseCsv(csv) {
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    return headers.reduce((row, header, index) => {
      row[header || `column_${index}`] = (cells[index] ?? "").trim();
      return row;
    }, {});
  });
}

function normalizeSemester(value) {
  const text = String(value ?? "").trim().toUpperCase();
  return SEMESTER_NUMERAL[text] ?? text;
}

function parseTime(value) {
  const [rawHour, rawMinute = "0"] = value.split(":");
  let hour = Number(rawHour);
  const minute = Number(rawMinute);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    throw new Error(`Invalid time value: ${value}`);
  }

  if (hour > 0 && hour < 8) hour += 12;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
}

function slug(value) {
  return String(value || "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set before importing.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const rawCsv = await readFile(csvPath, "utf8");
const rows = parseCsv(rawCsv).map((row, index) => ({
  sourceKey: `timetable-row:${index + 1}:${slug(row.EntryID)}`,
  entryId: row.EntryID,
  department: row.Department,
  semester: normalizeSemester(row.Semester),
  term: row["Feb - June 2026"],
  day: row.Day,
  startTime: row.StartTime,
  endTime: row.EndTime,
  courseCode: row.CourseCode,
  courseTitle: row.CourseTitle,
  facultyCode: row.FacultyCode,
  facultyName: row.FacultyName,
  room: row["Room/Lab"],
  batch: row["Batch/Group"],
  classType: row.ClassType,
  notes: row.Notes,
}));

const timetablePayloads = rows.map((row) => ({
  source_key: row.sourceKey,
  entry_id: row.entryId,
  course_id: null,
  department: row.department,
  semester: row.semester,
  term: row.term,
  day_of_week: row.day,
  start_time: parseTime(row.startTime),
  end_time: parseTime(row.endTime),
  course_code: row.courseCode,
  course_title: row.courseTitle || row.courseCode,
  faculty_code: row.facultyCode || null,
  faculty_name: row.facultyName || null,
  room_lab: row.room || null,
  batch_group: row.batch || null,
  class_type: row.classType || null,
  notes: row.notes || null,
}));

const { error: timetableError } = await supabase
  .from("timetable_entries")
  .upsert(timetablePayloads, { onConflict: "source_key" });

if (timetableError) {
  console.error("Failed to upsert timetable entries:", timetableError);
  process.exit(1);
}

console.log(`Imported ${timetablePayloads.length} timetable rows.`);
