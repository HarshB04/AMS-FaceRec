import React, { useState, useEffect, useCallback } from "react";
import { FLASK_URL } from "@/app/lib/backendApi";
import {
  Camera, Pause, Play, Download, CheckCircle2, Clock,
  XCircle, Power, User, AlertCircle, BookOpen, MapPin,
} from "lucide-react";
import { TIMETABLE_ROWS, buildTimetableSlots, type TimetableSlot } from "../lib/timetable";
import { backendApi } from "@/app/lib/backendApi";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecognizedStudent {
  name: string;
  confidence: number;
  time: string;
}

interface AttendanceRecord {
  id: string;
  name: string;
  sbrn: string;
  time: string;
  confidence: number;
}

// ─── Timetable helpers ────────────────────────────────────────────────────────

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getCurrentSlot(): TimetableSlot | null {
  const now = new Date();
  const dayName = DAY_NAMES[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Get today's name in the format used by timetable (e.g. "Monday")
  const todaySlots = buildTimetableSlots(
    TIMETABLE_ROWS.filter((r) => r.day.toLowerCase() === dayName.toLowerCase())
  );

  return (
    todaySlots.find((slot) => {
      const slotStart = slot.startHour * 60 + slot.startMin;
      const slotEnd   = slot.startHour * 60 + slot.startMin + slot.durationMin;
      return currentMinutes >= slotStart && currentMinutes < slotEnd;
    }) ?? null
  );
}

function getNextSlot(): TimetableSlot | null {
  const now = new Date();
  const dayName = DAY_NAMES[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const todaySlots = buildTimetableSlots(
    TIMETABLE_ROWS.filter((r) => r.day.toLowerCase() === dayName.toLowerCase())
  );

  return (
    todaySlots
      .filter((slot) => slot.startHour * 60 + slot.startMin > currentMinutes)
      .sort((a, b) => (a.startHour * 60 + a.startMin) - (b.startHour * 60 + b.startMin))[0] ?? null
  );
}

function formatTime12(hour: number, minute: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${h}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function formatElapsed(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LiveCamera() {
  const [serverOnline, setServerOnline]       = useState(false);
  const [isStreaming, setIsStreaming]         = useState(false);
  const [streamUrl, setStreamUrl]             = useState("");
  const [elapsed, setElapsed]                 = useState(0);

  const [currentSlot, setCurrentSlot]         = useState<TimetableSlot | null>(null);
  const [nextSlot, setNextSlot]               = useState<TimetableSlot | null>(null);

  const [recognized, setRecognized]           = useState<RecognizedStudent[]>([]);
  const [attendanceLog, setAttendanceLog]     = useState<AttendanceRecord[]>([]);
  const [matchedStudent, setMatchedStudent]   = useState<RecognizedStudent | null>(null);
  const [totalStudents, setTotalStudents]     = useState(0);

  // ── Server health check ───────────────────────────────────────────────────
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(FLASK_URL);
        setServerOnline(res.ok);
      } catch {
        setServerOnline(false);
      }
    };
    check();
    const id = setInterval(check, 5000);
    return () => clearInterval(id);
  }, []);

  // ── Release camera on unmount / page leave ────────────────────────────────
  useEffect(() => {
    const release = () => fetch(`${FLASK_URL}/stop`, { method: "POST", keepalive: true }).catch(() => {});
    window.addEventListener("beforeunload", release);
    return () => { window.removeEventListener("beforeunload", release); release(); };
  }, []);

  // ── Auto-detect current timetable slot (refresh every minute) ────────────
  useEffect(() => {
    const refresh = () => {
      setCurrentSlot(getCurrentSlot());
      setNextSlot(getNextSlot());
    };
    refresh();
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, []);

  // ── Session timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isStreaming) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [isStreaming]);

  // ── Fetch total enrolled students for current slot ────────────────────────
  useEffect(() => {
    if (!currentSlot) return;
    backendApi
      .get(`/api/students?course=${encodeURIComponent(currentSlot.courseCode)}`)
      .then((r) => r.json())
      .then((d) => setTotalStudents(Array.isArray(d.data) ? d.data.length : 0))
      .catch(() => setTotalStudents(0));
  }, [currentSlot]);

  // ── Poll recognized students from Flask ──────────────────────────────────
  const pollRecognized = useCallback(async () => {
    try {
      const res = await fetch(`${FLASK_URL}/recognized`);
      const data: RecognizedStudent[] = await res.json();

      // Detect newly recognized student (not already in log)
      const newStudents = data.filter(
        (s) => !attendanceLog.some((r) => r.name === s.name)
      );
      if (newStudents.length > 0) {
        const newest = newStudents[newStudents.length - 1];
        setMatchedStudent(newest);
        // Add to log
        setAttendanceLog((prev) => [
          {
            id: `${newest.name}-${Date.now()}`,
            name: newest.name,
            sbrn: newest.name, // Flask returns name; SBRN would need a lookup
            time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
            confidence: newest.confidence,
          },
          ...prev,
        ]);
        // Clear matched overlay after 3 seconds
        setTimeout(() => setMatchedStudent(null), 3000);
      }

      setRecognized(data);
    } catch {
      // server may be busy; silently ignore
    }
  }, [attendanceLog]);

  useEffect(() => {
    if (!isStreaming) return;
    const id = setInterval(pollRecognized, 2000);
    return () => clearInterval(id);
  }, [isStreaming, pollRecognized]);

  // ── Start / Stop ──────────────────────────────────────────────────────────
  const startStream = () => {
    setIsStreaming(true);
    setElapsed(0);
    setRecognized([]);
    setAttendanceLog([]);

    const params = new URLSearchParams({ t: String(Date.now()) });
    if (currentSlot) {
      params.set("course_code", currentSlot.courseCode);
      params.set("course_name", currentSlot.courseTitle);
      params.set("department", currentSlot.department);
      params.set("semester", currentSlot.semester);
    }
    setStreamUrl(`${FLASK_URL}/video_feed?${params.toString()}`);
  };

  const stopStream = async () => {
    setIsStreaming(false);
    try { await fetch(`${FLASK_URL}/stop`, { method: "POST" }); } catch { /* */ }
    setStreamUrl("");
  };

  const presentCount = attendanceLog.length;
  const absentCount  = Math.max(0, totalStudents - presentCount);

  // ── Export attendance as CSV ──────────────────────────────────────────────
  const exportCsv = () => {
    const rows = [
      ["Name", "SBRN", "Time", "Confidence%"],
      ...attendanceLog.map((r) => [r.name, r.sbrn, r.time, `${r.confidence}`]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `attendance_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Page header ── */}
      <div>
        <h2 className="text-[1.25rem] text-slate-900" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}>
          Live Attendance Scanner
        </h2>
        <p className="text-[0.8125rem] text-slate-500">
          {currentSlot
            ? `Now scanning: ${currentSlot.courseCode} · ${currentSlot.courseTitle}`
            : "No class is scheduled right now."}
        </p>
      </div>

      {/* ── Flask offline banner ── */}
      {!serverOnline && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-[0.8125rem]">
          <Power className="w-4 h-4 flex-shrink-0" />
          Python Face Engine is offline. Run{" "}
          <code className="bg-amber-100 px-1.5 py-0.5 rounded text-[0.75rem]">python server.py</code>{" "}
          in the <code className="bg-amber-100 px-1.5 py-0.5 rounded text-[0.75rem]">face_engine</code> folder.
        </div>
      )}

      {/* ── Current class info card ── */}
      {currentSlot ? (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[0.9375rem] text-indigo-900 font-semibold truncate">
                {currentSlot.courseCode} — {currentSlot.courseTitle}
              </p>
              <div className="flex flex-wrap gap-3 text-[0.75rem] text-indigo-600 mt-0.5">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />
                  {formatTime12(currentSlot.startHour, currentSlot.startMin)} –{" "}
                  {formatTime12(currentSlot.endHour, currentSlot.endMin)}
                </span>
                {currentSlot.room && (
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{currentSlot.room}</span>
                )}
                {currentSlot.facultyName && (
                  <span className="flex items-center gap-1"><User className="w-3 h-3" />{currentSlot.facultyName}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={isStreaming ? stopStream : startStream}
              disabled={!serverOnline}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[0.875rem] font-semibold transition-colors disabled:opacity-40 ${
                isStreaming
                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {isStreaming ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isStreaming ? "Stop Session" : "Start Scanning"}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[0.9375rem] text-slate-700 font-medium">No ongoing class</p>
            <p className="text-[0.8125rem] text-slate-500 mt-0.5">
              {nextSlot
                ? `Next class: ${nextSlot.courseCode} at ${formatTime12(nextSlot.startHour, nextSlot.startMin)}`
                : "No more classes scheduled for today."}
            </p>
          </div>
        </div>
      )}

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <User className="w-4 h-4 text-indigo-600" />, value: totalStudents, label: "Enrolled", color: "text-slate-900" },
          { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, value: presentCount, label: "Present", color: "text-emerald-600" },
          { icon: <Clock className="w-4 h-4 text-amber-500" />, value: formatElapsed(elapsed), label: "Duration", color: "text-amber-600" },
          { icon: <XCircle className="w-4 h-4 text-red-500" />, value: absentCount, label: "Not Yet", color: "text-red-500" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <div className="flex justify-center mb-1">{stat.icon}</div>
            <p className={`text-[1.375rem] font-bold ${stat.color}`} style={{ fontFamily: "Poppins, sans-serif" }}>{stat.value}</p>
            <p className="text-[0.75rem] text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Camera + Session Log ── */}
      <div className="grid lg:grid-cols-5 gap-5">

        {/* Camera feed – 3 cols */}
        <div className="lg:col-span-3">
          <div className="bg-slate-900 rounded-2xl overflow-hidden relative aspect-video border border-slate-800 shadow-xl">
            {isStreaming ? (
              <img
                src={streamUrl}
                alt="Live camera feed"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <div className="text-center">
                  <Camera className="w-14 h-14 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-[0.875rem]">
                    {serverOnline
                      ? currentSlot
                        ? 'Click "Start Scanning" to begin'
                        : "No class scheduled right now"
                      : "Waiting for Python server…"}
                  </p>
                </div>
              </div>
            )}

            {/* LIVE badge */}
            {isStreaming && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur text-white px-3 py-1.5 rounded-lg text-[0.75rem]">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                LIVE · {formatElapsed(elapsed)}
              </div>
            )}

            {/* Face Matched overlay — sunny-attend style */}
            {matchedStudent && (
              <div className="absolute inset-x-4 bottom-4 bg-emerald-500/95 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-4 shadow-lg animate-bounce-once">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span className="text-white text-[0.8125rem] font-semibold">Face Matched!</span>
                  </div>
                  <p className="text-white text-[1rem] font-bold truncate">{matchedStudent.name}</p>
                  <p className="text-emerald-100 text-[0.75rem]">
                    {matchedStudent.confidence}% confidence · Attendance marked ✓
                  </p>
                </div>
              </div>
            )}

            {/* Progress bar at bottom */}
            {isStreaming && totalStudents > 0 && (
              <div className="absolute bottom-4 inset-x-4 flex items-center gap-3" style={{ bottom: matchedStudent ? 100 : 16 }}>
                <span className="text-white text-[0.75rem] bg-black/50 px-2 py-1 rounded-lg backdrop-blur">
                  {presentCount}/{totalStudents}
                </span>
                <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-700"
                    style={{ width: `${Math.round((presentCount / totalStudents) * 100)}%` }}
                  />
                </div>
                <span className="text-white text-[0.75rem] bg-black/50 px-2 py-1 rounded-lg backdrop-blur">
                  {Math.round((presentCount / totalStudents) * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Session Log – 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[0.9375rem] text-slate-900 font-semibold">Session Log</h3>
            <span className="text-[0.75rem] text-slate-400">{attendanceLog.length} marked</span>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto max-h-[360px] pr-1">
            {attendanceLog.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <Camera className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-[0.8125rem]">No attendance marked yet</p>
                <p className="text-[0.75rem] mt-0.5">
                  {isStreaming ? "Scanning for faces…" : "Start the session to begin"}
                </p>
              </div>
            ) : (
              attendanceLog.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition-all"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-[0.6875rem] font-bold flex-shrink-0">
                    {record.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[0.8125rem] text-slate-800 font-medium truncate">{record.name}</p>
                      <span className="text-[0.6875rem] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 ml-1">
                        Present
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[0.6875rem] text-slate-400 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{record.time}</span>
                      <span>·</span>
                      <span className="text-emerald-500 font-medium">{record.confidence}%</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Export */}
          {attendanceLog.length > 0 && (
            <div className="border-t border-slate-100 pt-4 mt-4">
              <button
                onClick={exportCsv}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-[0.8125rem] font-medium hover:bg-indigo-100 transition-colors"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
