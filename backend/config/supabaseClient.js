const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRole) {
  throw new Error(
    "Missing required Supabase environment variables. " +
    "Check SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE in backend/.env"
  );
}

/**
 * Anon client — for verifying incoming user JWTs.
 * Uses the public anon key; respects RLS policies.
 */
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

/**
 * Admin client — for privileged server-side operations.
 * Uses the service role key; BYPASSES RLS.
 * NEVER expose this key or this client to the browser.
 */
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole, {
  auth: { persistSession: false, autoRefreshToken: false },
});

module.exports = { supabaseAnon, supabaseAdmin };
