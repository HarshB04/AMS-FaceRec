import React, { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { supabase } from "@/lib/supabase";
import { backendGetMe } from "@/app/lib/backendApi";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  role: "admin" | "teacher" | "student";
  children: React.ReactNode;
}

/**
 * AuthGuard — protects routes by verifying the user's role.
 *
 * SECURITY: Role is read from the `profiles` table via the backend API (/api/auth/me).
 * This prevents privilege escalation via spoofed JWT user_metadata.
 */
export function AuthGuard({ role, children }: AuthGuardProps) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        // Step 1: Verify there is an active Supabase session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          if (mounted) { setAuthorized(false); setLoading(false); }
          return;
        }

        // Step 2: Fetch authoritative role from backend (reads profiles table, NOT JWT metadata)
        let userRole: string;
        try {
          const { user } = await backendGetMe();
          userRole = user.role;
        } catch (backendErr) {
          // Backend unreachable (e.g. not started) — fall back to supabase profiles table directly
          console.warn("[AuthGuard] Backend unavailable, falling back to Supabase profiles table.");
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();

          if (profileError || !profile) {
            if (mounted) { setAuthorized(false); setLoading(false); }
            return;
          }
          userRole = profile.role;
        }

        if (userRole !== role) {
          // Wrong role — redirect to the user's correct dashboard
          if (mounted) navigate(`/${userRole}`, { replace: true });
        } else {
          if (mounted) setAuthorized(true);
        }
      } catch (err) {
        console.error("[AuthGuard] Auth check failed:", err);
        if (mounted) setAuthorized(false);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    checkAuth();

    // Re-validate on auth state changes (sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session || event === "SIGNED_OUT") {
        if (mounted) {
          setAuthorized(false);
          navigate("/login", { replace: true, state: { from: location } });
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [role, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!authorized) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
