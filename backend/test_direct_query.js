require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

async function testDirectQuery() {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select(`
      id, email, full_name, branch, phone, avatar_url, role, is_active,
      student_details ( sbrn, semester, session, attendance_rate ),
      face_embeddings ( id )
    `)
    .eq("role", "student")
    .limit(2);

  if (error) {
    console.error("Error direct query:", error);
    return;
  }
  console.log("Direct query result (raw):");
  console.dir(data, { depth: null });
}

testDirectQuery();
