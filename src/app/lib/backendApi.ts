import { supabase } from "@/lib/supabase";

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string) || "http://localhost:5000";
export const FLASK_URL = "http://localhost:5001";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  role: "admin" | "teacher" | "student";
  email: string;
  full_name?: string;
  student_id?: string;
  department?: string;
  semester?: number;
  phone?: string;
  profile_image?: string;
  attendance_rate?: number;
  face_enrolled?: boolean;
  status?: "active" | "inactive";
}

export interface BackendSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type: string;
}

export interface LoginResponse {
  message: string;
  session: BackendSession;
  user: UserProfile;
}

export interface StudentListResponse {
  students: UserProfile[];
  count: number;
}

// ── Internal fetch helper ──────────────────────────────────────────────────────

async function backendFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // Get current Supabase session token to attach as Bearer
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers,
  });

  const body = await response.json();

  if (!response.ok) {
    const message = body?.message || body?.error || `HTTP ${response.status}`;
    const err = new Error(message) as Error & { statusCode: number };
    err.statusCode = response.status;
    throw err;
  }

  return body as T;
}

// ── Auth API ──────────────────────────────────────────────────────────────────

/**
 * Log in as admin via the secure backend endpoint.
 * Role is verified server-side from the profiles table.
 */
export async function backendAdminLogin(email: string, password: string): Promise<LoginResponse> {
  return backendFetch<LoginResponse>("/api/auth/admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

/**
 * Log in as teacher via the secure backend endpoint.
 * Role is verified server-side from the profiles table.
 */
export async function backendTeacherLogin(email: string, password: string): Promise<LoginResponse> {
  return backendFetch<LoginResponse>("/api/auth/teacher/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

/**
 * Log in as student via the secure backend endpoint.
 * Pass an email (resolve SBRN→email via Edge Function first if needed).
 */
export async function backendStudentLogin(email: string, password: string): Promise<LoginResponse> {
  return backendFetch<LoginResponse>("/api/auth/student/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

/**
 * Fetch the current user's profile from the profiles table via the backend.
 * This is the authoritative role source — use this in AuthGuard instead of JWT metadata.
 */
export async function backendGetMe(): Promise<{ user: UserProfile }> {
  return backendFetch<{ user: UserProfile }>("/api/auth/me");
}

/**
 * Resolve a Student Board Roll Number (SBRN) to the student's registered email.
 * Calls the backend endpoint — never the Edge Function directly.
 * Used by the login form before calling backendStudentLogin.
 */
export async function backendLookupSbrn(
  sbrn: string
): Promise<{ email: string; name?: string }> {
  const res = await fetch(`${BACKEND_URL}/api/auth/lookup-sbrn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sbrn: sbrn.trim().toUpperCase() }),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.message || "Student ID not found.");
  }
  return body as { email: string; name?: string };
}

// ── Students API ──────────────────────────────────────────────────────────────

export interface RegisterStudentPayload {
  full_name: string;
  email: string;
  student_id: string;
  department: string;
  semester: number;
  phone?: string;
  password: string;
}

/**
 * Register a new student via the backend (admin only).
 * Creates: auth user + profiles row + students row.
 * The service role key never touches the browser.
 */
export async function backendRegisterStudent(payload: RegisterStudentPayload) {
  return backendFetch<{ message: string; user: UserProfile }>("/api/students/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch the authenticated student's own profile.
 */
export async function backendGetStudentProfile(): Promise<{ profile: UserProfile }> {
  return backendFetch<{ profile: UserProfile }>("/api/students/profile");
}

/**
 * Fetch all students (admin only).
 */
export async function backendGetAllStudents(): Promise<StudentListResponse> {
  return backendFetch<StudentListResponse>("/api/students/all");
}

/**
 * Update a student's profile (admin only). :id is the auth user UUID.
 */
export async function backendUpdateStudent(
  id: string,
  data: Partial<Omit<RegisterStudentPayload, "password" | "email">>
) {
  return backendFetch<{ message: string; profile: UserProfile }>(`/api/students/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Delete a student (admin only). :id is the auth user UUID.
 */
export async function backendDeleteStudent(id: string) {
  return backendFetch<{ message: string }>(`/api/students/${id}`, {
    method: "DELETE",
  });
}

// ── Registration API (public — no auth token required) ────────────────────────

export interface SelfRegisterPayload {
  full_name: string;
  sbrn: string;
  email: string;
  password: string;
  confirm_password: string;
  /** Branch (e.g. Computer Engineering) */
  branch: string;
  semester: number;
  /** Academic session e.g. "2023 - 2026" */
  session: string;
  phone?: string;
}

/**
 * Self-register as a student. Account starts as 'pending' until admin approves.
 * This is the ONLY public endpoint — does not require an auth token.
 */
export async function backendRegisterSelf(payload: SelfRegisterPayload): Promise<{ message: string }> {
  const response = await fetch(
    `${BACKEND_URL}/api/auth/register`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  const body = await response.json();

  if (!response.ok) {
    const message =
      body?.message ||
      (body?.messages as string[] | undefined)?.join(" ") ||
      body?.error ||
      `HTTP ${response.status}`;
    throw new Error(message);
  }

  return body as { message: string };
}

/**
 * Simple backendApi helper that mirrors the backendFetch pattern but returns a raw Response.
 * Use for ad-hoc GET requests where you need to parse the body yourself.
 */
export const backendApi = {
  async get(path: string): Promise<Response> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    return fetch(`${BACKEND_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  },
};

// ── Admin Approval API ─────────────────────────────────────────────────────────

export interface PendingUser {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  approval_status: "pending" | "approved" | "rejected";
  created_at: string;
  // Fields from extended registration
  student_id?: string | null;   // SBRN
  department?: string | null;
  semester?: number | null;
  section?: string | null;
  phone?: string | null;
}

/**
 * Fetch all profiles with approval_status = 'pending' (admin only).
 */
export async function backendGetPendingUsers(): Promise<{ users: PendingUser[]; count: number }> {
  return backendFetch<{ users: PendingUser[]; count: number }>("/api/admin/pending-users");
}

/**
 * Fetch all self-registered users regardless of approval_status (admin only).
 */
export async function backendGetAllRegistrationUsers(): Promise<{ users: PendingUser[]; count: number }> {
  return backendFetch<{ users: PendingUser[]; count: number }>("/api/admin/all-registration-users");
}

/**
 * Approve a pending user (admin only). :id is the auth user UUID.
 */
export async function backendApproveUser(id: string): Promise<{ message: string }> {
  return backendFetch<{ message: string }>(`/api/admin/approve/${id}`, { method: "POST" });
}

/**
 * Reject a pending/approved user (admin only). :id is the auth user UUID.
 */
export async function backendRejectUser(id: string): Promise<{ message: string }> {
  return backendFetch<{ message: string }>(`/api/admin/reject/${id}`, { method: "POST" });
}

// ── Face Enrollment API ───────────────────────────────────────────────────────

/**
 * Notify the Express backend that face enrollment is complete for a student.
 * Admin only. Sets students.face_enrolled = true in Supabase.
 * Call this AFTER the Python face engine has finished capturing 100 frames.
 *
 * @param sbrn - The student's SBRN (Student Board Roll Number)
 */
export async function backendFaceEnrollComplete(
  sbrn: string
): Promise<{ success: boolean; message: string; student_name: string; sbrn: string }> {
  return backendFetch<{ success: boolean; message: string; student_name: string; sbrn: string }>(
    "/api/face/enroll-complete",
    {
      method: "POST",
      body: JSON.stringify({ sbrn }),
    }
  );
}

/**
 * Manually log attendance for a student (teacher/admin only).
 */
export async function backendManualLogAttendance(
  payload: {
    sbrn: string;
    date?: string;
    time?: string;
    confidence?: number;
    course_code?: string;
    course_name?: string;
    department?: string;
    semester?: string;
  }
): Promise<{ success: boolean; message: string; student_name: string; sbrn: string }> {
  return backendFetch("/api/attendance/manual-log", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
