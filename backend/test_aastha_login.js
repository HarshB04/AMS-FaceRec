require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

async function testAasthaAuth() {
  const userId = '3bd6555d-5e09-4083-80fa-f1fc47dd4ffb';
  const email = 'aasthathakur@436gmail.com';
  const sbrn = '2023CS0040';
  const testPassword = 'Aastha@Password123';

  console.log("1. Updating Aastha's password via Supabase Admin...");
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: testPassword
  });

  if (error) {
    console.error("Failed to update password:", error);
    return;
  }
  console.log("Password updated successfully!");

  console.log("\n2. Testing SBRN lookup via backend...");
  const lookupRes = await fetch("http://localhost:5003/api/auth/lookup-sbrn", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sbrn })
  });

  if (!lookupRes.ok) {
    console.error("SBRN lookup failed:", await lookupRes.text());
    return;
  }
  const lookupData = await lookupRes.json();
  console.log("SBRN lookup response:", lookupData);

  console.log("\n3. Testing Student Login via backend...");
  const loginRes = await fetch("http://localhost:5003/api/auth/student/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: lookupData.email, password: testPassword })
  });

  if (!loginRes.ok) {
    console.error("Student login failed:", await loginRes.text());
    return;
  }
  const loginData = await loginRes.json();
  console.log("Student login successful! Logged in user profile:");
  console.log(JSON.stringify(loginData.user, null, 2));
}

testAasthaAuth();
