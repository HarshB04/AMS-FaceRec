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
  getTodayAttendanceForCourse,
} from "../lib/api";

export function TeacherDashboard() {
  const [selectedClass, setSelectedClass] = useState("CS-301");
  const [stats, setStats]   = useState<TeacherStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [weeklyAnalysis, setWeeklyAnalysis] = useState<WeeklyAttendanceSummary[]>([]);
  const [weeklyLoading, setWeeklyLoading] = useState(true);
  const [weeklyError, setWeeklyError] = useState<string | null>(null);
  
  const [todayStudents, setTodayStudents] = useState<any[]>([]);
  const [classAttendance, setClassAttendance] = useState<any[]>([]);

  useEffect(() => {
    getTeacherStats()
      .then(setStats)
      .catch((err) => console.error("Teacher stats error:", err));
    getCourses()
      .then((data) => {
        setCourses(data.sort((a, b) => a.code.localeCompare(b.code)));
        if (data.length > 0) setSelectedClass(data[0].code);
      })
      .catch((err) => console.error("Courses error:", err));
    getWeeklyAttendanceAnalysis({ scope: "all" })
      .then(setWeeklyAnalysis)
      .catch((err) => {
        console.error("Weekly attendance error:", err);
        setWeeklyError("Could not load weekly attendance analysis.");
      })
      .finally(() => setWeeklyLoading(false));
  }, []);

  useEffect(() => {
    const fetchClassData = async () => {
      const cls = courses.find((c) => c.code === selectedClass);
      if (!cls) return;

      try {
        const rawAttendance = await getTodayAttendanceForCourse(cls.id);
        const mappedStudents = rawAttendance.map((a: any) => ({
          id: a.students?.student_id_text || `ID-${a.student_id}`,
          name: a.students?.name || "Unknown Student",
          time: a.marked_at ? new Date(a.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—",
          status: a.status
        }));
        setTodayStudents(mappedStudents);

        // Mock historical data since we only fetch today's right now
        setClassAttendance([
          { date: "Day 1", present: Math.floor(cls.students * 0.9), absent: Math.floor(cls.students * 0.1) },
          { date: "Day 2", present: Math.floor(cls.students * 0.85), absent: Math.floor(cls.students * 0.15) },
          { date: "Day 3", present: Math.floor(cls.students * 0.95), absent: Math.floor(cls.students * 0.05) },
          { date: "Today", present: mappedStudents.filter(s => s.status === 'present').length, absent: mappedStudents.filter(s => s.status === 'absent').length },
        ]);
      } catch (err) {
        console.error("Failed to load attendance for class", err);
      }
    };
    fetchClassData();
  }, [selectedClass, courses]);

  const displayClasses = courses.length > 0 ? courses.slice(0, 3) : [];

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
