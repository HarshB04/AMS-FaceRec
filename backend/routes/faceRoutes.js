const express = require("express");
const router = express.Router();
const { enrollComplete, getEmbeddings, syncEmbedding } = require("../controllers/faceController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

/**
 * POST /api/face/enroll-complete
 *
 * Admin only. Called by the React frontend after the Python face engine
 * has finished capturing face data for a student.
 * Marks students.face_enrolled = true in Supabase.
 *
 * Body: { sbrn: string }
 * Response: { success, student_name, sbrn }
 */
router.post("/enroll-complete", authMiddleware, requireRole("admin"), enrollComplete);

/**
 * GET /api/face/sync
 * POST /api/face/sync
 * 
 * Internal endpoints for Python Face Engine. Protected by X-Face-Engine-Secret.
 */
router.get("/sync", getEmbeddings);
router.post("/sync", syncEmbedding);

module.exports = router;
