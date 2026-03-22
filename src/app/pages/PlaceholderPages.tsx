import React from "react";
import { Link } from "react-router";
import { Construction, ArrowLeft } from "lucide-react";

interface PlaceholderProps {
  title: string;
  description?: string;
  backTo?: string;
}

function PlaceholderPage({ title, description = "This page is under construction.", backTo }: PlaceholderProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <Construction className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-[1.25rem] text-slate-700" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}>{title}</h2>
        <p className="text-[0.875rem] text-slate-400 max-w-md">{description}</p>
        {backTo && (
          <Link to={backTo} className="inline-flex items-center gap-1.5 text-[0.8125rem] text-indigo-600 hover:text-indigo-700">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
        )}
      </div>
    </div>
  );
}

export function AdminTeachers() { return <PlaceholderPage title="Teacher Management" description="Manage teacher profiles, assignments, and permissions." backTo="/admin" />; }
export function AdminCourses() { return <PlaceholderPage title="Course Management" description="Create and manage courses, schedules, and enrollments." backTo="/admin" />; }
export function AdminSettings() { return <PlaceholderPage title="System Settings" description="Configure system preferences, security, and integrations." backTo="/admin" />; }
export function TeacherClasses() { return <PlaceholderPage title="My Classes" description="View and manage your class schedules and enrollments." backTo="/teacher" />; }
export function TeacherAttendance() { return <PlaceholderPage title="Attendance Summary" description="Review detailed attendance records for all your classes." backTo="/teacher" />; }
export function StudentAttendance() { return <PlaceholderPage title="My Attendance History" description="View your complete attendance records across all courses." backTo="/student" />; }
export function StudentSchedule() { return <PlaceholderPage title="My Schedule" description="View your upcoming classes and exam schedules." backTo="/student" />; }
export function StudentProfile() { return <PlaceholderPage title="My Profile" description="Manage your personal information and preferences." backTo="/student" />; }

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
