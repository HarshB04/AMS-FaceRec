import React, { useEffect, useMemo, useState } from "react";
import { Layers, MapPin, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getTimetableSlotsForProgram } from "../lib/api";
import {
  TIMETABLE_DEPARTMENTS,
  formatSlotTime,
  formatTime,
  getSemestersForDepartment,
  getUniqueCourses,
  toTimetableSemester,
  type TimetableSlot,
} from "../lib/timetable";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DEFAULT_DEPARTMENT = "Computer Engineering";
const DEFAULT_SEMESTER = "II";

function todayDayIndex() {
  const day = new Date().getDay();
  return day === 0 ? -1 : day - 1;
}

function getDateDayIndex(date: Date) {
  const day = date.getDay();
  return day === 0 ? -1 : day - 1;
}

function upcomingClasses(slots: TimetableSlot[]) {
  const now = new Date();
  const results: { date: string; sortDate: number; slot: TimetableSlot }[] = [];

  for (let offset = 0; offset < 7; offset++) {
    const date = new Date(now);
    date.setDate(now.getDate() + offset);
    const dayIdx = getDateDayIndex(date);
    if (dayIdx < 0) continue;

    const dateLabel = date.toLocaleDateString("en-GB", { weekday: "short", month: "short", day: "numeric" });
    slots
      .filter((slot) => slot.dayIndex === dayIdx)
      .forEach((slot) => results.push({ date: dateLabel, sortDate: date.getTime(), slot }));
  }

  return results
    .sort((a, b) => {
      if (a.sortDate !== b.sortDate) return a.sortDate - b.sortDate;
      return a.slot.startHour * 60 + a.slot.startMin - (b.slot.startHour * 60 + b.slot.startMin);
    })
    .slice(0, 10);
}

function getHours(slots: TimetableSlot[]) {
  if (slots.length === 0) return [9, 10, 11, 12, 13, 14, 15, 16];

  const startHour = Math.min(...slots.map((slot) => slot.startHour), 9);
  const endHour = Math.max(
    ...slots.map((slot) => Math.ceil((slot.startHour * 60 + slot.startMin + slot.durationMin) / 60)),
    17
  );

  return Array.from({ length: endHour - startHour }, (_, index) => startHour + index);
}

function getOverlap(slot: TimetableSlot, daySlots: TimetableSlot[]) {
  const group = daySlots.filter(
    (item) =>
      item.startHour === slot.startHour &&
      item.startMin === slot.startMin &&
      item.durationMin === slot.durationMin
  );

  return {
    lane: Math.max(0, group.findIndex((item) => item.id === slot.id)),
    count: Math.max(1, group.length),
  };
}

