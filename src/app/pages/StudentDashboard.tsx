import React, { useEffect, useState } from "react";
import { CalendarCheck, BookOpen, Clock, TrendingUp, Award } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { StatCard } from "../components/shared/StatCard";
import { StatusBadge } from "../components/shared/StatusBadge";
import { WeeklyAttendanceTable } from "../components/shared/WeeklyAttendanceTable";
import {
  getStudentStats,
  getWeeklyAttendanceAnalysis,
  type StudentStats,
  type WeeklyAttendanceSummary,
} from "../lib/api";

const attendanceHistory = [
  { date: "Feb 24", course: "CS-301", time: "8:45 AM", status: "present" as const },
  { date: "Feb 24", course: "MATH-201", time: "10:58 AM", status: "present" as const },
  { date: "Feb 25", course: "ENG-101", time: "9:15 AM", status: "late" as const },
  { date: "Feb 25", course: "CS-301", time: "-", status: "absent" as const },
  { date: "Feb 26", course: "PHY-102", time: "2:00 PM", status: "present" as const },
  { date: "Feb 26", course: "CS-301", time: "8:50 AM", status: "present" as const },
  { date: "Feb 27", course: "MATH-201", time: "11:02 AM", status: "present" as const },
  { date: "Feb 27", course: "ENG-101", time: "9:00 AM", status: "present" as const },
  { date: "Feb 28", course: "CS-301", time: "8:47 AM", status: "present" as const },
  { date: "Feb 28", course: "PHY-102", time: "2:10 PM", status: "late" as const },
];

const weeklyTrend = [
  { week: "W1", rate: 88 }, { week: "W2", rate: 92 }, { week: "W3", rate: 85 },
  { week: "W4", rate: 95 }, { week: "W5", rate: 90 }, { week: "W6", rate: 93 },
  { week: "W7", rate: 96 }, { week: "W8", rate: 94 },
];

const courseProgress = [
  { name: "CS-301", attendance: 94, total: 24, attended: 22, color: "#4f46e5" },
  { name: "MATH-201", attendance: 88, total: 20, attended: 18, color: "#06b6d4" },
  { name: "ENG-101", attendance: 92, total: 18, attended: 17, color: "#10b981" },
  { name: "PHY-102", attendance: 85, total: 16, attended: 14, color: "#f59e0b" },
];

export function StudentDashboard() {
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [weeklyAnalysis, setWeeklyAnalysis] = useState<WeeklyAttendanceSummary[]>([]);
  const [weeklyLoading, setWeeklyLoading] = useState(true);
  const [weeklyError, setWeeklyError] = useState<string | null>(null);

  useEffect(() => {
    getStudentStats()
      .then(setStats)
      .catch((err) => console.error("Student stats error:", err));
    getWeeklyAttendanceAnalysis({ scope: "all" })
      .then(setWeeklyAnalysis)
      .catch((err) => {
        console.error("Weekly attendance error:", err);
        setWeeklyError("Could not load weekly attendance analysis.");
      })
      .finally(() => setWeeklyLoading(false));
  }, []);

  const overallRate = stats ? stats.attendanceRate : 91.5;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Attendance"
          value={stats ? `${stats.attendanceRate}%` : "…"}
          change="+2.3% this month"
          changeType="up"
          icon={<CalendarCheck className="w-5 h-5" />}
          iconBg="bg-emerald-100 text-emerald-600"
        />
        <StatCard title="Enrolled Courses" value="4" icon={<BookOpen className="w-5 h-5" />} />
        <StatCard
          title="Classes Attended"
          value={stats ? `${stats.attendedClasses}/${stats.totalClasses}` : "…"}
          icon={<Clock className="w-5 h-5" />}
          iconBg="bg-cyan-100 text-cyan-600"
        />
        <StatCard
          title="GPA"
          value={stats ? stats.gpa : "…"}
          icon={<Award className="w-5 h-5" />}
          iconBg="bg-amber-100 text-amber-600"
        />
      </div>

      <WeeklyAttendanceTable
        title="Weekly Attendance Analysis"
        description="Institution-wide attendance summary for the current month."
        data={weeklyAnalysis}
        loading={weeklyLoading}
        error={weeklyError}
      />

      {/* Progress + Trend */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Radial + Course Progress */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-[0.9375rem] text-slate-900 mb-4 font-semibold">My Progress</h3>
          <div className="flex justify-center mb-4">
            <div className="relative w-[160px] h-[160px]">
              <svg width="160" height="160" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="65" fill="none" stroke="#f1f5f9" strokeWidth="20" />
                <circle
                  cx="80" cy="80" r="65" fill="none"
                  stroke="#4f46e5" strokeWidth="20" strokeLinecap="round"
                  strokeDasharray={`${overallRate * 2 * Math.PI * 65 / 100} ${2 * Math.PI * 65}`}
                  transform="rotate(-90 80 80)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[1.5rem] text-slate-900" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}>{overallRate}%</span>
                <span className="text-[0.6875rem] text-slate-500">Overall</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {courseProgress.map((c) => (
              <div key={c.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[0.8125rem] text-slate-700 font-medium">{c.name}</span>
                  <span className="text-[0.75rem] text-slate-500">{c.attended}/{c.total} ({c.attendance}%)</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${c.attendance}%`, backgroundColor: c.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Attendance Trend */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[0.9375rem] text-slate-900 font-semibold">Attendance Trend</h3>
              <p className="text-[0.8125rem] text-slate-500">Weekly attendance rate over time</p>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 text-[0.8125rem]">
              <TrendingUp className="w-4 h-4" />
              <span className="font-medium">+6% improvement</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={weeklyTrend}>
              <defs>
                <linearGradient id="colorRateStudent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#4f46e5" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis domain={[80, 100]} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px" }} />
              <Area type="monotone" dataKey="rate" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRateStudent)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[0.9375rem] text-slate-900 font-semibold">Recent Attendance History</h3>
          <select className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[0.8125rem] text-slate-600 focus:outline-none">
            <option>All Courses</option>
            <option>CS-301</option>
            <option>MATH-201</option>
            <option>ENG-101</option>
            <option>PHY-102</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 px-4 text-[0.75rem] text-slate-500 font-medium">Date</th>
                <th className="text-left py-3 px-4 text-[0.75rem] text-slate-500 font-medium">Course</th>
                <th className="text-left py-3 px-4 text-[0.75rem] text-slate-500 font-medium">Check-in Time</th>
                <th className="text-left py-3 px-4 text-[0.75rem] text-slate-500 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {attendanceHistory.map((row) => (
                <tr key={`${row.date}-${row.course}`} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 text-[0.8125rem] text-slate-700">{row.date}</td>
                  <td className="py-3 px-4 text-[0.8125rem] text-slate-800 font-medium">{row.course}</td>
                  <td className="py-3 px-4 text-[0.8125rem] text-slate-600">{row.time}</td>
                  <td className="py-3 px-4"><StatusBadge variant={row.status}>{row.status}</StatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
