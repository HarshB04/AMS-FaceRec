import React from "react";
import { AlertCircle, CalendarDays, Loader2 } from "lucide-react";
import { type WeeklyAttendanceSummary } from "../../lib/api";
import { StatusBadge } from "./StatusBadge";

interface WeeklyAttendanceTableProps {
  title: string;
  description?: string;
  data: WeeklyAttendanceSummary[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
}

export function WeeklyAttendanceTable({
  title,
  description,
  data,
  loading = false,
  error = null,
  emptyMessage = "No attendance records found for the current month.",
}: WeeklyAttendanceTableProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b border-slate-100">
        <div>
          <h3 className="text-[0.9375rem] text-slate-900 font-semibold">{title}</h3>
          {description && <p className="text-[0.8125rem] text-slate-500 mt-1">{description}</p>}
        </div>
        <div className="flex items-center gap-1.5 text-[0.75rem] text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg">
          <CalendarDays className="w-3.5 h-3.5" />
          Current month
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-14 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-[0.8125rem]">Loading weekly analysis...</span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 m-5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[0.8125rem]">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      ) : data.length === 0 ? (
        <div className="px-5 py-12 text-center text-[0.8125rem] text-slate-400">{emptyMessage}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 text-[0.75rem] text-slate-500 font-medium">Week</th>
                <th className="text-left py-3 px-4 text-[0.75rem] text-slate-500 font-medium">Date Range</th>
                <th className="text-center py-3 px-4 text-[0.75rem] text-slate-500 font-medium">Present</th>
                <th className="text-center py-3 px-4 text-[0.75rem] text-slate-500 font-medium">Late</th>
                <th className="text-center py-3 px-4 text-[0.75rem] text-slate-500 font-medium">Absent</th>
                <th className="text-center py-3 px-4 text-[0.75rem] text-slate-500 font-medium">Total</th>
                <th className="text-center py-3 px-4 text-[0.75rem] text-slate-500 font-medium">Rate</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={`${row.startDate}-${row.endDate}`} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 text-[0.8125rem] text-slate-800 font-medium">{row.week}</td>
                  <td className="py-3 px-4 text-[0.8125rem] text-slate-500">{row.dateRange}</td>
                  <td className="py-3 px-4 text-center text-[0.8125rem] text-emerald-600 font-medium">{row.present}</td>
                  <td className="py-3 px-4 text-center text-[0.8125rem] text-amber-600">{row.late}</td>
                  <td className="py-3 px-4 text-center text-[0.8125rem] text-red-500">{row.absent}</td>
                  <td className="py-3 px-4 text-center text-[0.8125rem] text-slate-700">{row.total}</td>
                  <td className="py-3 px-4 text-center">
                    <StatusBadge variant={row.rate >= 90 ? "present" : row.rate >= 75 ? "warning" : "absent"}>
                      {row.total > 0 ? `${row.rate}%` : "0%"}
                    </StatusBadge>
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
