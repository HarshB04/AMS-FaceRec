import React, { useState, useEffect } from "react";
import { Camera, Video, Pause, Play, Download, RefreshCw, Users, CheckCircle2, Clock, XCircle, Maximize2, Settings } from "lucide-react";
import { StatusBadge } from "../components/shared/StatusBadge";

interface RecognizedStudent {
  id: string;
  name: string;
  studentId: string;
  confidence: number;
  time: string;
  status: "present" | "late";
}

const mockRecognized: RecognizedStudent[] = [
  { id: "1", name: "Sarah Johnson", studentId: "STU-001", confidence: 98.5, time: "9:00:12 AM", status: "present" },
  { id: "2", name: "Michael Chen", studentId: "STU-002", confidence: 96.2, time: "9:00:15 AM", status: "present" },
  { id: "3", name: "Emily Davis", studentId: "STU-003", confidence: 97.8, time: "9:00:23 AM", status: "present" },
  { id: "4", name: "James Wilson", studentId: "STU-004", confidence: 95.1, time: "9:01:05 AM", status: "present" },
  { id: "5", name: "Sophia Martinez", studentId: "STU-005", confidence: 99.1, time: "9:05:33 AM", status: "present" },
  { id: "6", name: "Robert Brown", studentId: "STU-006", confidence: 94.7, time: "9:12:41 AM", status: "late" },
  { id: "7", name: "Lisa Thompson", studentId: "STU-007", confidence: 97.3, time: "9:13:22 AM", status: "late" },
];

export function LiveCamera() {
  const [isRecording, setIsRecording] = useState(true);
  const [recognized, setRecognized] = useState<RecognizedStudent[]>(mockRecognized.slice(0, 3));
  const [elapsed, setElapsed] = useState(0);
  const [selectedCourse, setSelectedCourse] = useState("CS-301");

  useEffect(() => {
    if (!isRecording) return;
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, [isRecording]);

  // Simulate progressive recognition
  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      setRecognized((prev) => {
        if (prev.length < mockRecognized.length) {
          return [...prev, mockRecognized[prev.length]];
        }
        return prev;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const totalStudents = 32;
  const presentCount = recognized.filter((r) => r.status === "present").length;
  const lateCount = recognized.filter((r) => r.status === "late").length;
  const absentCount = totalStudents - recognized.length;

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[0.8125rem] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="CS-301">CS-301 - Data Structures</option>
            <option value="CS-405">CS-405 - Machine Learning</option>
            <option value="CS-201">CS-201 - OOP</option>
          </select>
          <div className="flex items-center gap-2">
            {isRecording && <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />}
            <span className="text-[0.8125rem] text-slate-600" style={{ fontWeight: 500 }}>
              {isRecording ? "Recording" : "Paused"} &middot; {formatTime(elapsed)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[0.8125rem] transition-colors ${
              isRecording
                ? "bg-red-50 text-red-600 hover:bg-red-100"
                : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
            }`}
          >
            {isRecording ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isRecording ? "Pause" : "Resume"}
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-[0.8125rem] hover:bg-indigo-700 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <Users className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
          <p className="text-[1.25rem] text-slate-900" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}>{totalStudents}</p>
          <p className="text-[0.75rem] text-slate-500">Enrolled</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
          <p className="text-[1.25rem] text-emerald-600" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}>{presentCount}</p>
          <p className="text-[0.75rem] text-slate-500">Present</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <Clock className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className="text-[1.25rem] text-amber-600" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}>{lateCount}</p>
          <p className="text-[0.75rem] text-slate-500">Late</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <XCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
          <p className="text-[1.25rem] text-red-500" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}>{absentCount}</p>
          <p className="text-[0.75rem] text-slate-500">Not Yet</p>
        </div>
      </div>

      {/* Camera + Recognized List */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Camera Feed */}
        <div className="lg:col-span-3">
          <div className="bg-slate-900 rounded-2xl overflow-hidden relative aspect-video border-2 border-slate-800 shadow-2xl">
            {/* Simulated camera feed with glassmorphism overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
              <div className="text-center">
                <Camera className="w-16 h-16 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 text-[0.875rem]">Live Camera Feed</p>
                <p className="text-slate-600 text-[0.75rem]">Camera 1 - {selectedCourse} - Room 204</p>
              </div>
            </div>

            {/* Simulated detection boxes */}
            {isRecording && (
              <>
                <div className="absolute top-[15%] left-[20%] w-20 h-24 border-2 border-emerald-400 rounded-lg">
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-emerald-500/90 backdrop-blur text-white text-[0.6rem] px-1.5 py-0.5 rounded whitespace-nowrap" style={{ fontWeight: 500 }}>
                    Sarah J. (98%)
                  </div>
                </div>
                <div className="absolute top-[20%] left-[50%] w-18 h-22 border-2 border-emerald-400 rounded-lg">
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-emerald-500/90 backdrop-blur text-white text-[0.6rem] px-1.5 py-0.5 rounded whitespace-nowrap" style={{ fontWeight: 500 }}>
                    Michael C. (96%)
                  </div>
                </div>
                <div className="absolute top-[25%] right-[20%] w-20 h-24 border-2 border-cyan-400 rounded-lg animate-pulse">
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-cyan-500/90 backdrop-blur text-white text-[0.6rem] px-1.5 py-0.5 rounded whitespace-nowrap" style={{ fontWeight: 500 }}>
                    Scanning...
                  </div>
                </div>
              </>
            )}

            {/* Top controls overlay */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
              <div className="bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-[0.75rem]">
                {isRecording && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                <span>LIVE</span>
                <span className="text-slate-400">&middot;</span>
                <span>{formatTime(elapsed)}</span>
              </div>
              <div className="flex gap-2">
                <button className="bg-black/50 backdrop-blur-md text-white p-1.5 rounded-lg hover:bg-black/70" aria-label="Fullscreen">
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button className="bg-black/50 backdrop-blur-md text-white p-1.5 rounded-lg hover:bg-black/70" aria-label="Settings">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bottom info bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <div className="flex items-center justify-between text-white text-[0.75rem]">
                <span>{recognized.length}/{totalStudents} recognized</span>
                <div className="w-32 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${(recognized.length / totalStudents) * 100}%` }}
                  />
                </div>
                <span>{Math.round((recognized.length / totalStudents) * 100)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recognized List */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[0.9375rem] text-slate-900" style={{ fontWeight: 600 }}>
              Recognized ({recognized.length})
            </h3>
            <button className="text-slate-400 hover:text-slate-600 p-1" aria-label="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto max-h-[400px] pr-1">
            {recognized.map((student, idx) => (
              <div
                key={student.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-all"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-cyan-400 rounded-full flex items-center justify-center text-white text-[0.6875rem] flex-shrink-0" style={{ fontWeight: 600 }}>
                  {student.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-[0.8125rem] text-slate-800 truncate" style={{ fontWeight: 500 }}>{student.name}</p>
                    <StatusBadge variant={student.status}>{student.status}</StatusBadge>
                  </div>
                  <div className="flex items-center gap-2 text-[0.6875rem] text-slate-400 mt-0.5">
                    <span>{student.studentId}</span>
                    <span>&middot;</span>
                    <span>{student.time}</span>
                    <span>&middot;</span>
                    <span className="text-emerald-500" style={{ fontWeight: 500 }}>{student.confidence}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Export options */}
          <div className="border-t border-slate-100 pt-4 mt-4 flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-[0.8125rem] hover:bg-indigo-100 transition-colors">
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-[0.8125rem] hover:bg-indigo-100 transition-colors">
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
