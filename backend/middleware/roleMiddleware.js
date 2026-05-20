const { supabaseAdmin } = require("../config/supabaseClient");

/**
 * roleMiddleware — factory that creates a middleware enforcing a required role.
 *
 * Reads the authoritative role from the `profiles` table (NOT from JWT metadata,
 * which is spoofable). Requires authMiddleware to have run first (req.user set).
 *
 * Usage:  router.get("/admin-only", authMiddleware, requireRole("admin"), handler)
 */
function requireRole(requiredRole) {
  return async function roleCheck(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized", message: "No authenticated user." });
    }

    try {
      const { data: user, error } = await supabaseAdmin
        .from("users")
        .select("role")
        .eq("id", req.user.id)
        .single();

      if (error || !user) {
        return res.status(403).json({
          error: "Forbidden",
          message: "Could not verify user role. Profile not found.",
        });
      }

      if (user.role !== requiredRole) {
        return res.status(403).json({
          error: "Forbidden",
          message: `This endpoint requires role '${requiredRole}'. Your role is '${user.role}'.`,
        });
      }

      // Attach the authoritative role to the request for downstream use
      req.userRole = user.role;
      next();
    } catch (err) {
      console.error("[roleMiddleware] Unexpected error:", err);
      return res.status(500).json({ error: "Internal Server Error", message: "Role check failed." });
    }
  };
}

module.exports = { requireRole };
