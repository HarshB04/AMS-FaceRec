import React, { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { supabase } from "../../../../utils/supabase/client";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  role: "admin" | "teacher" | "student";
  children: React.ReactNode;
}

export function AuthGuard({ role, children }: AuthGuardProps) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          if (mounted) {
            setAuthorized(false);
            setLoading(false);
          }
          return;
        }

        // Get user role from metadata
        const userRole = session.user.user_metadata?.role || "student"; // Default to student if not set

        if (userRole !== role) {
          // If logged in but wrong role, redirect them to their correct dashboard
          navigate(`/${userRole}`, { replace: true });
        } else {
          if (mounted) {
            setAuthorized(true);
          }
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        if (mounted) {
          setAuthorized(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
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
  }, [role, location, navigate]);

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
