import React, { useState } from "react";
import { Link } from "react-router";
import {
  Sun, Eye, EyeOff, ArrowRight, CheckCircle2, User,
  AlertCircle, BadgeInfo, BookOpen, Phone,
} from "lucide-react";
import { backendRegisterSelf } from "@/app/lib/backendApi";

interface FormData {
  full_name: string;
  sbrn: string;
  email: string;
  password: string;
  confirm_password: string;
  branch: string;
  semester: string;
  session: string;
  phone: string;
}

interface FieldErrors {
  full_name?: string;
  sbrn?: string;
  email?: string;
  password?: string;
  confirm_password?: string;
  branch?: string;
  semester?: string;
  session?: string;
  phone?: string;
}

const BRANCHES = [
  "Computer Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Electronics & Communication Engineering",
];

const SEMESTERS = ["1", "2", "3", "4", "5", "6"];

// Generate session options: last 4 years, each with a 3-year span (typical BE duration)
function generateSessions(): string[] {
  const currentYear = new Date().getFullYear();
  const sessions: string[] = [];
  for (let start = currentYear - 3; start <= currentYear + 1; start++) {
    sessions.push(`${start} - ${start + 3}`);
  }
  return sessions;
}
const SESSIONS = generateSessions();

function validateForm(data: FormData): FieldErrors {
  const errors: FieldErrors = {};

  if (!data.full_name.trim() || data.full_name.trim().length < 3)
    errors.full_name = "Full name must be at least 3 characters.";

  if (!data.sbrn.trim() || data.sbrn.trim().length < 2)
    errors.sbrn = "Student Board Roll Number is required.";
  else if (!/^[A-Za-z0-9\-_]+$/.test(data.sbrn.trim()))
    errors.sbrn = "Only letters, numbers, hyphens and underscores are allowed.";

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    errors.email = "Please enter a valid email address.";

  if (!data.password || data.password.length < 6)
    errors.password = "Password must be at least 6 characters.";

  if (!data.confirm_password)
    errors.confirm_password = "Please confirm your password.";
  else if (data.password !== data.confirm_password)
    errors.confirm_password = "Passwords do not match.";

  if (!data.branch.trim())
    errors.branch = "Please select your branch.";

  const sem = Number(data.semester);
  if (!data.semester || isNaN(sem) || sem < 1 || sem > 6)
    errors.semester = "Please select a valid semester (1–6).";

  if (!data.session.trim())
    errors.session = "Please select your academic session.";

  if (data.phone && data.phone.trim().length > 0) {
    const cleaned = data.phone.replace(/[\s\-]/g, "");
    if (!/^[6-9]\d{9}$/.test(cleaned))
      errors.phone = "Enter a valid 10-digit Indian mobile number.";
  }

  return errors;
}

