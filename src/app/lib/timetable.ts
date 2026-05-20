import rawTimetableCsv from "../data/masterTimetable.csv?raw";

export interface TimetableRow {
  id?: string;
  sourceKey?: string;
  entryId: string;
  department: string;
  semester: string;
  term: string;
  day: string;
  startTime: string;
  endTime: string;
  courseCode: string;
  courseTitle: string;
  facultyCode: string;
  facultyName: string;
  room: string;
  batch: string;
  classType: string;
  notes: string;
}

export interface TimetableSlot extends TimetableRow {
  id: string;
  dayIndex: number;
  startHour: number;
  startMin: number;
  endHour: number;
  endMin: number;
  durationMin: number;
  color: string;
}

export interface TimetableCourseOffering {
  id: string;
  sourceKey?: string;
  source?: "manual" | "timetable";
  department?: string;
  semester?: string;
  term?: string;
  code: string;
  name: string;
  teacher: string;
  schedule: string;
  room: string;
  students: number;
  status: "active" | "inactive";
}

const DAY_INDEX: Record<string, number> = {
  monday: 0,
  tuesday: 1,
  wednesday: 2,
  thursday: 3,
  friday: 4,
  saturday: 5,
};

const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const COLORS = [
  "#4f46e5",
  "#0891b2",
  "#059669",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#0f766e",
  "#be123c",
  "#2563eb",
  "#65a30d",
  "#9333ea",
  "#ea580c",
];

const SEMESTER_NUMERAL: Record<string, string> = {
  "1": "I",
  "2": "II",
  "3": "III",
  "4": "IV",
  "5": "V",
  "6": "VI",
  "7": "VII",
  "8": "VIII",
};

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
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

function parseCsv(csv: string) {
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    return headers.reduce<Record<string, string>>((row, header, index) => {
      row[header || `column_${index}`] = (cells[index] ?? "").trim();
      return row;
    }, {});
  });
}

function normalizeSemester(value: unknown) {
  const text = String(value ?? "").trim().toUpperCase();
  return SEMESTER_NUMERAL[text] ?? text;
}

function parseTime(value: string) {
  const [rawHour, rawMinute = "0"] = value.split(":");
  let hour = Number(rawHour);
  const minute = Number(rawMinute);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return { hour: 0, minute: 0 };
  }

  if (hour > 0 && hour < 8) hour += 12;

  return { hour, minute };
}

function minutesOf(hour: number, minute: number) {
  return hour * 60 + minute;
}

function courseColor(courseCode: string) {
  const total = (courseCode || "NA").split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return COLORS[total % COLORS.length];
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function formatDayTime(slot: TimetableSlot) {
  return `${DAY_SHORT[slot.dayIndex]} ${formatTime(slot.startHour, slot.startMin)}`;
}

function compactUnique(values: string[]) {
  const unique = Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
  if (unique.length === 0) return "";
  if (unique.length <= 2) return unique.join(", ");
  return `${unique.slice(0, 2).join(", ")} +${unique.length - 2}`;
}

export function toTimetableSemester(value: unknown) {
  return normalizeSemester(value);
}

export const TIMETABLE_ROWS: TimetableRow[] = parseCsv(rawTimetableCsv).map((row) => ({
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

export const TIMETABLE_DEPARTMENTS = Array.from(
  new Set(TIMETABLE_ROWS.map((row) => row.department).filter(Boolean))
);

export function getSemestersForDepartment(department: string) {
  return Array.from(
    new Set(
      TIMETABLE_ROWS
        .filter((row) => row.department === department)
        .map((row) => row.semester)
        .filter(Boolean)
    )
  );
}

export function getTimetableSlots(department: string, semester: string): TimetableSlot[] {
  return buildTimetableSlots(
    TIMETABLE_ROWS.filter((row) => row.department === department && row.semester === semester)
  );
}

export function buildTimetableSlots(rows: TimetableRow[]): TimetableSlot[] {
  return rows
    .map((row, index) => {
      const start = parseTime(row.startTime);
      const end = parseTime(row.endTime);
      let durationMin = minutesOf(end.hour, end.minute) - minutesOf(start.hour, start.minute);

      if (durationMin <= 0) durationMin += 12 * 60;

      return {
        ...row,
        id: `${row.entryId}-${index}`,
        dayIndex: DAY_INDEX[row.day.toLowerCase()] ?? -1,
        startHour: start.hour,
        startMin: start.minute,
        endHour: end.hour,
        endMin: end.minute,
        durationMin,
        color: courseColor(row.courseCode),
      };
    })
    .filter((slot) => slot.dayIndex >= 0 && slot.durationMin > 0)
    .sort((a, b) => {
      if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex;
      return minutesOf(a.startHour, a.startMin) - minutesOf(b.startHour, b.startMin);
    });
}

export function getUniqueCourses(slots: TimetableSlot[]) {
  return Array.from(
    new Map(slots.filter((slot) => slot.courseCode).map((slot) => [slot.courseCode, slot])).values()
  );
}

export function getTimetableCourseOfferings(rows = TIMETABLE_ROWS): TimetableCourseOffering[] {
  const slots = buildTimetableSlots(rows);

  const grouped = new Map<string, TimetableSlot[]>();
  for (const slot of slots) {
    const key = [slot.department, slot.semester, slot.courseCode, slot.courseTitle, slot.facultyName].join("|");
    grouped.set(key, [...(grouped.get(key) ?? []), slot]);
  }

  return Array.from(grouped.entries()).map(([groupKey, group]) => {
    const first = group[0];
    const schedule = compactUnique(group.map(formatDayTime));
    const room = compactUnique(group.map((slot) => slot.room));
    const label = `${first.courseTitle} (${first.department}, Sem ${first.semester})`;
    const groupSourceKey = `timetable:${slug(groupKey)}`;

    return {
      id: `timetable-${slug(first.department)}-${slug(first.semester)}-${slug(first.courseCode)}-${slug(first.courseTitle)}-${slug(first.facultyName || "faculty")}`,
      sourceKey: groupSourceKey,
      source: "timetable",
      department: first.department,
      semester: first.semester,
      term: first.term,
      code: first.courseCode,
      name: label,
      teacher: first.facultyName || "Faculty TBA",
      schedule,
      room: room || "TBA",
      students: 0,
      status: "active",
    };
  });
}

export function isTimetableCourseId(id: string) {
  return id.startsWith("timetable-");
}

export function formatSlotTime(slot: TimetableSlot) {
  return `${formatTime(slot.startHour, slot.startMin)} - ${formatTime(slot.endHour, slot.endMin)}`;
}

export function formatTime(hour: number, minute: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}
