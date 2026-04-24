import React from "react";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";

export function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="text-center space-y-4">
        <p className="text-[5rem] text-indigo-100" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 800 }}>404</p>
        <h2 className="text-[1.5rem] text-slate-700" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}>Page not found</h2>
        <p className="text-slate-400 text-[0.875rem]">The page you're looking for doesn't exist.</p>
        <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-[0.875rem] hover:bg-indigo-700 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Go Home
        </Link>
      </div>
    </div>
  );
}
