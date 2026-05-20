const { supabaseAnon } = require("../config/supabaseClient");

/**
 * authMiddleware — verifies the Supabase JWT from the Authorization header.
 *
 * On success: attaches req.user and req.token.
 * On failure: responds 401 Unauthorized.
 */
async function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Missing or malformed Authorization header. Expected: Bearer <token>",
    });
  }

  const token = authHeader.slice(7); // strip "Bearer "

  try {
    const { data, error } = await supabaseAnon.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: error?.message || "Invalid or expired session token.",
      });
    }

    req.user = data.user;
    req.token = token;
    next();
  } catch (err) {
    console.error("[authMiddleware] Unexpected error:", err);
    return res.status(500).json({ error: "Internal Server Error", message: "Auth check failed." });
  }
}

module.exports = { authMiddleware };
