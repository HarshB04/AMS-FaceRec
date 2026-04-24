import React, { useMemo } from "react";
import { MapPin, User } from "lucide-react";

interface ClassSlot {
  course: string;
  name: string;
  teacher: string;
  room: string;
  days: number[]; // 0=Mon … 4=Fri
  startHour: number;
  startMin: number;
  durationMin: number;
  color: string;
}

const SLOTS: ClassSlot[] = [
  { course: "CS-301",   name: "Data Structures & Algorithms", teacher: "Dr. Smith",  room: "Room 204", days: [0, 2], startHour: 9,  startMin: 0,  durationMin: 60, color: "#4f46e5" },
  { course: "MATH-201", name: "Calculus II",                  teacher: "Prof. Lee",   room: "Room 108", days: [0, 2, 4], startHour: 11, startMin: 0, durationMin: 50, color: "#06b6d4" },
  { course: "ENG-101",  name: "Technical Writing",            teacher: "Ms. Carter",  room: "Room 310", days: [1, 3], startHour: 9,  startMin: 0,  durationMin: 60, color: "#10b981" },
  { course: "PHY-102",  name: "Physics Lab",                  teacher: "Dr. Patel",   room: "Lab B",    days: [1, 3], startHour: 14, startMin: 0,  durationMin: 90, color: "#f59e0b" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16];

function fmt(h: number, m: number) {
  const suffix = h >= 12 ? "PM" : "AM";
  const hh = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hh}:${m.toString().padStart(2, "0")} ${suffix}`;
}

function todayDayIndex() {
  const d = new Date().getDay(); // 0=Sun
  return d === 0 || d === 6 ? -1 : d - 1; // Mon=0 … Fri=4
}

// Next 7 days of upcoming classes
function upcomingClasses() {
  const now = new Date();
  const results: { date: string; dayLabel: string; slot: ClassSlot }[] = [];
  for (let offset = 0; offset < 7; offset++) {
    const d = new Date(now);
    d.setDate(now.getDate() + offset);
    const day = d.getDay();
    if (day === 0 || day === 6) continue;
    const dayIdx = day - 1;
    const dateStr = d.toLocaleDateString("en-GB", { weekday: "short", month: "short", day: "numeric" });
    SLOTS.filter((s) => s.days.includes(dayIdx)).forEach((s) => {
      results.push({ date: dateStr, dayLabel: DAYS[dayIdx], slot: s });
    });
  }
  return results.slice(0, 10);
}

export function StudentSchedule() {
  const todayIdx = useMemo(todayDayIndex, []);
  const upcoming = useMemo(upcomingClasses, []);

  // Grid pixel math
  const gridStartHour = HOURS[0];
  const gridEndHour   = HOURS[HOURS.length - 1] + 1;
  const totalMinutes  = (gridEndHour - gridStartHour) * 60;
  const gridHeightPx  = 480;

  function topPct(slot: ClassSlot) {
    const mins = (slot.startHour - gridStartHour) * 60 + slot.startMin;
    return (mins / totalMinutes) * 100;
  }
  function heightPct(slot: ClassSlot) {
    return (slot.durationMin / totalMinutes) * 100;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2
          className="text-[1.25rem] text-slate-900"
          style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
        >
          My Schedule
        </h2>
        <p className="text-[0.8125rem] text-slate-500">
          Weekly class timetable — {SLOTS.length} enrolled courses.
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {SLOTS.map((s) => (
          <div key={s.course} className="flex items-center gap-1.5 text-[0.75rem] font-medium text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.course}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Header row */}
        <div className="grid border-b border-slate-200" style={{ gridTemplateColumns: "56px repeat(5, 1fr)" }}>
          <div className="p-2 bg-slate-50 border-r border-slate-100" />
          {DAYS.map((day, i) => (
            <div
              key={day}
              className={`py-2.5 text-center text-[0.75rem] font-semibold border-r border-slate-100 last:border-r-0 ${
                i === todayIdx
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-50 text-slate-500"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="grid" style={{ gridTemplateColumns: "56px repeat(5, 1fr)" }}>
          {/* Hour labels */}
          <div className="border-r border-slate-100 relative" style={{ height: `${gridHeightPx}px` }}>
            {HOURS.map((h) => (
              <div
                key={h}
                className="absolute w-full flex items-start justify-end pr-2 text-[0.625rem] text-slate-300"
                style={{ top: `${((h - gridStartHour) / (gridEndHour - gridStartHour)) * 100}%` }}
              >
                {h > 12 ? `${h - 12}PM` : `${h}AM`}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {DAYS.map((day, dayIdx) => (
            <div
              key={day}
              className={`relative border-r border-slate-100 last:border-r-0 ${
                dayIdx === todayIdx ? "bg-indigo-50/30" : ""
              }`}
              style={{ height: `${gridHeightPx}px` }}
            >
              {/* Hour lines */}
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="absolute w-full border-t border-slate-100"
                  style={{ top: `${((h - gridStartHour) / (gridEndHour - gridStartHour)) * 100}%` }}
                />
              ))}

              {/* Class slots */}
              {SLOTS.filter((s) => s.days.includes(dayIdx)).map((slot) => (
                <div
                  key={`${day}-${slot.course}`}
                  className="absolute left-1 right-1 rounded-lg overflow-hidden shadow-sm border border-white/60 p-1.5 cursor-default"
                  style={{
                    top:    `${topPct(slot)}%`,
                    height: `${heightPct(slot)}%`,
                    backgroundColor: slot.color + "22",
                    borderLeft: `3px solid ${slot.color}`,
                  }}
                  title={`${slot.course} — ${slot.name}\n${fmt(slot.startHour, slot.startMin)}\n${slot.room}`}
                >
                  <p className="text-[0.6875rem] font-bold truncate" style={{ color: slot.color }}>
                    {slot.course}
                  </p>
                  <p className="text-[0.625rem] text-slate-600 truncate">{slot.room}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming classes list */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-[0.9375rem] text-slate-900 font-semibold mb-4">
          Upcoming Classes — Next 7 Days
        </h3>
        <div className="space-y-3">
          {upcoming.length === 0 ? (
            <p className="text-[0.8125rem] text-slate-400">No upcoming classes in the next 7 days.</p>
          ) : (
            upcoming.map((item, i) => (
              <div
                key={`${item.date}-${item.slot.course}-${i}`}
                className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <div
                  className="w-1 self-stretch rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.slot.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span
                      className="text-[0.875rem] font-semibold"
                      style={{ color: item.slot.color }}
                    >
                      {item.slot.course}
                    </span>
                    <span className="text-[0.75rem] text-slate-400">{item.date}</span>
                  </div>
                  <p className="text-[0.8125rem] text-slate-700 truncate">{item.slot.name}</p>
                  <div className="flex items-center gap-3 mt-1 text-[0.75rem] text-slate-400">
                    <span>{fmt(item.slot.startHour, item.slot.startMin)}</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {item.slot.room}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" /> {item.slot.teacher}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
