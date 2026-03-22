import React from "react";
import { Bell, Search, ChevronDown } from "lucide-react";

interface TopBarProps {
  title: string;
  userName: string;
  userRole: string;
  sidebarWidth: number;
}

export function TopBar({ title, userName, userRole, sidebarWidth }: TopBarProps) {
  return (
    <header
      className="fixed top-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 z-30 flex items-center justify-between px-6 transition-all duration-300"
      style={{ left: sidebarWidth }}
    >
      <h1 className="text-[1.125rem] text-slate-900" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}>{title}</h1>
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-56 pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[0.8125rem] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition"
          />
        </div>
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-slate-50 transition-colors" aria-label="Notifications">
          <Bell className="w-5 h-5 text-slate-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        {/* User Menu */}
        <button className="flex items-center gap-2.5 pl-4 border-l border-slate-200">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-cyan-400 rounded-full flex items-center justify-center text-white text-[0.75rem]" style={{ fontWeight: 600 }}>
            {userName.split(" ").map(n => n[0]).join("")}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-[0.8125rem] text-slate-700" style={{ fontWeight: 500 }}>{userName}</p>
            <p className="text-[0.6875rem] text-slate-400 capitalize">{userRole}</p>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
        </button>
      </div>
    </header>
  );
}
