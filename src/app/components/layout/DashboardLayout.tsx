import React, { useState } from "react";
import { Outlet } from "react-router";
import { DashboardSidebar } from "./DashboardSidebar";
import { TopBar } from "./TopBar";

interface DashboardLayoutProps {
  role: "admin" | "teacher" | "student";
  title: string;
  userName: string;
}

export function DashboardLayout({ role, title, userName }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 72 : 260;

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "Inter, sans-serif" }}>
      <DashboardSidebar role={role} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <TopBar title={title} userName={userName} userRole={role} sidebarWidth={sidebarWidth} />
      <main
        className="pt-16 min-h-screen transition-all duration-300"
        style={{ marginLeft: sidebarWidth }}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
