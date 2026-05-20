const express = require("express");
const router = express.Router();
const { logAttendance } = require("../controllers/attendanceController");

/**
 * POST /api/attendance/log
 *
 * Internal — called by the Python face engine (localhost:5001) only.
 * Protected by X-Face-Engine-Secret header (set in .env as FACE_ENGINE_SECRET).
 * No auth token required (Python has no session).
 *
 * Body: { sbrn, date?, time?, confidence?, course_id?, course_code?, department?, semester? }
 * Response: { success, student_name, sbrn, date, time, course_id }
 */
router.post("/log", logAttendance);

module.exports = router;
