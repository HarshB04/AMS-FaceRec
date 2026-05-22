import React, { useState } from "react";
import {
  Settings, Building2, CalendarRange, SlidersHorizontal,
  Camera, Bell, Save, CheckCircle2, AlertCircle,
} from "lucide-react";

interface SettingsState {
  institutionName: string;
  academicYear: string;
  semesterStart: string;
  semesterEnd: string;
  lateThreshold: number;
  minAttendance: number;
  flaskApiUrl: string;
  confidenceThreshold: number;
  emailAlerts: boolean;
  lowAttendanceAlert: boolean;
  dailyReport: boolean;
}

const LS_KEY = "ams_settings";

function loadDefaults(): SettingsState {
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) return JSON.parse(saved) as SettingsState;
  } catch {}
  return {
    institutionName: "Sunrise University",
    academicYear: "2025-2026",
    semesterStart: "2026-01-06",
    semesterEnd: "2026-05-30",
    lateThreshold: 15,
    minAttendance: 75,
    flaskApiUrl: "http://localhost:5001",
    confidenceThreshold: 70,
    emailAlerts: true,
    lowAttendanceAlert: true,
    dailyReport: false,
  };
}

interface SectionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}

function SectionCard({ icon, title, description, children }: SectionCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="text-[0.9375rem] text-slate-900 font-semibold">{title}</h3>
          <p className="text-[0.8125rem] text-slate-500">{description}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

interface FieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

function Field({ label, hint, children }: FieldProps) {
  return (
    <div className="grid sm:grid-cols-3 gap-3 items-start">
      <div className="sm:col-span-1">
        <label className="text-[0.8125rem] font-medium text-slate-700">{label}</label>
        {hint && <p className="text-[0.75rem] text-slate-400 mt-0.5">{hint}</p>}
      </div>
      <div className="sm:col-span-2">{children}</div>
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[0.8125rem] text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-colors";

export function AdminSettings() {
  const [form, setForm] = useState<SettingsState>(loadDefaults);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
    setError("");
  }

  function handleSave() {
    // Basic validation
    if (!form.institutionName.trim()) {
      setError("Institution name cannot be empty.");
      return;
    }
    if (!form.flaskApiUrl.startsWith("http")) {
      setError("Flask API URL must start with http:// or https://");
      return;
    }
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(form));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Failed to save settings.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2
            className="text-[1.25rem] text-slate-900"
            style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
          >
            System Settings
          </h2>
          <p className="text-[0.8125rem] text-slate-500">
            Configure institution preferences, attendance rules, and integrations.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-[0.875rem] font-medium hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>

      {/* Save feedback */}
      {saved && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-[0.8125rem]">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Settings saved successfully.
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[0.8125rem]">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── General ─────────────────────────────────── */}
      <SectionCard
        icon={<Building2 className="w-5 h-5" />}
        title="General"
        description="Basic institution and academic year information."
      >
        <Field label="Institution Name">
          <input
            id="setting-institution-name"
            type="text"
            value={form.institutionName}
            onChange={(e) => update("institutionName", e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Academic Year" hint="e.g. 2025-2026">
          <input
            id="setting-academic-year"
            type="text"
            value={form.academicYear}
            onChange={(e) => update("academicYear", e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Semester Start">
          <input
            id="setting-semester-start"
            type="date"
            value={form.semesterStart}
            onChange={(e) => update("semesterStart", e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Semester End">
          <input
            id="setting-semester-end"
            type="date"
            value={form.semesterEnd}
            onChange={(e) => update("semesterEnd", e.target.value)}
            className={inputCls}
          />
        </Field>
      </SectionCard>

      {/* ── Attendance Rules ─────────────────────────── */}
      <SectionCard
        icon={<CalendarRange className="w-5 h-5" />}
        title="Attendance Rules"
        description="Define thresholds that determine late check-ins and low-attendance warnings."
      >
        <Field label="Late Threshold (minutes)" hint="Check-ins after this many minutes are marked Late.">
          <div className="flex items-center gap-4">
            <input
              id="setting-late-threshold"
              type="range"
              min={5}
              max={60}
              step={5}
              value={form.lateThreshold}
              onChange={(e) => update("lateThreshold", Number(e.target.value))}
              className="flex-1 accent-indigo-600"
            />
            <span className="w-12 text-right text-[0.875rem] font-semibold text-indigo-700">
              {form.lateThreshold} min
            </span>
          </div>
        </Field>
        <Field
          label="Minimum Attendance %"
          hint="Students below this level receive a warning banner."
        >
          <div className="flex items-center gap-4">
            <input
              id="setting-min-attendance"
              type="range"
              min={50}
              max={100}
              step={5}
              value={form.minAttendance}
              onChange={(e) => update("minAttendance", Number(e.target.value))}
              className="flex-1 accent-indigo-600"
            />
            <span className="w-12 text-right text-[0.875rem] font-semibold text-indigo-700">
              {form.minAttendance}%
            </span>
          </div>
        </Field>
      </SectionCard>

      {/* ── Face Engine ──────────────────────────────── */}
      <SectionCard
        icon={<Camera className="w-5 h-5" />}
        title="Face Engine"
        description="Configure the Flask API endpoint and recognition confidence threshold."
      >
        <Field label="Flask API URL" hint="Base URL of the running Python face engine.">
          <input
            id="setting-flask-url"
            type="url"
            value={form.flaskApiUrl}
            onChange={(e) => update("flaskApiUrl", e.target.value)}
            className={inputCls}
            placeholder="http://localhost:5001"
          />
        </Field>
        <Field
          label="Confidence Threshold (%)"
          hint="Recognitions below this score will be rejected."
        >
          <div className="flex items-center gap-4">
            <input
              id="setting-confidence-threshold"
              type="range"
              min={50}
              max={99}
              step={1}
              value={form.confidenceThreshold}
              onChange={(e) => update("confidenceThreshold", Number(e.target.value))}
              className="flex-1 accent-indigo-600"
            />
            <span className="w-12 text-right text-[0.875rem] font-semibold text-indigo-700">
              {form.confidenceThreshold}%
            </span>
          </div>
        </Field>
        <div className="mt-2">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.75rem] font-medium ${
              form.confidenceThreshold >= 80
                ? "bg-emerald-50 text-emerald-700"
                : form.confidenceThreshold >= 65
                ? "bg-amber-50 text-amber-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {form.confidenceThreshold >= 80
              ? "High security"
              : form.confidenceThreshold >= 65
              ? "Moderate security"
              : "Low security — increase threshold"}
          </div>
        </div>
      </SectionCard>

      {/* ── Notifications ────────────────────────────── */}
      <SectionCard
        icon={<Bell className="w-5 h-5" />}
        title="Notifications"
        description="Control automated email alerts sent to students and administrators."
      >
        {(
          [
            {
              key: "emailAlerts" as const,
              label: "Enable Email Alerts",
              hint: "Master toggle — disabling this suppresses all emails.",
            },
            {
              key: "lowAttendanceAlert" as const,
              label: "Low Attendance Warnings",
              hint: "Email students when their attendance falls below the minimum threshold.",
            },
            {
              key: "dailyReport" as const,
              label: "Daily Summary Report",
              hint: "Send admins a daily attendance digest every evening.",
            },
          ] as const
        ).map(({ key, label, hint }) => (
          <div key={key} className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[0.8125rem] font-medium text-slate-700">{label}</p>
              <p className="text-[0.75rem] text-slate-400">{hint}</p>
            </div>
            <button
              id={`setting-toggle-${key}`}
              role="switch"
              aria-checked={form[key]}
              onClick={() => update(key, !form[key])}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
                form[key] ? "bg-indigo-600" : "bg-slate-200"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                  form[key] ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        ))}
      </SectionCard>

      {/* Bottom save bar */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-[0.875rem] font-medium hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Save className="w-4 h-4" />
          Save Settings
        </button>
      </div>
    </div>
  );
}
