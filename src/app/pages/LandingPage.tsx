import React from "react";
import { Link } from "react-router";
import { Sun, Camera, Shield, BarChart3, Clock, Users, ChevronRight, Github, Mail, ArrowRight, Zap, Globe } from "lucide-react";

const features = [
  { icon: <Camera className="w-6 h-6" />, title: "Real-Time Face Recognition", desc: "AI-powered facial detection marks attendance instantly as students enter the classroom." },
  { icon: <Shield className="w-6 h-6" />, title: "Anti-Spoofing Protection", desc: "Advanced liveness detection prevents photo or video-based proxy attendance." },
  { icon: <BarChart3 className="w-6 h-6" />, title: "Analytics Dashboard", desc: "Comprehensive reports with trends, patterns, and exportable data for all stakeholders." },
  { icon: <Clock className="w-6 h-6" />, title: "Instant Processing", desc: "Sub-second recognition speed ensures zero disruption to class schedules." },
  { icon: <Users className="w-6 h-6" />, title: "Multi-Role Access", desc: "Tailored dashboards for admins, teachers, and students with role-based permissions." },
  { icon: <Globe className="w-6 h-6" />, title: "Cloud-First Architecture", desc: "Access from anywhere with secure cloud storage and real-time synchronization." },
];

const steps = [
  { num: "01", title: "Register & Enroll", desc: "Admin registers students and captures facial data through the secure enrollment portal." },
  { num: "02", title: "Attend Class", desc: "Students simply walk into the classroom. The camera captures and recognizes faces automatically." },
  { num: "03", title: "Track & Report", desc: "Attendance data flows to dashboards in real-time. Export reports anytime in CSV or PDF." },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-cyan-500 rounded-lg flex items-center justify-center">
              <Sun className="w-5 h-5 text-white" />
            </div>
            <span className="text-[1.125rem] text-slate-900" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}>SunnyAttend</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-[0.875rem] text-slate-600 hover:text-indigo-600 transition-colors">Features</a>
            <a href="#how-it-works" className="text-[0.875rem] text-slate-600 hover:text-indigo-600 transition-colors">How It Works</a>
            <a href="#about" className="text-[0.875rem] text-slate-600 hover:text-indigo-600 transition-colors">About</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="px-4 py-2 text-[0.875rem] text-slate-700 hover:text-indigo-600 transition-colors">Log In</Link>
            <Link to="/login" className="px-5 py-2.5 bg-indigo-600 text-white text-[0.875rem] rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-[0.8125rem]">
                <Zap className="w-3.5 h-3.5" />
                <span>AI-Powered Attendance System</span>
              </div>
              <h1 className="text-[3rem] lg:text-[3.5rem] text-slate-900 tracking-tight leading-[1.1]" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 800 }}>
                Attendance Made{" "}
                <span className="bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                  Effortless
                </span>
                {" "}with Face Recognition
              </h1>
              <p className="text-[1.125rem] text-slate-500 leading-relaxed max-w-lg">
                Eliminate manual roll calls. SunnyAttend uses advanced AI to recognize faces in real-time, 
                providing accurate, tamper-proof attendance tracking for educational institutions.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                  <span className="text-[0.9375rem]">Start Free Trial</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 px-7 py-3.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all"
                >
                  <span className="text-[0.9375rem]">Watch Demo</span>
                </a>
              </div>
              <div className="flex items-center gap-6 pt-2">
                <div className="flex -space-x-2">
                  {["bg-indigo-400", "bg-cyan-400", "bg-emerald-400", "bg-amber-400"].map((bg, i) => (
                    <div key={i} className={`w-8 h-8 rounded-full ${bg} border-2 border-white`} />
                  ))}
                </div>
                <p className="text-[0.8125rem] text-slate-500">
                  <span className="text-slate-800" style={{ fontWeight: 600 }}>2,500+</span> institutions trust SunnyAttend
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-indigo-100 to-cyan-100 rounded-3xl blur-3xl opacity-40" />
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-gradient-to-br from-indigo-600 via-indigo-700 to-cyan-600 h-[400px] flex items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(6,182,212,0.3),transparent_60%)]" />
                <div className="relative z-10 text-center p-8">
                  <div className="w-20 h-20 bg-white/15 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <Camera className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-white text-[1.25rem] mb-2" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}>AI-Powered Recognition</h3>
                  <p className="text-indigo-200 text-[0.875rem] max-w-xs mx-auto">Real-time face detection and attendance marking in under a second</p>
                </div>
                {/* Overlay cards */}
                <div className="absolute bottom-4 left-4 right-4 flex gap-3">
                  <div className="bg-white/90 backdrop-blur-md rounded-xl px-4 py-3 shadow-lg flex-1">
                    <p className="text-[0.6875rem] text-slate-500">Recognized</p>
                    <p className="text-[1.25rem] text-indigo-600" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}>98.7%</p>
                    <p className="text-[0.6875rem] text-slate-400">Accuracy Rate</p>
                  </div>
                  <div className="bg-white/90 backdrop-blur-md rounded-xl px-4 py-3 shadow-lg flex-1">
                    <p className="text-[0.6875rem] text-slate-500">Processing</p>
                    <p className="text-[1.25rem] text-cyan-600" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}>&lt;0.3s</p>
                    <p className="text-[0.6875rem] text-slate-400">Per Face</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-[0.8125rem] text-indigo-600 mb-2" style={{ fontWeight: 600 }}>FEATURES</p>
            <h2 className="text-[2.25rem] text-slate-900 tracking-tight" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}>
              Everything you need for modern attendance
            </h2>
            <p className="text-slate-500 mt-4">
              Built for educational institutions that demand accuracy, security, and ease of use.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-indigo-200 transition-all group">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-[1.0625rem] text-slate-900 mb-2" style={{ fontWeight: 600 }}>{f.title}</h3>
                <p className="text-[0.875rem] text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-[0.8125rem] text-cyan-600 mb-2" style={{ fontWeight: 600 }}>HOW IT WORKS</p>
            <h2 className="text-[2.25rem] text-slate-900 tracking-tight" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}>
              Three simple steps to automated attendance
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={i} className="relative">
                <div className="text-[4rem] text-indigo-100 mb-2" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 800 }}>{s.num}</div>
                <h3 className="text-[1.125rem] text-slate-900 mb-3" style={{ fontWeight: 600 }}>{s.title}</h3>
                <p className="text-[0.875rem] text-slate-500 leading-relaxed">{s.desc}</p>
                {i < 2 && (
                  <ChevronRight className="hidden md:block absolute top-12 -right-6 w-8 h-8 text-indigo-200" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(6,182,212,0.3),transparent_50%)]" />
          <div className="relative z-10">
            <h2 className="text-[2rem] text-white mb-4" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}>
              Ready to modernize attendance?
            </h2>
            <p className="text-indigo-200 mb-8 max-w-lg mx-auto">
              Join thousands of institutions already using SunnyAttend to save time and improve accuracy.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-700 rounded-xl hover:bg-indigo-50 transition-colors shadow-xl"
            >
              <span style={{ fontWeight: 600 }}>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="bg-slate-900 text-slate-400 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-cyan-400 rounded-lg flex items-center justify-center">
                  <Sun className="w-5 h-5 text-white" />
                </div>
                <span className="text-[1.125rem] text-white" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}>SunnyAttend</span>
              </div>
              <p className="text-[0.875rem] leading-relaxed max-w-sm">
                AI-powered face recognition attendance management system designed for modern educational institutions.
              </p>
            </div>
            <div>
              <h4 className="text-white text-[0.875rem] mb-4" style={{ fontWeight: 600 }}>Product</h4>
              <ul className="space-y-2.5 text-[0.8125rem]">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-[0.875rem] mb-4" style={{ fontWeight: 600 }}>Connect</h4>
              <ul className="space-y-2.5 text-[0.8125rem]">
                <li><a href="#" className="hover:text-white transition-colors flex items-center gap-2"><Github className="w-4 h-4" /> GitHub</a></li>
                <li><a href="#" className="hover:text-white transition-colors flex items-center gap-2"><Mail className="w-4 h-4" /> Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-[0.8125rem]">
            <p>&copy; 2026 SunnyAttend. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}