export function RegistrationPage() {
  const [form, setForm] = useState<FormData>({
    full_name: "",
    sbrn: "",
    email: "",
    password: "",
    confirm_password: "",
    branch: "",
    semester: "",
    session: "",
    phone: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [registeredSbrn, setRegisteredSbrn] = useState("");

  const update =
    (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
      if (error) setError("");
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await backendRegisterSelf({
        full_name: form.full_name.trim(),
        sbrn: form.sbrn.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        confirm_password: form.confirm_password,
        branch: form.branch.trim(),
        semester: Number(form.semester),
        session: form.session.trim(),
        phone: form.phone.trim() || undefined,
      });
      setRegisteredSbrn(form.sbrn.trim().toUpperCase());
      setSuccess(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Registration failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ── Success State ─────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex">
        <LeftPanel />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-[1.75rem] text-slate-900 mb-3" style={{ fontWeight: 700 }}>
              Registration Submitted!
            </h1>
            <p className="text-slate-500 text-[0.9375rem] mb-6 leading-relaxed">
              Your account is{" "}
              <span className="text-amber-600 font-semibold">pending admin approval</span>.
              You'll be able to sign in once an administrator reviews your request.
            </p>

            {/* SBRN callout */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6 text-left">
              <p className="text-[0.8125rem] text-blue-700 font-semibold mb-1 flex items-center gap-1.5">
                <BadgeInfo className="w-4 h-4" />
                Your Login ID (Student Board Roll No)
              </p>
              <p className="text-[1.5rem] text-blue-900 font-bold tracking-wider font-mono">
                {registeredSbrn}
              </p>
              <p className="text-[0.75rem] text-blue-600 mt-1">
                Use this SBRN to sign in after your account is approved.
              </p>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl mb-8">
              <div className="flex items-start gap-3 text-left">
                <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[0.8125rem] text-amber-800 font-medium mb-1">What happens next?</p>
                  <ul className="text-[0.8125rem] text-amber-700 space-y-1">
                    <li>• An admin will review your registration request</li>
                    <li>• Once approved, sign in using your SBRN + password</li>
                    <li>• Admin will complete your face enrollment in person</li>
                    <li>• After face enrollment you can attend classes via camera</li>
                  </ul>
                </div>
              </div>
            </div>

            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-[0.9375rem] font-semibold"
            >
              Back to Sign In
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Form State ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <LeftPanel />

      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
              <Sun className="w-5 h-5 text-white" />
            </div>
            <span className="text-[1.125rem] text-slate-900 font-bold">AMS-FaceRec</span>
          </div>

          <h1 className="text-[1.75rem] text-slate-900 mb-1" style={{ fontWeight: 700 }}>
            Create your account
          </h1>
          <p className="text-slate-500 text-[0.875rem] mb-2">
            Register as a student. Admin approval is required before you can sign in.
          </p>

          {/* Role chip */}
          <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 mb-6">
            <User className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[0.75rem] text-blue-700 font-semibold">Student Registration</span>
          </div>

          {/* Server Error */}
          {error && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-[0.8125rem] text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* ── Section: Personal Info ── */}
            <SectionLabel icon={<User className="w-3.5 h-3.5" />} label="Personal Information" />

            {/* Full Name */}
            <Field label="Full name" error={fieldErrors.full_name}>
              <input
                id="reg-full-name"
                type="text"
                value={form.full_name}
                onChange={update("full_name")}
                placeholder="e.g. Rahul Kumar Sharma"
                autoComplete="name"
                className={inputCls(fieldErrors.full_name)}
              />
            </Field>

            {/* SBRN */}
            <Field
              label="Student Board Roll Number (SBRN)"
              hint="This will be your login ID — keep it handy."
              error={fieldErrors.sbrn}
            >
              <input
                id="reg-sbrn"
                type="text"
                value={form.sbrn}
                onChange={update("sbrn")}
                placeholder="e.g. 2024CS001 or STU-001"
                autoComplete="off"
                spellCheck={false}
                className={`${inputCls(fieldErrors.sbrn)} font-mono tracking-wider uppercase`}
              />
            </Field>

            {/* Email */}
            <Field label="Email address" error={fieldErrors.email}>
              <input
                id="reg-email"
                type="email"
                value={form.email}
                onChange={update("email")}
                placeholder="you@institution.edu.in"
                autoComplete="email"
                className={inputCls(fieldErrors.email)}
              />
            </Field>

            {/* Phone */}
            <Field label="Mobile number (optional)" error={fieldErrors.phone}>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="reg-phone"
                  type="tel"
                  value={form.phone}
                  onChange={update("phone")}
                  placeholder="10-digit Indian mobile (e.g. 9876543210)"
                  autoComplete="tel"
                  maxLength={10}
                  className={`${inputCls(fieldErrors.phone)} pl-9`}
                />
              </div>
            </Field>

            {/* Password */}
            <Field label="Password" error={fieldErrors.password}>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={update("password")}
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                  className={`${inputCls(fieldErrors.password)} pr-12`}
                />
                <ToggleEye show={showPassword} onToggle={() => setShowPassword(!showPassword)} />
              </div>
            </Field>

            {/* Confirm Password */}
            <Field label="Confirm password" error={fieldErrors.confirm_password}>
              <div className="relative">
                <input
                  id="reg-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirm_password}
                  onChange={update("confirm_password")}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  className={`${inputCls(fieldErrors.confirm_password)} pr-12`}
                />
                <ToggleEye
                  show={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              </div>
            </Field>

            {/* ── Section: Academic Info ── */}
            <SectionLabel icon={<BookOpen className="w-3.5 h-3.5" />} label="Academic Information" />


            {/* Branch */}
            <Field label="Branch" error={fieldErrors.branch}>
              <select
                id="reg-branch"
                value={form.branch}
                onChange={update("branch")}
                className={selectCls(fieldErrors.branch)}
              >
                <option value="">Select your branch…</option>
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </Field>

            {/* Semester + Session (2 columns) */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Semester" error={fieldErrors.semester}>
                <select
                  id="reg-semester"
                  value={form.semester}
                  onChange={update("semester")}
                  className={selectCls(fieldErrors.semester)}
                >
                  <option value="">Select…</option>
                  {SEMESTERS.map((s) => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </Field>

              <Field label="Academic Session" error={fieldErrors.session}>
                <select
                  id="reg-session"
                  value={form.session}
                  onChange={update("session")}
                  className={selectCls(fieldErrors.session)}
                >
                  <option value="">e.g. 2023 - 2026</option>
                  {SESSIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="reg-submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm text-[0.9375rem] font-semibold disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <Spinner />
                  Submitting…
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[0.8125rem] text-slate-500 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function inputCls(error?: string) {
  return [
    "w-full px-4 py-3 bg-white border rounded-xl text-[0.875rem]",
    "placeholder:text-slate-400 focus:outline-none focus:ring-2",
    "focus:ring-blue-500/20 focus:border-blue-400 transition",
    error ? "border-red-300 bg-red-50/30" : "border-slate-200",
  ].join(" ");
}

function selectCls(error?: string) {
  return [
    "w-full px-4 py-3 bg-white border rounded-xl text-[0.875rem]",
    "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition",
    "appearance-none cursor-pointer",
    error ? "border-red-300 bg-red-50/30 text-slate-400" : "border-slate-200 text-slate-800",
  ].join(" ");
}

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <div className="text-blue-500">{icon}</div>
      <span className="text-[0.75rem] font-semibold text-blue-600 uppercase tracking-wide">
        {label}
      </span>
      <div className="flex-1 h-px bg-blue-100" />
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[0.8125rem] text-slate-700 font-medium mb-1.5">
        {label}
      </label>
      {hint && <p className="text-[0.75rem] text-slate-400 mb-1.5">{hint}</p>}
      {children}
      {error && <p className="mt-1.5 text-[0.75rem] text-red-600">{error}</p>}
    </div>
  );
}

function ToggleEye({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
      aria-label={show ? "Hide password" : "Show password"}
    >
      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ── Left Branding Panel ───────────────────────────────────────────────────────
function LeftPanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 p-12 flex-col justify-between relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(6,182,212,0.25),transparent_60%)]" />
      <div className="relative z-10">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
            <Sun className="w-5 h-5 text-white" />
          </div>
          <span className="text-[1.25rem] text-white font-bold">AMS-FaceRec</span>
        </Link>
      </div>
      <div className="relative z-10 space-y-6">
        <h2 className="text-[2.5rem] text-white leading-tight font-bold">
          Join your institution's attendance system
        </h2>
        <p className="text-blue-200 text-[1.0625rem] max-w-md leading-relaxed">
          Register with your Student Board Roll Number. After admin approval, your face will
          be enrolled for automatic attendance recognition.
        </p>
        <div className="space-y-3 pt-2">
          {[
            { title: "Your SBRN is your login ID", desc: "Use it every time you sign in after approval." },
            { title: "Admin-controlled face enrollment", desc: "Your identity is verified in-person before biometric setup." },
            { title: "Automatic attendance marking", desc: "Just walk in front of the camera — attendance is logged instantly." },
          ].map((feat, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-blue-100 text-[0.9375rem] font-medium">{feat.title}</p>
                <p className="text-blue-300 text-[0.8125rem]">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="relative z-10 text-[0.8125rem] text-blue-300">&copy; 2026 AMS-FaceRec · Government Institute</div>
    </div>
  );
}