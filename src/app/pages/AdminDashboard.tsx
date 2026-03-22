import React, { useEffect, useState } from "react";
import { Users, GraduationCap, BookOpen, CalendarCheck, Camera, ArrowUpRight, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { StatCard } from "../components/shared/StatCard";
import { StatusBadge } from "../components/shared/StatusBadge";
import { Link } from "react-router";
import { getAdminStats, type AdminStats } from "../lib/api";

// Static display data (charts use fixed week/month data for visual context)
const weeklyData = [
  { day: "Mon", present: 245, absent: 18 },
  { day: "Tue", present: 252, absent: 11 },
  { day: "Wed", present: 238, absent: 25 },
  { day: "Thu", present: 248, absent: 15 },
  { day: "Fri", present: 220, absent: 43 },
];

const monthlyTrend = [
  { month: "Jan", rate: 91 }, { month: "Feb", rate: 93 }, { month: "Mar", rate: 89 },
  { month: "Apr", rate: 94 }, { month: "May", rate: 96 }, { month: "Jun", rate: 92 },
];

const pieData = [
  { name: "Present", value: 82, color: "#10b981" },
  { name: "Late",    value: 11, color: "#f59e0b" },
  { name: "Absent",  value: 7,  color: "#ef4444" },
];

const recentActivity = [
  { name: "Sarah Johnson",   action: "Checked in",      course: "CS-301",   time: "8:45 AM",  status: "present" as const },
  { name: "Michael Chen",    action: "Checked in late",  course: "CS-301",   time: "9:12 AM",  status: "late"    as const },
  { name: "Emily Davis",     action: "Absent",           course: "MATH-201", time: "-",         status: "absent"  as const },
  { name: "James Wilson",    action: "Checked in",       course: "ENG-101",  time: "10:00 AM", status: "present" as const },
  { name: "Sophia Martinez", action: "Checked in",       course: "PHY-102",  time: "10:02 AM", status: "present" as const },
];

const activeSessions = [
  { course: "CS-301",   teacher: "Dr. Smith",  room: "Room 204", students: "28/32" },
  { course: "MATH-201", teacher: "Prof. Lee",  room: "Room 108", students: "22/25" },
  { course: "ENG-101",  teacher: "Ms. Carter", room: "Room 310", students: "30/35" },
];

// Custom SVG donut chart (no duplicate-key warning)
function DonutChart() {
  const total = pieData.reduce((s, d) => s + d.value, 0);
  let cumulative = 0;
  const r = 70, cx = 100, cy = 100, strokeW = 28;
  const segments = pieData.map((d) => {
    const pct = d.value / total;
    const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    cumulative += pct;
    const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    const large = pct > 0.5 ? 1 : 0;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    return { ...d, d: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}` };
  });

  return (
    <svg viewBox="0 0 200 200" className="w-40 h-40 mx-auto">
      {segments.map((seg) => (
        <path
          key={seg.name}
          d={seg.d}
          stroke={seg.color}
          strokeWidth={strokeW}
          fill="none"
          strokeLinecap="butt"
        />
      ))}
      <text x={cx} y={cy - 6} textAnchor="middle" className="text-2xl font-bold" fill="#1e293b" fontSize={22} fontWeight={700}>
        {pieData[0].value}%
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#94a3b8" fontSize={11}>
        Present
      </text>
    </svg>
  );
}

export function AdminDashboard() {
  const [stats, setStats]     = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch((err) => console.error("Admin stats error:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={loading ? "…" : stats ? stats.totalStudents.toLocaleString() : "—"}
          change="+12% from last month"
          changeType="up"
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          title="Total Teachers"
          value={loading ? "…" : stats ? String(stats.totalTeachers) : "—"}
          change="+3 new this semester"
          changeType="up"
          icon={<GraduationCap className="w-5 h-5" />}
          iconBg="bg-cyan-100 text-cyan-600"
        />
        <StatCard
          title="Active Courses"
          value={loading ? "…" : stats ? String(stats.totalCourses) : "—"}
          change={loading ? "" : stats ? `${stats.activeSessions} sessions today` : ""}
          changeType="up"
          icon={<BookOpen className="w-5 h-5" />}
          iconBg="bg-amber-100 text-amber-600"
        />
        <StatCard
          title="Attendance Rate"
          value={loading ? "…" : stats ? `${stats.attendanceRate}%` : "—"}
          change="+2.1% vs yesterday"
          changeType="up"
          icon={<CalendarCheck className="w-5 h-5" />}
          iconBg="bg-emerald-100 text-emerald-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Weekly Bar */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-[0.9375rem] text-slate-900 font-semibold">Weekly Attendance</h3>
              <p className="text-[0.8125rem] text-slate-500">This week's attendance overview</p>
            </div>
            <select className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[0.8125rem] text-slate-600 focus:outline-none">
              <option>This Week</option>
              <option>Last Week</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={weeklyData} barGap={4}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px" }} />
              <Bar dataKey="present" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="absent"  fill="#e2e8f0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-[0.9375rem] text-slate-900 mb-4 font-semibold">Today's Status</h3>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            </div>
          ) : (
            <>
              <DonutChart />
              <div className="space-y-3 mt-4">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[0.8125rem] text-slate-600">{item.name}</span>
                    </div>
                    <span className="text-[0.8125rem] text-slate-900 font-semibold">{item.value}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[0.9375rem] text-slate-900 font-semibold">Recent Activity</h3>
            <Link to="/admin/reports" className="text-[0.8125rem] text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentActivity.map((a) => (
              <div key={`${a.name}-${a.course}`} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-cyan-100 rounded-full flex items-center justify-center text-[0.6875rem] text-indigo-700 font-semibold">
                    {a.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-[0.8125rem] text-slate-800 font-medium">{a.name}</p>
                    <p className="text-[0.6875rem] text-slate-400">{a.course} &middot; {a.time}</p>
                  </div>
                </div>
                <StatusBadge variant={a.status} dot>{a.action}</StatusBadge>
              </div>
            ))}
          </div>
        </div>

        {/* Active Sessions */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[0.9375rem] text-slate-900 font-semibold">Active Sessions</h3>
            <Link to="/admin/camera" className="flex items-center gap-1.5 text-[0.8125rem] text-indigo-600 hover:text-indigo-700">
              <Camera className="w-3.5 h-3.5" /> Open Camera
            </Link>
          </div>
          <div className="space-y-3">
            {activeSessions.map((s) => (
              <div key={s.course} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[0.875rem] text-slate-800 font-semibold">{s.course}</span>
                  <StatusBadge variant="active" dot>Live</StatusBadge>
                </div>
                <div className="flex items-center gap-4 text-[0.8125rem] text-slate-500">
                  <span>{s.teacher}</span>
                  <span>&middot;</span>
                  <span>{s.room}</span>
                  <span>&middot;</span>
                  <span className="text-indigo-600 font-medium">{s.students}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Face Enrollment KPI */}
      {!loading && stats && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[0.9375rem] text-slate-900 font-semibold">Face Enrollment Status</h3>
            <Link to="/admin/students" className="text-[0.8125rem] text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              Manage <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-indigo-50 rounded-xl">
              <p className="text-2xl text-indigo-700 font-bold">{stats.totalStudents}</p>
              <p className="text-[0.75rem] text-indigo-500 mt-1">Total Students</p>
            </div>
            <div className="text-center p-4 bg-emerald-50 rounded-xl">
              <p className="text-2xl text-emerald-700 font-bold">{stats.faceEnrolled}</p>
              <p className="text-[0.75rem] text-emerald-500 mt-1">Face Enrolled</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-xl">
              <p className="text-2xl text-amber-700 font-bold">{stats.totalStudents - stats.faceEnrolled}</p>
              <p className="text-[0.75rem] text-amber-500 mt-1">Pending Enrollment</p>
            </div>
            <div className="text-center p-4 bg-cyan-50 rounded-xl">
              <p className="text-2xl text-cyan-700 font-bold">
                {stats.totalStudents > 0 ? Math.round((stats.faceEnrolled / stats.totalStudents) * 100) : 0}%
              </p>
              <p className="text-[0.75rem] text-cyan-500 mt-1">Enrollment Rate</p>
            </div>
          </div>
          <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full transition-all duration-700"
              style={{ width: `${stats.totalStudents > 0 ? (stats.faceEnrolled / stats.totalStudents) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Monthly Trend */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-[0.9375rem] text-slate-900 mb-4 font-semibold">Attendance Rate Trend</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={monthlyTrend}>
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
            <YAxis domain={[85, 100]} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
            <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px" }} />
            <Line type="monotone" dataKey="rate" stroke="#4f46e5" strokeWidth={2.5} dot={{ fill: "#4f46e5", r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
