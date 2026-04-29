import React, { useState, useEffect } from "react";
import {
  User, Mail, BookOpen, Camera, CheckCircle2, XCircle,
  Key, Upload, Loader2, AlertCircle, Save,
} from "lucide-react";
import { supabase } from "../../../utils/supabase/client";
import {
  getCourses,
  getWeeklyAttendanceAnalysis,
  type Course,
  type WeeklyAttendanceSummary,
} from "../lib/api";
import { WeeklyAttendanceTable } from "../components/shared/WeeklyAttendanceTable";

interface ProfileState {
  name: string;
  studentId: string;
  email: string;
  faceEnrolled: boolean;
  courses: Course[];
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white text-[1.5rem] font-bold select-none">
      {initials}
    </div>
  );
}

export function StudentProfile() {
  const [profile, setProfile] = useState<ProfileState | null>(null);
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [weeklyAnalysis, setWeeklyAnalysis] = useState<WeeklyAttendanceSummary[]>([]);
  const [weeklyLoading, setWeeklyLoading] = useState(true);
  const [weeklyError, setWeeklyError] = useState<string | null>(null);

  // Change password form
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const [enrollReqSent, setEnrollReqSent] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setWeeklyLoading(false);
          setLoading(false);
          return;
        }
        const meta = session.user.user_metadata || {};
        const studentId = meta.student_id || meta.student_id_text || "STU-000";
        const email = session.user.email || "";
        setProfile({
          name: meta.name || meta.full_name || session.user.email?.split("@")[0] || "Student",
          studentId,
          email,
          faceEnrolled: meta.face_enrolled ?? false,
          courses: [],
        });

        getWeeklyAttendanceAnalysis({
          scope: "student",
          studentEmail: email,
          studentIdText: studentId,
        })
          .then(setWeeklyAnalysis)
          .catch((err) => {
            console.error("Student weekly attendance error:", err);
            setWeeklyError("Could not load your weekly attendance analysis.");
          })
          .finally(() => setWeeklyLoading(false));
      } catch (err) {
        console.error("Profile load error:", err);
        setWeeklyError("Could not load your weekly attendance analysis.");
        setWeeklyLoading(false);
      } finally {
        setLoading(false);
      }
    }
    load();

    getCourses()
      .then((data) =>
        setProfile((prev) =>
          prev ? { ...prev, courses: data.filter((c) => c.status === "active").slice(0, 4) } : prev
        )
      )
      .catch(console.error)
      .finally(() => setCoursesLoading(false));
  }, []);

  async function changePassword() {
    setPwError("");
    setPwSuccess(false);
    if (!pwForm.next || !pwForm.confirm) { setPwError("Please fill in all fields."); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError("Passwords do not match."); return; }
    if (pwForm.next.length < 8) { setPwError("Password must be at least 8 characters."); return; }

    setPwLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwForm.next });
      if (error) throw error;
      setPwSuccess(true);
      setPwForm({ current: "", next: "", confirm: "" });
    } catch (err: any) {
      setPwError(err.message || "Failed to update password.");
    } finally {
      setPwLoading(false);
    }
  }

  const inputCls =
    "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[0.8125rem] text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-colors";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
        <AlertCircle className="w-5 h-5" />
        <span className="text-[0.875rem]">Could not load profile. Please sign in again.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2
          className="text-[1.25rem] text-slate-900"
          style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
        >
          My Profile
        </h2>
        <p className="text-[0.8125rem] text-slate-500">
          Manage your personal information, face enrollment, and account security.
        </p>
      </div>

      {/* Identity card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start gap-5">
          <Avatar name={profile.name} />
          <div className="flex-1 min-w-0">
            <h3 className="text-[1.125rem] font-semibold text-slate-900">{profile.name}</h3>
            <p className="text-[0.8125rem] text-slate-400 font-mono">{profile.studentId}</p>
            <div className="flex flex-wrap gap-4 mt-2 text-[0.8125rem] text-slate-500">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> {profile.email}
              </span>
            </div>
          </div>
          {/* Photo upload placeholder */}
          <label
            htmlFor="profile-photo-upload"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-[0.8125rem] hover:bg-slate-100 cursor-pointer border border-slate-200 transition-colors flex-shrink-0"
            title="Upload profile photo"
          >
            <Upload className="w-3.5 h-3.5" /> Photo
          </label>
          <input id="profile-photo-upload" type="file" accept="image/*" className="sr-only" />
        </div>

        {/* Info grid */}
        <div className="grid sm:grid-cols-2 gap-4 mt-5 pt-5 border-t border-slate-100">
          {[
            { icon: <User className="w-4 h-4" />, label: "Full Name", value: profile.name },
            { icon: <Mail className="w-4 h-4" />, label: "Email",     value: profile.email },
            { icon: <BookOpen className="w-4 h-4" />, label: "Student ID", value: profile.studentId },
            { icon: <BookOpen className="w-4 h-4" />, label: "Enrolled Courses", value: `${profile.courses.length} active` },
          ].map(({ icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0">
                {icon}
              </div>
              <div>
                <p className="text-[0.75rem] text-slate-400">{label}</p>
                <p className="text-[0.875rem] font-medium text-slate-800">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enrolled courses */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-[0.9375rem] text-slate-900 font-semibold mb-4">Enrolled Courses</h3>
        {coursesLoading ? (
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-[0.8125rem]">Loading…</span>
          </div>
        ) : profile.courses.length === 0 ? (
          <p className="text-[0.8125rem] text-slate-400">No active courses found.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {profile.courses.map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[0.8125rem] font-semibold text-indigo-600">{c.code}</p>
                  <p className="text-[0.75rem] text-slate-500 truncate">{c.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Face enrollment */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-[0.9375rem] text-slate-900 font-semibold mb-4">Face Enrollment</h3>
        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[0.875rem] font-medium ${
              profile.faceEnrolled
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            {profile.faceEnrolled ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            {profile.faceEnrolled ? "Face Enrolled ✓" : "Not enrolled"}
          </div>
          {!profile.faceEnrolled && !enrollReqSent && (
            <button
              onClick={() => setEnrollReqSent(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-[0.875rem] font-medium hover:bg-indigo-700 transition-colors"
            >
              <Camera className="w-4 h-4" /> Request Enrollment
            </button>
          )}
          {enrollReqSent && (
            <span className="text-[0.8125rem] text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Request sent to admin.
            </span>
          )}
        </div>
        {!profile.faceEnrolled && (
          <p className="mt-3 text-[0.75rem] text-slate-400">
            Your face is not yet enrolled. Request enrollment from the admin to use face-based
            attendance check-in.
          </p>
        )}
      </div>

      <WeeklyAttendanceTable
        title="My Weekly Attendance Analysis"
        description="Your current-month attendance summary by week."
        data={weeklyAnalysis}
        loading={weeklyLoading}
        error={weeklyError}
        emptyMessage="No attendance records found for your profile in the current month."
      />

      {/* Change password */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-[0.9375rem] text-slate-900 font-semibold mb-4 flex items-center gap-2">
          <Key className="w-4 h-4 text-slate-400" /> Change Password
        </h3>
        <div className="space-y-3 max-w-md">
          {pwSuccess && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-[0.8125rem]">
              <CheckCircle2 className="w-4 h-4" /> Password updated successfully.
            </div>
          )}
          {pwError && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[0.8125rem]">
              <AlertCircle className="w-4 h-4" /> {pwError}
            </div>
          )}
          <input
            id="profile-pw-current"
            type="password"
            placeholder="Current password"
            value={pwForm.current}
            onChange={(e) => setPwForm((p) => ({ ...p, current: e.target.value }))}
            className={inputCls}
            autoComplete="current-password"
          />
          <input
            id="profile-pw-new"
            type="password"
            placeholder="New password (min 8 chars)"
            value={pwForm.next}
            onChange={(e) => setPwForm((p) => ({ ...p, next: e.target.value }))}
            className={inputCls}
            autoComplete="new-password"
          />
          <input
            id="profile-pw-confirm"
            type="password"
            placeholder="Confirm new password"
            value={pwForm.confirm}
            onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
            className={inputCls}
            autoComplete="new-password"
          />
          <button
            onClick={changePassword}
            disabled={pwLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-[0.875rem] font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {pwLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
}
