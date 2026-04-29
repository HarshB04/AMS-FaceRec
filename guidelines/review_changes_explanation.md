# Detailed Breakdown of Architecture & Security Changes

Here is a detailed breakdown of the exact changes we made to the codebase and **why** they were critical to change for the security and stability of the system.

---

### 1. Removing the Hardcoded Supabase Key
**Where:** `face_engine/server.py`

* **What we changed:** We removed the hardcoded `eyJhb...` JWT string from the script. The script now strictly attempts to read `VITE_SUPABASE_PUBLISHABLE_KEY` from your environment variables. If it can't find it, the script crashes on startup with a clear error message.
* **Why we had to change it:** Committing security keys directly into your source code is extremely dangerous. Even though it's an "anon" (public) key, if a malicious actor finds this key on GitHub, they can use it to query your database. By forcing the use of environment variables (like a `.env` file that is ignored by Git), you ensure that your keys stay safe on your local machine and your production servers, and never get checked into version control.

### 2. URL Encoding API Parameters
**Where:** `face_engine/server.py`

* **What we changed:** We added `urllib.parse.quote` to URL-encode the `name` variable before inserting it into the Supabase HTTP GET request URLs. For example, `John Doe` becomes `John%20Doe`.
* **Why we had to change it:** Without URL encoding, if a student's name contains a space, an ampersand (`&`), a plus sign (`+`), or other special characters, the HTTP request URL becomes malformed (e.g., `?name=eq.John Doe`). The Supabase API would either reject the request with a 400 Bad Request error or misunderstand the query entirely. URL encoding guarantees that any string is safely transmitted over HTTP.

### 3. Adding Row-Level Security (RLS)
**Where:** `supabase/schema.sql`

* **What we changed:** We added `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` to all of your tables, and created basic `CREATE POLICY` statements that restrict access only to `authenticated` users. 
* **Why we had to change it:** By default, PostgreSQL and Supabase allow anyone with your anon key to perform `SELECT`, `INSERT`, `UPDATE`, and `DELETE` on your tables. Since your API key was previously public, literally anyone could have deleted your entire `students` or `attendance` tables from their own terminal. RLS is the database's bouncer—it ensures that only authenticated, valid users (like your frontend app or edge functions) are allowed to interact with the data. 

### 4. Database-Level Duplicate Prevention (Idempotency)
**Where:** `supabase/schema.sql`

* **What we changed:** We added a strict constraint to the attendance table: `UNIQUE (student_id, course_id, date_attended)`.
* **Why we had to change it:** Before this, the Python engine used a simple `logged_students = set()` variable to prevent logging the same student twice. The problem is that if you close the Python script and restart it, that memory is wiped clean, and it would happily log attendance for the exact same student again on the same day. By enforcing this at the *database* level, it is physically impossible for duplicate attendance to exist for a single student on a single day for a single course, regardless of how many times the camera scans them or if the server restarts.

### 5. Graceful Error Handling for Duplicates
**Where:** `face_engine/server.py`

* **What we changed:** We updated the `log_attendance` function to check the HTTP status code of the Supabase response. If it receives a `409 Conflict`, it treats it as a success and updates its local memory cache anyway.
* **Why we had to change it:** Because of Change #4 (the UNIQUE constraint), if the camera accidentally scans a student twice and sends a second `POST` request to Supabase, Supabase will block it and return a `409 Conflict` error. If we didn't handle this in Python, your terminal would be flooded with scary red `DB Error` messages every time a recognized face lingered on the camera. By catching the 409 status, the Python engine essentially says, *"Oh, they are already logged in the DB? Great, I'll stop trying for now,"* and continues running smoothly without crashing.
