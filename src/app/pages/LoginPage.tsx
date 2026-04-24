import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Sun, Eye, EyeOff, ArrowRight, ShieldCheck, GraduationCap, User } from "lucide-react";
import { supabase } from "../../../utils/supabase/supabase";

const demoCredentials = {
  admin: { email: "admin@sunnyattend.com", password: "admin123" },
  teacher: { email: "dr.smith@sunnyattend.com", password: "teacher123" },
  student: { email: "sarah.j@sunnyattend.com", password: "student123" },
};

const roleIcons = {
  admin: <ShieldCheck className="w-4 h-4" />,
  teacher: <GraduationCap className="w-4 h-4" />,
  student: <User className="w-4 h-4" />,
};

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(demoCredentials.admin.email);
  const [password, setPassword] = useState(demoCredentials.admin.password);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"admin" | "teacher" | "student">("admin");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRoleSwitch = (r: "admin" | "teacher" | "student") => {
    setRole(r);
    setEmail(demoCredentials[r].email);
    setPassword(demoCredentials[r].password);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (data.session) {
        // Assume role is stored in user metadata, if not default to student
        const userRole = data.session.user.user_metadata?.role || role;
        navigate(`/${userRole}`);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(6,182,212,0.25),transparent_60%)]" />
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
              <Sun className="w-5 h-5 text-white" />
            </div>
            <span className="text-[1.25rem] text-white" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}>SunnyAttend</span>
          </Link>
        </div>
        <div className="relative z-10 space-y-6">
          <h2 className="text-[2.5rem] text-white leading-tight" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}>
            Welcome back to smarter attendance
          </h2>
          <p className="text-indigo-200 text-[1.0625rem] max-w-md leading-relaxed">
            Sign in to access your dashboard, manage classes, and track attendance with AI-powered face recognition.
          </p>
          <div className="flex gap-6 pt-4">
            {[
              { val: "2,500+", label: "Institutions" },
              { val: "150K+", label: "Students" },
              { val: "99.2%", label: "Uptime" },
            ].map((s, i) => (
              <div key={i}>
                <p className="text-[1.5rem] text-white" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}>{s.val}</p>
                <p className="text-[0.8125rem] text-indigo-300">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-[0.8125rem] text-indigo-300">&copy; 2026 SunnyAttend</div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-cyan-500 rounded-lg flex items-center justify-center">
              <Sun className="w-5 h-5 text-white" />
            </div>
            <span className="text-[1.125rem] text-slate-900" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}>SunnyAttend</span>
          </div>

          <h1 className="text-[1.75rem] text-slate-900 mb-2" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}>Sign in to your account</h1>
          <p className="text-slate-500 text-[0.9375rem] mb-8">Enter your credentials to access your dashboard</p>

          {/* Role Selector */}
          <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
            {(["admin", "teacher", "student"] as const).map((r) => (
              <button
                key={r}
                onClick={() => handleRoleSwitch(r)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[0.8125rem] capitalize transition-all ${
                  role === r
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
                style={{ fontWeight: role === r ? 600 : 400 }}
              >
                {roleIcons[r]}
                {r}
              </button>
            ))}
          </div>

          {/* Demo Credentials Card */}
          <div className="mb-6 p-3.5 bg-indigo-50 border border-indigo-100 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 bg-indigo-100 rounded flex items-center justify-center">
                <ShieldCheck className="w-3 h-3 text-indigo-600" />
              </div>
              <span className="text-[0.75rem] text-indigo-700" style={{ fontWeight: 600 }}>Demo Credentials</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[0.75rem] text-indigo-500">Email:</span>
                <button
                  type="button"
                  onClick={() => { setEmail(demoCredentials[role].email); }}
                  className="text-[0.75rem] text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded hover:bg-indigo-200 transition-colors font-mono"
                >
                  {demoCredentials[role].email}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[0.75rem] text-indigo-500">Password:</span>
                <button
                  type="button"
                  onClick={() => { setPassword(demoCredentials[role].password); }}
                  className="text-[0.75rem] text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded hover:bg-indigo-200 transition-colors font-mono"
                >
                  {demoCredentials[role].password}
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-[0.8125rem] text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[0.8125rem] text-slate-700 mb-1.5" style={{ fontWeight: 500 }}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={`${role}@sunnyattend.com`}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[0.875rem] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition"
              />
            </div>
            <div>
              <label className="block text-[0.8125rem] text-slate-700 mb-1.5" style={{ fontWeight: 500 }}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[0.875rem] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-[0.8125rem] text-slate-600">Remember me</span>
              </label>
              <a href="#" className="text-[0.8125rem] text-indigo-600 hover:text-indigo-700" style={{ fontWeight: 500 }}>Forgot password?</a>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm text-[0.9375rem] disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ fontWeight: 600 }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[0.8125rem] text-slate-500 mt-8">
            Don't have an account?{" "}
            <a href="#" className="text-indigo-600 hover:text-indigo-700" style={{ fontWeight: 500 }}>Contact your admin</a>
          </p>
        </div>
      </div>
    </div>
  );
}