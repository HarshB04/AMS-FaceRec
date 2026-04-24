import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar, Filter, FileSpreadsheet, ChevronLeft, ChevronRight,
  Loader2, AlertCircle, RefreshCw, Edit3, CheckCircle2, X,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { getAttendance, type AttendanceRecord } from "../lib/api";
import { StatusBadge } from "../components/shared/StatusBadge";

const COURSES = ["All", "CS-301", "CS-405", "CS-201", "MATH-201", "ENG-101", "PHY-102"];

interface Override {
  id: string;
  newStatus: "present" | "late" | "absent";
  reason: string;
}

export function TeacherAttendanceSummary() {
  const [records, setRecords]     = useState<AttendanceRecord[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [filterCourse, setFilterCourse] = useState("All");
  const [dateFrom, setDateFrom]   = useState("2026-03-01");
  const [dateTo, setDateTo]       = useState("2026-03-31");
  const [currentPage, setCurrentPage] = useState(1);
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const [editId, setEditId]       = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<"present" | "late" | "absent">("present");
  const [editReason, setEditReason] = useState("");
  const perPage = 8;

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAttendance();
      setRecords(data.sort((a, b) => b.date.localeCompare(a.date)));
    } catch {
      setError("Could not load attendance records. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const filtered = useMemo(
    () =>
      records.filter((r) => {
        const matchCourse = filterCourse === "All" || r.course === filterCourse;
        const matchDate   = r.date >= dateFrom && r.date <= dateTo;
        return matchCourse && matchDate;
      }),
    [records, filterCourse, dateFrom, dateTo]
  );

  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paginated  = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  // Chart: per-course attendance rate from filtered records
  const chartData = useMemo(() => {
    const byCourse: Record<string, { present: number; total: number }> = {};
    filtered.forEach((r) => {
      if (!byCourse[r.course]) byCourse[r.course] = { present: 0, total: 0 };
      byCourse[r.course].present += r.present;
      byCourse[r.course].total   += r.total;
    });
    return Object.entries(byCourse).map(([course, d]) => ({
      course,
      rate: d.total > 0 ? parseFloat(((d.present / d.total) * 100).toFixed(1)) : 0,
    }));
  }, [filtered]);

  function exportCSV() {
    const header = "Date,Course,Teacher,Present,Late,Absent,Total,Rate\n";
    const rows = filtered
      .map((r) => `${r.date},${r.course},${r.teacher},${r.present},${r.late},${r.absent},${r.total},${r.rate}%`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `teacher-attendance-${dateFrom}-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function openEdit(row: AttendanceRecord) {
    setEditId(row.id);
    setEditStatus(row.present >= row.total * 0.9 ? "present" : "late");
    setEditReason("");
  }

  function commitEdit() {
    if (!editId) return;
    setOverrides((prev) => ({ ...prev, [editId]: { id: editId, newStatus: editStatus, reason: editReason } }));
    setEditId(null);
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
            Attendance Summary
          </h2>
          <p className="text-[0.8125rem] text-slate-500">
            {loading ? "Loading…" : `${records.length} records · ${filtered.length} matching filters`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchRecords}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-50 text-slate-600 rounded-lg text-[0.8125rem] hover:bg-slate-100 border border-slate-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={exportCSV}
            disabled={loading || filtered.length === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-lg text-[0.8125rem] hover:bg-emerald-100 border border-emerald-200 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[0.8125rem]">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          <button onClick={fetchRecords} className="ml-auto underline">Retry</button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterCourse}
            onChange={(e) => { setFilterCourse(e.target.value); setCurrentPage(1); }}
            className={selectCls}
          >
            {COURSES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }} className={selectCls} />
          <span className="text-slate-400 text-[0.8125rem]">to</span>
          <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }} className={selectCls} />
        </div>
      </div>

      {/* Trend chart */}
      {!loading && chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-[0.9375rem] text-slate-900 mb-4 font-semibold">Attendance Rate by Course</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <XAxis dataKey="course" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px" }} />
              <Bar dataKey="rate" fill="#4f46e5" radius={[6, 6, 0, 0]} name="Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-[0.8125rem]">Loading records…</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-[0.75rem] text-slate-500 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-[0.75rem] text-slate-500 font-medium">Course</th>
                  <th className="text-center py-3 px-4 text-[0.75rem] text-slate-500 font-medium">Present</th>
                  <th className="text-center py-3 px-4 text-[0.75rem] text-slate-500 font-medium hidden sm:table-cell">Late</th>
                  <th className="text-center py-3 px-4 text-[0.75rem] text-slate-500 font-medium hidden sm:table-cell">Absent</th>
                  <th className="text-center py-3 px-4 text-[0.75rem] text-slate-500 font-medium">Rate</th>
                  <th className="text-center py-3 px-4 text-[0.75rem] text-slate-500 font-medium">Override</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-[0.8125rem] text-slate-400">
                      No records match the selected filters.
                    </td>
                  </tr>
                ) : (
                  paginated.map((row) => {
                    const ov = overrides[row.id];
                    return (
                      <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="py-3 px-4 text-[0.8125rem] text-slate-600">{row.date}</td>
                        <td className="py-3 px-4 text-[0.8125rem] text-slate-800 font-medium">
                          {row.course}
                          {ov && (
                            <span className="ml-2 px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[0.6875rem] rounded font-medium">
                              Overridden
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center text-[0.8125rem] text-emerald-600 font-medium">{row.present}</td>
                        <td className="py-3 px-4 text-center text-[0.8125rem] text-amber-600 hidden sm:table-cell">{row.late}</td>
                        <td className="py-3 px-4 text-center text-[0.8125rem] text-red-500 hidden sm:table-cell">{row.absent}</td>
                        <td className="py-3 px-4 text-center">
                          <StatusBadge variant={row.rate >= 90 ? "present" : row.rate >= 75 ? "warning" : "absent"}>
                            {row.rate}%
                          </StatusBadge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => openEdit(row)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Override status"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-[0.8125rem] text-slate-500">
              {filtered.length === 0
                ? "No records"
                : `${(currentPage - 1) * perPage + 1}–${Math.min(currentPage * perPage, filtered.length)} of ${filtered.length}`}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-8 h-8 rounded-lg text-[0.8125rem] transition-colors ${
                    currentPage === p ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Override modal */}
      {editId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[1rem] font-semibold text-slate-900">Override Attendance</h3>
              <button onClick={() => setEditId(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <label className="text-[0.8125rem] font-medium text-slate-700">New Status</label>
              <div className="flex gap-2">
                {(["present", "late", "absent"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setEditStatus(s)}
                    className={`flex-1 py-2 rounded-lg text-[0.8125rem] font-medium border transition-colors capitalize ${
                      editStatus === s
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "border-slate-200 text-slate-600 hover:border-indigo-300"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <label className="text-[0.8125rem] font-medium text-slate-700 block mt-3">Reason</label>
              <textarea
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                rows={3}
                placeholder="Reason for override…"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[0.8125rem] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 resize-none"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditId(null)}
                className="px-4 py-2 text-[0.875rem] text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={commitEdit}
                disabled={!editReason.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-[0.875rem] hover:bg-indigo-700 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" /> Apply Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
