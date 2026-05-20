require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function repairUsers() {
  console.log("Fetching auth.users...");
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (authError) {
    console.error("Error fetching auth users:", authError);
    return;
  }

  const users = authData.users;
  console.log(`Found ${users.length} users in auth.users.`);

  for (const user of users) {
    const role = user.user_metadata?.role || "admin"; // Default to admin for the abvgiet account
    const full_name = user.user_metadata?.full_name || user.email.split("@")[0];
    
    console.log(`Restoring user: ${user.email} as ${role}`);
    
    // 1. Upsert into public.users
    const { error: userError } = await supabaseAdmin.from("users").upsert({
      id: user.id,
      email: user.email,
      role: role,
      full_name: full_name,
      is_active: true,
      approval_status: "approved" // Auto approve to let them login
    });

    if (userError) {
      console.error(`  Error restoring user ${user.email}:`, userError);
      continue;
    }

    // 2. Upsert into extension tables based on role
    if (role === "admin") {
      await supabaseAdmin.from("admin_details").upsert({
        user_id: user.id,
        permissions: { all: true }
      });
    } else if (role === "teacher") {
      await supabaseAdmin.from("teacher_details").upsert({
        user_id: user.id,
        faculty_code: user.user_metadata?.faculty_code || user.id.slice(0, 8)
      });
    } else if (role === "student") {
      await supabaseAdmin.from("student_details").upsert({
        user_id: user.id,
        sbrn: user.user_metadata?.student_id || user.id.slice(0, 8),
        semester: user.user_metadata?.semester || 1
      });
    }
  }
  
  console.log("Repair complete! You can now login.");
}

repairUsers();
