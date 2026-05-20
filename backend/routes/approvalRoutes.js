const express = require("express");
const router = express.Router();
const {
  getPendingUsers,
  getAllRegistrationUsers,
  approveUser,
  rejectUser,
} = require("../controllers/approvalController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

// All routes here require authentication + admin role
router.use(authMiddleware, requireRole("admin"));

/**
 * GET /api/admin/pending-users
 * Returns all profiles with approval_status = 'pending'.
 */
router.get("/pending-users", getPendingUsers);

/**
 * GET /api/admin/all-registration-users
 * Returns all self-registered users with any approval status (for admin overview).
 */
router.get("/all-registration-users", getAllRegistrationUsers);

/**
 * POST /api/admin/approve/:id
 * Approves a pending user. :id is the auth user UUID.
 */
router.post("/approve/:id", approveUser);

/**
 * POST /api/admin/reject/:id
 * Rejects a pending user. :id is the auth user UUID.
 */
router.post("/reject/:id", rejectUser);

module.exports = router;
