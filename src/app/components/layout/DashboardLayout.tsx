import React, { useState, useEffect } from "react";
import { Outlet } from "react-router";
import { DashboardSidebar } from "./DashboardSidebar";
import { TopBar } from "./TopBar";
import { backendApi } from "../../lib/backendApi";

interface DashboardLayoutProps {
  role: "admin" | "teacher" | "student";
  title: string;
  userName?: string;
}

export function DashboardLayout({ role, title }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [realUserName, setRealUserName] = useState<string>("Loading...");
  const sidebarWidth = collapsed ? 72 : 260;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await backendApi.getMe();
        if (data && data.user && data.user.full_name) {
          setRealUserName(data.user.full_name);
        } else {
          setRealUserName("User");
        }
      } catch (err) {
        console.error("Failed to fetch user data", err);
        setRealUserName("User");
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "Inter, sans-serif" }}>
      <DashboardSidebar role={role} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <TopBar title={title} userName={realUserName} userRole={role} sidebarWidth={sidebarWidth} />
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
