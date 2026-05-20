const express = require("express");
const router = express.Router();
const {
  registerStudent,
  getProfile,
  getAllStudents,
  updateStudent,
  deleteStudent,
} = require("../controllers/studentController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

/**
 * POST /api/students/register
 * Admin only. Creates auth user + profiles + students records.
 * Body: { full_name, email, student_id, department, semester, phone?, password }
 */
router.post(
  "/register",
  authMiddleware,
  requireRole("admin"),
  registerStudent
);

/**
 * GET /api/students/profile
 * Authenticated student fetches their own profile + attendance stats.
 */
router.get(
  "/profile",
  authMiddleware,
  getProfile
);

/**
 * GET /api/students/all
 * Admin only. Returns all student profiles with attendance stats.
 */
router.get(
  "/all",
  authMiddleware,
  requireRole("admin"),
  getAllStudents
);

/**
 * PUT /api/students/:id
 * Admin only. :id is the auth user UUID.
 * Body: { full_name?, department?, semester?, phone?, student_id? }
 */
router.put(
  "/:id",
  authMiddleware,
  requireRole("admin"),
  updateStudent
);

/**
 * DELETE /api/students/:id
 * Admin only. :id is the auth user UUID.
 * Deletes auth user (cascades to profiles) + students record.
 */
router.delete(
  "/:id",
  authMiddleware,
  requireRole("admin"),
  deleteStudent
);

module.exports = router;
