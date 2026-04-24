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
import { AdminTeachers } from "./pages/AdminTeachers";
import { AdminCourses } from "./pages/AdminCourses";
import { AdminSettings } from "./pages/AdminSettings";
import { TeacherClasses } from "./pages/TeacherClasses";
import { TeacherAttendanceSummary } from "./pages/TeacherAttendanceSummary";
import { StudentAttendanceHistory } from "./pages/StudentAttendanceHistory";
import { StudentSchedule } from "./pages/StudentSchedule";
import { StudentProfile } from "./pages/StudentProfile";
import { NotFound } from "./pages/PlaceholderPages";
import { AuthGuard } from "./components/layout/AuthGuard";

function AdminLayout() {
  return (
    <AuthGuard role="admin">
      <DashboardLayout role="admin" title="Admin Dashboard" userName="Admin User" />
    </AuthGuard>
  );
}

function TeacherLayout() {
  return (
    <AuthGuard role="teacher">
      <DashboardLayout role="teacher" title="Teacher Dashboard" userName="Dr. Smith" />
    </AuthGuard>
  );
}

function StudentLayout() {
  return (
    <AuthGuard role="student">
      <DashboardLayout role="student" title="Student Dashboard" userName="Sarah Johnson" />
    </AuthGuard>
  );
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
      { path: "attendance", Component: TeacherAttendanceSummary },
      { path: "reports", Component: AttendanceReports },
    ],
  },
  {
    path: "/student",
    Component: StudentLayout,
    children: [
      { index: true, Component: StudentDashboard },
      { path: "attendance", Component: StudentAttendanceHistory },
      { path: "schedule", Component: StudentSchedule },
      { path: "profile", Component: StudentProfile },
    ],
  },
  { path: "*", Component: NotFound },
]);
