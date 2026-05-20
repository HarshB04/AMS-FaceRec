const express = require("express");
const router = express.Router();
const { adminLogin, teacherLogin, studentLogin, getMe, lookupSbrn } = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authMiddleware");

/**
 * POST /api/auth/admin/login
 * Body: { email, password }
 * Response: { session, user: profile }
 */
router.post("/admin/login", adminLogin);

/**
 * POST /api/auth/teacher/login
 * Body: { email, password }
 * Response: { session, user: profile }
 */
router.post("/teacher/login", teacherLogin);

/**
 * POST /api/auth/student/login
 * Body: { email, password }
 * Note: use /lookup-sbrn first if the student entered their SBRN instead of email.
 */
router.post("/student/login", studentLogin);

/**
 * POST /api/auth/lookup-sbrn
 * Body: { sbrn: string }
 * Response: { email: string }
 *
 * Public — resolves a Student Board Roll Number to its registered email.
 * Used by the login page before calling /student/login.
 */
router.post("/lookup-sbrn", lookupSbrn);

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's profile from the profiles table.
 * Used by the frontend AuthGuard to get the authoritative role.
 */
router.get("/me", authMiddleware, getMe);

module.exports = router;
