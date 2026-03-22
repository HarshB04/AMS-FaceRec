import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { TeacherDashboard } from "./pages/TeacherDashboard";
import { StudentDashboard } from "./pages/StudentDashboard";
import { LiveCamera } from "./pages/LiveCamera";
import { StudentManagement } from "./pages/StudentManagement";
import { AttendanceReports } from "./pages/AttendanceReports";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import {
  AdminTeachers, AdminCourses, AdminSettings,
  TeacherClasses, TeacherAttendance,
  StudentAttendance, StudentSchedule, StudentProfile,
  NotFound,
} from "./pages/PlaceholderPages";

function AdminLayout() {
  return <DashboardLayout role="admin" title="Admin Dashboard" userName="Admin User" />;
}

function TeacherLayout() {
  return <DashboardLayout role="teacher" title="Teacher Dashboard" userName="Dr. Smith" />;
}

function StudentLayout() {
  return <DashboardLayout role="student" title="Student Dashboard" userName="Sarah Johnson" />;
}

export const router = createBrowserRouter([
  { path: "/", Component: LandingPage },
  { path: "/login", Component: LoginPage },
  {
    path: "/admin",
    Component: AdminLayout,
    children: [
      { index: true, Component: AdminDashboard },
      { path: "students", Component: StudentManagement },
      { path: "teachers", Component: AdminTeachers },
      { path: "courses", Component: AdminCourses },
      { path: "camera", Component: LiveCamera },
      { path: "reports", Component: AttendanceReports },
      { path: "settings", Component: AdminSettings },
    ],
  },
  {
    path: "/teacher",
    Component: TeacherLayout,
    children: [
      { index: true, Component: TeacherDashboard },
      { path: "classes", Component: TeacherClasses },
      { path: "camera", Component: LiveCamera },
      { path: "attendance", Component: TeacherAttendance },
      { path: "reports", Component: AttendanceReports },
    ],
  },
  {
    path: "/student",
    Component: StudentLayout,
    children: [
      { index: true, Component: StudentDashboard },
      { path: "attendance", Component: StudentAttendance },
      { path: "schedule", Component: StudentSchedule },
      { path: "profile", Component: StudentProfile },
    ],
  },
  { path: "*", Component: NotFound },
]);
