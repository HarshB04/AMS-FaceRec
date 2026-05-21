const express = require("express");
const router = express.Router();
const { logAttendance, manualLogAttendance } = require("../controllers/attendanceController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

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

/**
 * POST /api/attendance/manual-log
 *
 * External — called by React frontend.
 * Requires teacher or admin role.
 */
router.post("/manual-log", authMiddleware, requireRole(["teacher", "admin"]), manualLogAttendance);

module.exports = router;
