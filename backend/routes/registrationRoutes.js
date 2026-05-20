const express = require("express");
const router = express.Router();
const { register } = require("../controllers/registrationController");

/**
 * POST /api/auth/register
 *
 * Public — no auth required.
 * Students self-register. Account starts as 'pending' until admin approves.
 *
 * Body: { full_name, email, password, confirm_password }
 * Response: { message: string }
 */
router.post("/register", register);

module.exports = router;
