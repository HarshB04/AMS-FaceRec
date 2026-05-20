import React from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard, Users, BookOpen, Camera, FileBarChart, Settings,
  GraduationCap, CalendarCheck, UserCircle, Clock, Sun, ChevronLeft, ChevronRight, LogOut, UserCheck
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { backendGetPendingUsers } from "@/app/lib/backendApi";

type Role = "admin" | "teacher" | "student";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: Record<Role, NavItem[]> = {
  admin: [
    { label: "Dashboard", path: "/admin", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Students", path: "/admin/students", icon: <Users className="w-5 h-5" /> },
    { label: "Teachers", path: "/admin/teachers", icon: <GraduationCap className="w-5 h-5" /> },
    { label: "Courses", path: "/admin/courses", icon: <BookOpen className="w-5 h-5" /> },
    { label: "Live Camera", path: "/admin/camera", icon: <Camera className="w-5 h-5" /> },
    { label: "Reports", path: "/admin/reports", icon: <FileBarChart className="w-5 h-5" /> },
    { label: "Approvals", path: "/admin/approvals", icon: <UserCheck className="w-5 h-5" /> },
    { label: "Settings", path: "/admin/settings", icon: <Settings className="w-5 h-5" /> },
  ],
  teacher: [
    { label: "Dashboard", path: "/teacher", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "My Classes", path: "/teacher/classes", icon: <BookOpen className="w-5 h-5" /> },
    { label: "Live Camera", path: "/teacher/camera", icon: <Camera className="w-5 h-5" /> },
    { label: "Attendance", path: "/teacher/attendance", icon: <CalendarCheck className="w-5 h-5" /> },
    { label: "Reports", path: "/teacher/reports", icon: <FileBarChart className="w-5 h-5" /> },
  ],
  student: [
    { label: "Dashboard", path: "/student", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "My Attendance", path: "/student/attendance", icon: <CalendarCheck className="w-5 h-5" /> },
    { label: "Schedule", path: "/student/schedule", icon: <Clock className="w-5 h-5" /> },
    { label: "Profile", path: "/student/profile", icon: <UserCircle className="w-5 h-5" /> },
  ],
};

interface DashboardSidebarProps {
  role: Role;
  collapsed: boolean;
  onToggle: () => void;
}

export function DashboardSidebar({ role, collapsed, onToggle }: DashboardSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const items = navItems[role];
  const [pendingCount, setPendingCount] = React.useState(0);

  // Fetch pending approval count for admin badge
  React.useEffect(() => {
    if (role !== "admin") return;
    backendGetPendingUsers()
      .then(({ count }) => setPendingCount(count))
      .catch(() => { /* silently ignore — badge just won't show */ });
  }, [role]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white border-r border-slate-200 z-40 transition-all duration-300 flex flex-col ${
        collapsed ? "w-[72px]" : "w-[260px]"
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-slate-100">
        <Link to="/" className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Sun className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="text-[1.125rem] text-slate-900 whitespace-nowrap" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}>
              SunnyAttend
            </span>
          )}
        </Link>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          const showBadge = item.path === "/admin/approvals" && pendingCount > 0;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <span className={isActive ? "text-indigo-600" : "text-slate-400"}>
                {item.icon}
              </span>
              {!collapsed && (
                <span className="flex-1 flex items-center justify-between text-[0.875rem]">
                  {item.label}
                  {showBadge && (
                    <span className="ml-2 min-w-[20px] h-5 px-1.5 bg-amber-500 text-white rounded-full text-[0.6875rem] font-bold flex items-center justify-center">
                      {pendingCount > 99 ? "99+" : pendingCount}
                    </span>
                  )}
                </span>
              )}
              {collapsed && showBadge && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Actions (Logout + Collapse) */}
      <div className="p-3 border-t border-slate-100 space-y-1">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors ${
            collapsed ? "justify-center" : ""
          }`}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="text-[0.875rem] font-medium">Logout</span>}
        </button>

        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span className="text-[0.8125rem]">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
