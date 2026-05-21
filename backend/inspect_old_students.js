require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

async function checkOldStudents() {
  const { data: student, error } = await supabaseAdmin
    .from("students")
    .select("*")
    .eq("email", "aasthathakur@436gmail.com")
    .maybeSingle();

  if (error) {
    console.error("Error fetching from students:", error);
  } else {
    console.log("Student from public.students (old table):", student);
  }
}

checkOldStudents();