export function StudentSchedule() {
  const [selectedDepartment, setSelectedDepartment] = useState(DEFAULT_DEPARTMENT);
  const [selectedSemester, setSelectedSemester] = useState(DEFAULT_SEMESTER);
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);

  const semesters = useMemo(() => getSemestersForDepartment(selectedDepartment), [selectedDepartment]);
  const uniqueCourses = useMemo(() => getUniqueCourses(slots), [slots]);
  const todayIdx = useMemo(todayDayIndex, []);
  const upcoming = useMemo(() => upcomingClasses(slots), [slots]);
  const hours = useMemo(() => getHours(slots), [slots]);

  const gridStartHour = hours[0];
  const gridEndHour = hours[hours.length - 1] + 1;
  const totalMinutes = (gridEndHour - gridStartHour) * 60;
  const gridHeightPx = 560;

  useEffect(() => {
    let active = true;

    setScheduleLoading(true);
    getTimetableSlotsForProgram(selectedDepartment, selectedSemester)
      .then((data) => {
        if (active) setSlots(data);
      })
      .catch((error) => {
        console.error("Timetable load error:", error);
        if (active) setSlots([]);
      })
      .finally(() => {
        if (active) setScheduleLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedDepartment, selectedSemester]);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;

      const metadata = data.session?.user.user_metadata ?? {};
      const department = String(metadata.department ?? metadata.course ?? "").trim();
      const semester = toTimetableSemester(metadata.semester);

      if (department && TIMETABLE_DEPARTMENTS.includes(department)) {
        const availableSemesters = getSemestersForDepartment(department);
        setSelectedDepartment(department);
        setSelectedSemester(semester && availableSemesters.includes(semester) ? semester : availableSemesters[0] ?? DEFAULT_SEMESTER);
      } else if (semester && semesters.includes(semester)) {
        setSelectedSemester(semester);
      }
    });

    return () => {
      active = false;
    };
  }, [semesters]);

  function topPct(slot: TimetableSlot) {
    const mins = (slot.startHour - gridStartHour) * 60 + slot.startMin;
    return (mins / totalMinutes) * 100;
  }

  function heightPct(slot: TimetableSlot) {
    return (slot.durationMin / totalMinutes) * 100;
  }

  function handleDepartmentChange(department: string) {
    const nextSemesters = getSemestersForDepartment(department);
    setSelectedDepartment(department);
    setSelectedSemester(nextSemesters[0] ?? "");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2
            className="text-[1.25rem] text-slate-900"
            style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
          >
            My Schedule
          </h2>
          <p className="text-[0.8125rem] text-slate-500">
            {selectedDepartment}, Semester {selectedSemester} &mdash;{" "}
            {scheduleLoading ? "loading timetable" : `${uniqueCourses.length} subjects and activities`}.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <label className="space-y-1">
            <span className="block text-[0.6875rem] font-semibold uppercase tracking-wide text-slate-400">
              Branch
            </span>
            <select
              value={selectedDepartment}
              onChange={(event) => handleDepartmentChange(event.target.value)}
              className="h-9 min-w-[220px] rounded-lg border border-slate-200 bg-white px-3 text-[0.8125rem] text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20"
            >
              {TIMETABLE_DEPARTMENTS.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="block text-[0.6875rem] font-semibold uppercase tracking-wide text-slate-400">
              Semester
            </span>
            <select
              value={selectedSemester}
              onChange={(event) => setSelectedSemester(event.target.value)}
              className="h-9 min-w-[96px] rounded-lg border border-slate-200 bg-white px-3 text-[0.8125rem] text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20"
            >
              {semesters.map((semester) => (
                <option key={semester} value={semester}>
                  {semester}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {uniqueCourses.map((slot) => (
          <div key={slot.courseCode} className="flex items-center gap-1.5 text-[0.75rem] font-medium text-slate-600">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: slot.color }} />
            {slot.courseCode}
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <div className="min-w-[900px]">
          <div
            className="grid border-b border-slate-200"
            style={{ gridTemplateColumns: `56px repeat(${DAYS.length}, minmax(0, 1fr))` }}
          >
            <div className="border-r border-slate-100 bg-slate-50 p-2" />
            {DAYS.map((day, index) => (
              <div
                key={day}
                className={`border-r border-slate-100 py-2.5 text-center text-[0.75rem] font-semibold last:border-r-0 ${
                  index === todayIdx ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-500"
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid" style={{ gridTemplateColumns: `56px repeat(${DAYS.length}, minmax(0, 1fr))` }}>
            <div className="relative border-r border-slate-100" style={{ height: `${gridHeightPx}px` }}>
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="absolute flex w-full items-start justify-end pr-2 text-[0.625rem] text-slate-300"
                  style={{ top: `${((hour - gridStartHour) / (gridEndHour - gridStartHour)) * 100}%` }}
                >
                  {formatTime(hour, 0).replace(":00 ", "")}
                </div>
              ))}
            </div>

            {DAYS.map((day, dayIdx) => {
              const daySlots = slots.filter((slot) => slot.dayIndex === dayIdx);

              return (
                <div
                  key={day}
                  className={`relative border-r border-slate-100 last:border-r-0 ${
                    dayIdx === todayIdx ? "bg-indigo-50/30" : ""
                  }`}
                  style={{ height: `${gridHeightPx}px` }}
                >
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="absolute w-full border-t border-slate-100"
                      style={{ top: `${((hour - gridStartHour) / (gridEndHour - gridStartHour)) * 100}%` }}
                    />
                  ))}

                  {daySlots.map((slot) => {
                    const overlap = getOverlap(slot, daySlots);
                    const widthPct = 100 / overlap.count;

                    return (
                      <div
                        key={slot.id}
                        className="absolute rounded-lg border border-white/70 p-1.5 shadow-sm"
                        style={{
                          top: `${topPct(slot)}%`,
                          left: `calc(${overlap.lane * widthPct}% + 0.25rem)`,
                          width: `calc(${widthPct}% - 0.5rem)`,
                          height: `${heightPct(slot)}%`,
                          backgroundColor: `${slot.color}22`,
                          borderLeft: `3px solid ${slot.color}`,
                        }}
                        title={`${slot.courseCode} - ${slot.courseTitle}\n${formatSlotTime(slot)}\n${slot.room || "Room not assigned"}`}
                      >
                        <p className="truncate text-[0.6875rem] font-bold" style={{ color: slot.color }}>
                          {slot.courseCode}
                        </p>
                        <p className="truncate text-[0.625rem] text-slate-700">{slot.courseTitle}</p>
                        <p className="truncate text-[0.625rem] text-slate-500">
                          {slot.room || slot.batch || slot.classType || "TBA"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="mb-4 text-[0.9375rem] font-semibold text-slate-900">
          Upcoming Classes - Next 7 Days
        </h3>
        <div className="space-y-3">
          {upcoming.length === 0 ? (
            <p className="text-[0.8125rem] text-slate-400">No upcoming classes in the next 7 days.</p>
          ) : (
            upcoming.map((item, index) => (
              <div
                key={`${item.date}-${item.slot.id}-${index}`}
                className="flex items-start gap-4 rounded-xl p-3 transition-colors hover:bg-slate-50"
              >
                <div
                  className="w-1 flex-shrink-0 self-stretch rounded-full"
                  style={{ backgroundColor: item.slot.color }}
                />
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex items-center justify-between gap-2">
                    <span className="text-[0.875rem] font-semibold" style={{ color: item.slot.color }}>
                      {item.slot.courseCode}
                    </span>
                    <span className="text-[0.75rem] text-slate-400">{item.date}</span>
                  </div>
                  <p className="truncate text-[0.8125rem] text-slate-700">{item.slot.courseTitle}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-[0.75rem] text-slate-400">
                    <span>{formatSlotTime(item.slot)}</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {item.slot.room || "TBA"}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" /> {item.slot.facultyName || "Faculty TBA"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="h-3 w-3" /> {item.slot.batch || item.slot.classType || "Class"}
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
