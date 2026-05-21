import { createBrowserRouter } from "react-router";
import { lazy, Suspense } from "react";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { AuthGuard } from "./components/layout/AuthGuard";
import { NotFound } from "./pages/PlaceholderPages";

// Lazy-loaded pages
const LandingPage = lazy(() => import("./pages/LandingPage").then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import("./pages/LoginPage").then(m => ({ default: m.LoginPage })));
const RegistrationPage = lazy(() => import("./pages/RegistrationPage").then(m => ({ default: m.RegistrationPage })));
const AdminApprovals = lazy(() => import("./pages/AdminApprovals").then(m => ({ default: m.AdminApprovals })));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const TeacherDashboard = lazy(() => import("./pages/TeacherDashboard").then(m => ({ default: m.TeacherDashboard })));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard").then(m => ({ default: m.StudentDashboard })));
const LiveCamera = lazy(() => import("./pages/LiveCamera").then(m => ({ default: m.LiveCamera })));
const StudentManagement = lazy(() => import("./pages/StudentManagement").then(m => ({ default: m.StudentManagement })));
const AttendanceReports = lazy(() => import("./pages/AttendanceReports").then(m => ({ default: m.AttendanceReports })));
const AdminTeachers = lazy(() => import("./pages/AdminTeachers").then(m => ({ default: m.AdminTeachers })));
const AdminCourses = lazy(() => import("./pages/AdminCourses").then(m => ({ default: m.AdminCourses })));
const AdminSettings = lazy(() => import("./pages/AdminSettings").then(m => ({ default: m.AdminSettings })));
const TeacherClasses = lazy(() => import("./pages/TeacherClasses").then(m => ({ default: m.TeacherClasses })));
const TeacherAttendanceSummary = lazy(() => import("./pages/TeacherAttendanceSummary").then(m => ({ default: m.TeacherAttendanceSummary })));
const StudentAttendanceHistory = lazy(() => import("./pages/StudentAttendanceHistory").then(m => ({ default: m.StudentAttendanceHistory })));
const StudentSchedule = lazy(() => import("./pages/StudentSchedule").then(m => ({ default: m.StudentSchedule })));
const StudentProfile = lazy(() => import("./pages/StudentProfile").then(m => ({ default: m.StudentProfile })));

// Loading Fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function AdminLayout() {
  return (
    <AuthGuard role="admin">
      <DashboardLayout role="admin" title="Admin Dashboard" />
    </AuthGuard>
  );
}

function TeacherLayout() {
  return (
    <AuthGuard role="teacher">
      <DashboardLayout role="teacher" title="Teacher Dashboard" />
    </AuthGuard>
  );
}

function StudentLayout() {
  return (
    <AuthGuard role="student">
      <DashboardLayout role="student" title="Student Dashboard" />
    </AuthGuard>
  );
}

// Wrap lazy components in Suspense
const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export const router = createBrowserRouter([
  { path: "/", element: withSuspense(LandingPage) },
  { path: "/login", element: withSuspense(LoginPage) },
  { path: "/register", element: withSuspense(RegistrationPage) },
  {
    path: "/admin",
    Component: AdminLayout,
    children: [
      { index: true, element: withSuspense(AdminDashboard) },
      { path: "students", element: withSuspense(StudentManagement) },
      { path: "teachers", element: withSuspense(AdminTeachers) },
      { path: "courses", element: withSuspense(AdminCourses) },
      { path: "camera", element: withSuspense(LiveCamera) },
      { path: "reports", element: withSuspense(AttendanceReports) },
      { path: "settings", element: withSuspense(AdminSettings) },
      { path: "approvals", element: withSuspense(AdminApprovals) },
    ],
  },
  {
    path: "/teacher",
    Component: TeacherLayout,
    children: [
      { index: true, element: withSuspense(TeacherDashboard) },
      { path: "classes", element: withSuspense(TeacherClasses) },
      { path: "camera", element: withSuspense(LiveCamera) },
      { path: "attendance", element: withSuspense(TeacherAttendanceSummary) },
      { path: "reports", element: withSuspense(AttendanceReports) },
    ],
  },
  {
    path: "/student",
    Component: StudentLayout,
    children: [
      { index: true, element: withSuspense(StudentDashboard) },
      { path: "attendance", element: withSuspense(StudentAttendanceHistory) },
      { path: "schedule", element: withSuspense(StudentSchedule) },
      { path: "profile", element: withSuspense(StudentProfile) },
    ],
  },
  { path: "*", Component: NotFound },
]);
