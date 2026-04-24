import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  BookOpen, Users, ChevronDown, ChevronUp, Camera,
  Calendar, MapPin, Loader2, AlertCircle,
} from "lucide-react";
import { getCourses, type Course } from "../lib/api";
import { StatusBadge } from "../components/shared/StatusBadge";

// Dummy student roster per course (in a real app fetched per course)
const ROSTER: Record<string, { id: string; name: string; attendance: number }[]> = {
  default: [
    { id: "STU-001", name: "Sarah Johnson",   attendance: 94 },
    { id: "STU-002", name: "Michael Chen",    attendance: 88 },
    { id: "STU-003", name: "Emily Davis",     attendance: 72 },
    { id: "STU-004", name: "James Wilson",    attendance: 96 },
    { id: "STU-005", name: "Sophia Martinez", attendance: 91 },
    { id: "STU-006", name: "Robert Brown",    attendance: 68 },
    { id: "STU-007", name: "Lisa Thompson",   attendance: 85 },
  ],
};

function rosterFor(code: string) {
  return ROSTER[code] || ROSTER.default;
}

function AttendancePill({ pct }: { pct: number }) {
  const color =
    pct >= 90 ? "text-emerald-700 bg-emerald-50" :
    pct >= 75 ? "text-amber-700 bg-amber-50" :
    "text-red-700 bg-red-50";
  return (
    <span className={`px-2 py-0.5 rounded-full text-[0.6875rem] font-semibold ${color}`}>
      {pct}%
    </span>
  );
}

interface ClassCardProps {
  course: Course;
  minAttendance: number;
}

function ClassCard({ course, minAttendance }: ClassCardProps) {
  const [open, setOpen] = useState(false);
  const roster = rosterFor(course.code);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[0.875rem] font-semibold text-indigo-600">{course.code}</span>
              <StatusBadge variant={course.status === "active" ? "active" : "inactive"} dot>
                {course.status}
              </StatusBadge>
            </div>
            <p className="text-[0.9375rem] text-slate-800 font-semibold">{course.name}</p>
          </div>
          <Link
            to={`/teacher/camera?course=${encodeURIComponent(course.code)}`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-[0.75rem] rounded-lg hover:bg-indigo-700 transition-colors flex-shrink-0"
          >
            <Camera className="w-3.5 h-3.5" /> Start Scan
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[0.8125rem] text-slate-500">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" /> {course.schedule}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" /> {course.room}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" /> {course.students} enrolled
          </span>
        </div>
      </div>

      {/* Roster toggle */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-2.5 bg-slate-50 border-t border-slate-100 text-[0.8125rem] text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <span>View student roster ({roster.length})</span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="border-t border-slate-100">
          <table className="w-full text-[0.8125rem]">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left py-2 px-5 text-slate-500 font-medium">Student ID</th>
                <th className="text-left py-2 px-5 text-slate-500 font-medium">Name</th>
                <th className="text-center py-2 px-5 text-slate-500 font-medium">Attendance</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((s) => (
                <tr key={s.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                  <td className="py-2.5 px-5 text-slate-400 font-mono text-[0.75rem]">{s.id}</td>
                  <td className="py-2.5 px-5 text-slate-800 font-medium">{s.name}</td>
                  <td className="py-2.5 px-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <AttendancePill pct={s.attendance} />
                      {s.attendance < minAttendance && (
                        <span className="text-[0.6875rem] text-red-500">⚠ Low</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function TeacherClasses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // Read min attendance from admin settings
  const settings = (() => {
    try { return JSON.parse(localStorage.getItem("ams_settings") || "{}"); } catch { return {}; }
  })();
  const minAttendance: number = settings.minAttendance ?? 75;

  useEffect(() => {
    getCourses()
      .then((data) => setCourses(data.filter((c) => c.status === "active")))
      .catch(() => setError("Could not load courses. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2
            className="text-[1.25rem] text-slate-900"
            style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
          >
            My Classes
          </h2>
          <p className="text-[0.8125rem] text-slate-500">
            {loading ? "Loading…" : `${courses.length} active course${courses.length !== 1 ? "s" : ""} assigned to you.`}
          </p>
        </div>
        <Link
          to="/teacher/camera"
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-[0.875rem] font-medium hover:bg-indigo-700 transition-colors"
        >
          <Camera className="w-4 h-4" /> Open Camera
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[0.8125rem]">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-[0.8125rem]">Loading classes…</span>
        </div>
      ) : courses.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <BookOpen className="w-10 h-10 text-slate-200" />
          <p className="text-[0.875rem]">No active classes found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <ClassCard key={course.id} course={course} minAttendance={minAttendance} />
          ))}
        </div>
      )}
    </div>
  );
}
