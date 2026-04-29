import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import { BookOpen, Users, CalendarCheck, Clock, Camera, ArrowUpRight, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { StatCard } from "../components/shared/StatCard";
import { StatusBadge } from "../components/shared/StatusBadge";
import { WeeklyAttendanceTable } from "../components/shared/WeeklyAttendanceTable";
import {
  getTeacherStats,
  getCourses,
  getWeeklyAttendanceAnalysis,
  type TeacherStats,
  type Course,
  type WeeklyAttendanceSummary,
} from "../lib/api";

const todayStudents = [
  { name: "Sarah Johnson", id: "STU-001", time: "8:45 AM", status: "present" as const },
  { name: "Michael Chen", id: "STU-002", time: "9:12 AM", status: "late" as const },
  { name: "Emily Davis", id: "STU-003", time: "-", status: "absent" as const },
  { name: "James Wilson", id: "STU-004", time: "8:58 AM", status: "present" as const },
  { name: "Sophia Martinez", id: "STU-005", time: "8:50 AM", status: "present" as const },
  { name: "Robert Brown", id: "STU-006", time: "-", status: "absent" as const },
  { name: "Lisa Thompson", id: "STU-007", time: "9:01 AM", status: "present" as const },
];

const classAttendance = [
  { date: "Mar 1", present: 29, absent: 3 },
  { date: "Mar 3", present: 31, absent: 1 },
  { date: "Mar 5", present: 27, absent: 5 },
  { date: "Mar 7", present: 30, absent: 2 },
  { date: "Mar 9", present: 28, absent: 4 },
];

export function TeacherDashboard() {
  const [selectedClass, setSelectedClass] = useState("CS-301");
  const [stats, setStats]   = useState<TeacherStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [weeklyAnalysis, setWeeklyAnalysis] = useState<WeeklyAttendanceSummary[]>([]);
  const [weeklyLoading, setWeeklyLoading] = useState(true);
  const [weeklyError, setWeeklyError] = useState<string | null>(null);

  useEffect(() => {
    getTeacherStats()
      .then(setStats)
      .catch((err) => console.error("Teacher stats error:", err));
    getCourses()
      .then((data) => setCourses(data.sort((a, b) => a.code.localeCompare(b.code))))
      .catch((err) => console.error("Courses error:", err));
    getWeeklyAttendanceAnalysis({ scope: "all" })
      .then(setWeeklyAnalysis)
      .catch((err) => {
        console.error("Weekly attendance error:", err);
        setWeeklyError("Could not load weekly attendance analysis.");
      })
      .finally(() => setWeeklyLoading(false));
  }, []);

  const displayClasses = courses.length > 0 ? courses.slice(0, 3) : [
    { id: "1", code: "CS-301", name: "Data Structures & Algorithms", students: 32, schedule: "Mon/Wed 9:00 AM", room: "Room 204", status: "active" as const },
    { id: "2", code: "CS-405", name: "Machine Learning",             students: 28, schedule: "Tue/Thu 11:00 AM", room: "Room 312", status: "active" as const },
    { id: "3", code: "CS-201", name: "Object-Oriented Programming",  students: 35, schedule: "Mon/Wed/Fri 2:00 PM", room: "Room 108", status: "active" as const },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="My Classes" value={stats ? String(stats.myClasses) : "…"} icon={<BookOpen className="w-5 h-5" />} />
        <StatCard title="Total Students" value={stats ? String(stats.totalStudents) : "…"} icon={<Users className="w-5 h-5" />} iconBg="bg-cyan-100 text-cyan-600" />
        <StatCard title="Today's Attendance" value={stats ? `${stats.todayAttendanceRate}%` : "…"} change="+3.2% vs avg" changeType="up" icon={<CalendarCheck className="w-5 h-5" />} iconBg="bg-emerald-100 text-emerald-600" />
        <StatCard title="Next Class" value={stats ? stats.nextClass : "…"} icon={<Clock className="w-5 h-5" />} iconBg="bg-amber-100 text-amber-600" />
      </div>

      <WeeklyAttendanceTable
        title="Weekly Attendance Analysis"
        description="Institution-wide attendance summary for the current month."
        data={weeklyAnalysis}
        loading={weeklyLoading}
        error={weeklyError}
      />

      {/* My Classes */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[0.9375rem] text-slate-900 font-semibold">My Classes</h3>
          <Link to="/teacher/camera" className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-[0.8125rem] rounded-lg hover:bg-indigo-700 transition-colors">
            <Camera className="w-3.5 h-3.5" /> Start Session
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {displayClasses.map((cls) => (
            <button
              key={cls.id}
              onClick={() => setSelectedClass(cls.code)}
              className={`text-left p-4 rounded-xl border transition-all ${
                selectedClass === cls.code
                  ? "border-indigo-300 bg-indigo-50 ring-1 ring-indigo-200"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[0.875rem] text-indigo-600 font-semibold">{cls.code}</span>
                <span className="text-[0.6875rem] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{cls.students} students</span>
              </div>
              <p className="text-[0.8125rem] text-slate-800 mb-2 font-medium">{cls.name}</p>
              <div className="space-y-1 text-[0.75rem] text-slate-500">
                <p>{cls.schedule} &middot; {cls.room}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chart + Student List */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-[0.9375rem] text-slate-900 mb-4 font-semibold">{selectedClass} - Recent Sessions</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={classAttendance} barGap={4}>
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px" }} />
              <Bar dataKey="present" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Present" />
              <Bar dataKey="absent"  fill="#fecaca" radius={[4, 4, 0, 0]} name="Absent" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[0.9375rem] text-slate-900 font-semibold">Today's Attendance - {selectedClass}</h3>
            <div className="flex items-center gap-3 text-[0.75rem]">
              <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /> {todayStudents.filter(s => s.status === "present").length}</span>
              <span className="flex items-center gap-1 text-amber-600"><AlertCircle className="w-3.5 h-3.5" /> {todayStudents.filter(s => s.status === "late").length}</span>
              <span className="flex items-center gap-1 text-red-500"><XCircle className="w-3.5 h-3.5" /> {todayStudents.filter(s => s.status === "absent").length}</span>
            </div>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {todayStudents.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-cyan-100 rounded-full flex items-center justify-center text-[0.6875rem] text-indigo-700 font-semibold">
                    {s.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-[0.8125rem] text-slate-800 font-medium">{s.name}</p>
                    <p className="text-[0.6875rem] text-slate-400">{s.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[0.75rem] text-slate-500">{s.time}</span>
                  <StatusBadge variant={s.status}>{s.status}</StatusBadge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
