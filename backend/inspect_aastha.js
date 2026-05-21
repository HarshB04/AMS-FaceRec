require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

async function inspectAastha() {
  // Query users table
  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("email", "aasthathakur@436gmail.com")
    .maybeSingle();

  if (userError) {
    console.error("Error fetching user from public.users:", userError);
  } else {
    console.log("User from public.users:", user);
  }

  if (user) {
    // Query student_details table
    const { data: details, error: detailsError } = await supabaseAdmin
      .from("student_details")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (detailsError) {
      console.error("Error fetching details from student_details:", detailsError);
    } else {
      console.log("Details from student_details:", details);
    }
  }

  // Check auth.users table for this email
  const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
  if (authError) {
    console.error("Error listing auth.users:", authError);
  } else {
    const authUser = authUsers.users.find(u => u.email === "aasthathakur@436gmail.com");
    console.log("User from auth.users:", authUser ? {
      id: authUser.id,
      email: authUser.email,
      user_metadata: authUser.user_metadata,
      email_confirmed_at: authUser.email_confirmed_at
    } : "Not found in auth.users");
  }
}

inspectAastha();
