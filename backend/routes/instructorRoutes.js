const express = require("express");
const router = express.Router();
const { registerTeacher } = require("../controllers/instructorController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

/**
 * POST /api/instructors/register
 * 
 * Protected route: Only Admins can register a new Teacher.
 * Body: { name, email, password }
 */
router.post("/register", authMiddleware, requireRole("admin"), registerTeacher);

module.exports = router;
