import React, { useState, useMemo } from "react";
import { Filter, Calendar, FileSpreadsheet, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { StatusBadge } from "../components/shared/StatusBadge";

interface AttRecord {
  date: string;
  course: string;
  time: string;
  status: "present" | "late" | "absent";
}

// Static records — in a full app, fetched from /attendance?student_id=...
const ALL_RECORDS: AttRecord[] = [
  { date: "2026-03-01", course: "CS-301",   time: "8:45 AM",  status: "present" },
  { date: "2026-03-01", course: "MATH-201", time: "10:58 AM", status: "present" },
  { date: "2026-03-03", course: "ENG-101",  time: "9:17 AM",  status: "late"    },
  { date: "2026-03-03", course: "CS-301",   time: "-",         status: "absent"  },
  { date: "2026-03-05", course: "PHY-102",  time: "2:02 PM",  status: "present" },
  { date: "2026-03-05", course: "CS-301",   time: "8:50 AM",  status: "present" },
  { date: "2026-03-07", course: "MATH-201", time: "11:03 AM", status: "present" },
  { date: "2026-03-07", course: "ENG-101",  time: "9:00 AM",  status: "present" },
  { date: "2026-03-10", course: "CS-301",   time: "8:47 AM",  status: "present" },
  { date: "2026-03-10", course: "PHY-102",  time: "2:12 PM",  status: "late"    },
  { date: "2026-03-12", course: "MATH-201", time: "-",         status: "absent"  },
  { date: "2026-03-12", course: "ENG-101",  time: "9:05 AM",  status: "present" },
  { date: "2026-03-14", course: "CS-301",   time: "8:48 AM",  status: "present" },
  { date: "2026-03-14", course: "PHY-102",  time: "2:00 PM",  status: "present" },
  { date: "2026-03-17", course: "CS-301",   time: "-",         status: "absent"  },
  { date: "2026-03-17", course: "MATH-201", time: "10:59 AM", status: "present" },
  { date: "2026-03-19", course: "ENG-101",  time: "9:22 AM",  status: "late"    },
  { date: "2026-03-19", course: "CS-301",   time: "8:52 AM",  status: "present" },
  { date: "2026-03-21", course: "PHY-102",  time: "-",         status: "absent"  },
  { date: "2026-03-21", course: "CS-301",   time: "8:46 AM",  status: "present" },
];

const COURSES_ALL = ["All Courses", "CS-301", "MATH-201", "ENG-101", "PHY-102"];
const STATUSES_ALL = ["All Statuses", "present", "late", "absent"];
const COLORS: Record<string, string> = {
  "CS-301": "#4f46e5",
  "MATH-201": "#06b6d4",
  "ENG-101": "#10b981",
  "PHY-102": "#f59e0b",
};

const PER_PAGE = 8;

export function StudentAttendanceHistory() {
  const [course, setCourse]   = useState("All Courses");
  const [status, setStatus]   = useState("All Statuses");
  const [dateFrom, setDateFrom] = useState("2026-03-01");
  const [dateTo, setDateTo]   = useState("2026-03-31");
  const [page, setPage]       = useState(1);

  // Read min attendance from admin settings
  const settings = (() => { try { return JSON.parse(localStorage.getItem("ams_settings") || "{}"); } catch { return {}; } })();
  const minPct: number = settings.minAttendance ?? 75;

  const filtered = useMemo(() =>
    ALL_RECORDS.filter((r) => {
      const mc = course === "All Courses" || r.course === course;
      const ms = status === "All Statuses" || r.status === status;
      const md = r.date >= dateFrom && r.date <= dateTo;
      return mc && ms && md;
    }).sort((a, b) => b.date.localeCompare(a.date)),
    [course, status, dateFrom, dateTo]
  );

  const totalPages = Math.ceil(filtered.length / PER_PAGE) || 1;
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Per-course stats
  const courseStats = useMemo(() => {
    const map: Record<string, { present: number; total: number }> = {};
    ALL_RECORDS.forEach((r) => {
      if (!map[r.course]) map[r.course] = { present: 0, total: 0 };
      map[r.course].total++;
      if (r.status === "present") map[r.course].present++;
    });
    return Object.entries(map).map(([name, d]) => ({
      name,
      pct: Math.round((d.present / d.total) * 100),
      present: d.present,
      total: d.total,
      color: COLORS[name] || "#94a3b8",
    }));
  }, []);

  const lowCourses = courseStats.filter((c) => c.pct < minPct);

  function exportCSV() {
    const header = "Date,Course,Time,Status\n";
    const rows = filtered.map((r) => `${r.date},${r.course},${r.time},${r.status}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `my-attendance-${dateFrom}-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const selectCls = "px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[0.8125rem] text-slate-600 focus:outline-none";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2
            className="text-[1.25rem] text-slate-900"
            style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
          >
            My Attendance History
          </h2>
          <p className="text-[0.8125rem] text-slate-500">
            {filtered.length} records matching filters.
          </p>
        </div>
        <button
          onClick={exportCSV}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-lg text-[0.875rem] hover:bg-emerald-100 border border-emerald-200 disabled:opacity-50"
        >
          <FileSpreadsheet className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Low-attendance warning */}
      {lowCourses.length > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[0.8125rem]">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Low attendance warning:</strong>{" "}
            {lowCourses.map((c) => `${c.name} (${c.pct}%)`).join(", ")} — below the {minPct}% minimum.
          </span>
        </div>
      )}

      {/* Per-course progress bars */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-[0.9375rem] text-slate-900 font-semibold mb-4">Course Attendance Summary</h3>
        <div className="space-y-4">
          {courseStats.map((c) => (
            <div key={c.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[0.8125rem] font-medium text-slate-700">{c.name}</span>
                <span className="text-[0.75rem] text-slate-500">
                  {c.present}/{c.total} classes ({c.pct}%)
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${c.pct}%`,
                    backgroundColor: c.pct < minPct ? "#f59e0b" : c.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select value={course} onChange={(e) => { setCourse(e.target.value); setPage(1); }} className={selectCls}>
            {COURSES_ALL.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={selectCls}>
            {STATUSES_ALL.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className={selectCls} />
          <span className="text-slate-400 text-[0.8125rem]">to</span>
          <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className={selectCls} />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 text-[0.75rem] text-slate-500 font-medium">Date</th>
                <th className="text-left py-3 px-4 text-[0.75rem] text-slate-500 font-medium">Course</th>
                <th className="text-left py-3 px-4 text-[0.75rem] text-slate-500 font-medium">Check-in Time</th>
                <th className="text-center py-3 px-4 text-[0.75rem] text-slate-500 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-[0.8125rem] text-slate-400">
                    No records match the selected filters.
                  </td>
                </tr>
              ) : (
                paginated.map((row, i) => (
                  <tr key={`${row.date}-${row.course}-${i}`} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 text-[0.8125rem] text-slate-600">{row.date}</td>
                    <td className="py-3 px-4">
                      <span
                        className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-slate-800"
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: COLORS[row.course] || "#94a3b8" }}
                        />
                        {row.course}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[0.8125rem] text-slate-500">{row.time}</td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge variant={row.status} dot>{row.status}</StatusBadge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
          <p className="text-[0.8125rem] text-slate-500">
            {filtered.length === 0
              ? "No records"
              : `${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, filtered.length)} of ${filtered.length}`}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-[0.8125rem] transition-colors ${
                  page === p ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
