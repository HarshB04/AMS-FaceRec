import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Download, Filter, Search, Calendar,
  ChevronLeft, ChevronRight, FileText, FileSpreadsheet,
  Loader2, AlertCircle, RefreshCw,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from "recharts";
import { StatusBadge } from "../components/shared/StatusBadge";
import { getAttendance, logAttendance, type AttendanceRecord } from "../lib/api";

const COURSE_OPTIONS = ["CS-301", "MATH-201", "ENG-101", "PHY-102", "CS-405"];

export function AttendanceReports() {
  const [records, setRecords]   = useState<AttendanceRecord[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const [search, setSearch]             = useState("");
  const [filterCourse, setFilterCourse] = useState("all");
  const [dateFrom, setDateFrom]         = useState("2026-03-01");
  const [dateTo, setDateTo]             = useState("2026-03-07");
  const [currentPage, setCurrentPage]   = useState(1);
  const perPage = 8;

  // ── fetch ────────────────────────────────────────────
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAttendance();
      setRecords(data.sort((a, b) => b.date.localeCompare(a.date)));
    } catch (err) {
      console.error("Failed to fetch attendance:", err);
      setError("Could not load attendance records. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  // ── filter / paginate ────────────────────────────────
  const filtered = useMemo(() => records.filter((r) => {
    const matchSearch =
      r.course.toLowerCase().includes(search.toLowerCase()) ||
      r.teacher.toLowerCase().includes(search.toLowerCase());
    const matchCourse  = filterCourse === "all" || r.course === filterCourse;
    const matchDate    = r.date >= dateFrom && r.date <= dateTo;
    return matchSearch && matchCourse && matchDate;
  }), [records, search, filterCourse, dateFrom, dateTo]);

  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paginated  = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  // ── chart data (derived from live records) ──────────
  const dailyTrend = useMemo(() => {
    const byDate: Record<string, { totalPresent: number; totalAll: number }> = {};
    records.forEach((r) => {
      if (!byDate[r.date]) byDate[r.date] = { totalPresent: 0, totalAll: 0 };
      byDate[r.date].totalPresent += r.present;
      byDate[r.date].totalAll += r.total;
    });
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({
        date: date.replace("2026-", "").replace("-", "/"),
        rate: d.totalAll > 0 ? parseFloat(((d.totalPresent / d.totalAll) * 100).toFixed(1)) : 0,
      }));
  }, [records]);

  const courseChart = useMemo(() => {
    const byCourse: Record<string, { totalPresent: number; totalAll: number }> = {};
    records.forEach((r) => {
      if (!byCourse[r.course]) byCourse[r.course] = { totalPresent: 0, totalAll: 0 };
      byCourse[r.course].totalPresent += r.present;
      byCourse[r.course].totalAll += r.total;
    });
    return Object.entries(byCourse).map(([course, d]) => ({
      course,
      rate: d.totalAll > 0 ? parseFloat(((d.totalPresent / d.totalAll) * 100).toFixed(1)) : 0,
    }));
  }, [records]);

  // ── CSV export ───────────────────────────────────────
  const exportCSV = () => {
    const header = "Date,Course,Teacher,Total,Present,Late,Absent,Rate\n";
    const rows = filtered.map((r) =>
      `${r.date},${r.course},${r.teacher},${r.total},${r.present},${r.late},${r.absent},${r.rate}%`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `attendance-${dateFrom}-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[1.25rem] text-slate-900" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}>
            Attendance Reports
          </h2>
          <p className="text-[0.8125rem] text-slate-500">
            {loading ? "Loading…" : `${records.length} records total · ${filtered.length} matching filters`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchRecords}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-50 text-slate-600 rounded-lg text-[0.8125rem] hover:bg-slate-100 transition-colors border border-slate-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={exportCSV}
            disabled={loading || filtered.length === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-lg text-[0.8125rem] hover:bg-emerald-100 transition-colors border border-emerald-200 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export CSV
          </button>
          <button
            disabled
            className="flex items-center gap-1.5 px-4 py-2.5 bg-red-50 text-red-700 rounded-lg text-[0.8125rem] border border-red-200 opacity-50 cursor-not-allowed"
          >
            <FileText className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[0.8125rem]">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={fetchRecords} className="ml-auto underline hover:no-underline">Retry</button>
        </div>
      )}

      {/* Charts */}
      {!loading && records.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-[0.9375rem] text-slate-900 mb-4 font-semibold">Daily Attendance Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dailyTrend}>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis domain={[80, 100]} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px" }} />
                <Line type="monotone" dataKey="rate" stroke="#4f46e5" strokeWidth={2.5} dot={{ fill: "#4f46e5", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-[0.9375rem] text-slate-900 mb-4 font-semibold">Attendance by Course</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={courseChart}>
                <XAxis dataKey="course" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis domain={[80, 100]} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px" }} />
                <Bar dataKey="rate" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search course or teacher…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[0.8125rem] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterCourse}
            onChange={(e) => { setFilterCourse(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[0.8125rem] text-slate-600 focus:outline-none"
          >
            <option value="all">All Courses</option>
            {COURSE_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[0.8125rem] text-slate-600 focus:outline-none"
          />
          <span className="text-slate-400 text-[0.8125rem]">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[0.8125rem] text-slate-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-[0.8125rem]">Loading attendance records…</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-[0.75rem] text-slate-500 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-[0.75rem] text-slate-500 font-medium">Course</th>
                  <th className="text-left py-3 px-4 text-[0.75rem] text-slate-500 font-medium hidden md:table-cell">Teacher</th>
                  <th className="text-center py-3 px-4 text-[0.75rem] text-slate-500 font-medium">Total</th>
                  <th className="text-center py-3 px-4 text-[0.75rem] text-slate-500 font-medium">Present</th>
                  <th className="text-center py-3 px-4 text-[0.75rem] text-slate-500 font-medium hidden sm:table-cell">Late</th>
                  <th className="text-center py-3 px-4 text-[0.75rem] text-slate-500 font-medium hidden sm:table-cell">Absent</th>
                  <th className="text-center py-3 px-4 text-[0.75rem] text-slate-500 font-medium">Rate</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-[0.8125rem] text-slate-400">
                      No records match the selected filters
                    </td>
                  </tr>
                ) : paginated.map((row) => (
                  <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 text-[0.8125rem] text-slate-600">{row.date}</td>
                    <td className="py-3 px-4 text-[0.8125rem] text-slate-800 font-medium">{row.course}</td>
                    <td className="py-3 px-4 text-[0.8125rem] text-slate-600 hidden md:table-cell">{row.teacher}</td>
                    <td className="py-3 px-4 text-[0.8125rem] text-slate-700 text-center">{row.total}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[0.8125rem] text-emerald-600 font-medium">{row.present}</span>
                    </td>
                    <td className="py-3 px-4 text-center hidden sm:table-cell">
                      <span className="text-[0.8125rem] text-amber-600">{row.late}</span>
                    </td>
                    <td className="py-3 px-4 text-center hidden sm:table-cell">
                      <span className="text-[0.8125rem] text-red-500">{row.absent}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge variant={row.rate >= 95 ? "present" : row.rate >= 90 ? "info" : "warning"}>
                        {row.rate}%
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-[0.8125rem] text-slate-500">
              Showing {filtered.length === 0 ? 0 : (currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-30"
                aria-label="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-[0.8125rem] transition-colors ${
                    currentPage === i + 1 ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-30"
                aria-label="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
