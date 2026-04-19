const express = require("express");
const router = express.Router();
const { protect, isAdmin } = require("../middlewares/authMiddleware");
const {
  getAdminAllHospitals,
  getPendingHospitals,
  approveHospital,
  rejectHospital,
  deleteHospital,
  getAdminStats,
  toggleBlockUser,
  getAllUsers,
  getAllAppointments,
  cancelAppointmentOverride,
  getAllReviews,
  deleteReview,
  getAdminSettings,
  updateAdminSettings,
  getHospitalBranchesDetail
} = require("../controllers/hospitalController");

// All routes here are prefixed with /api/admin in app.js
// Protect all routes to ensure only admin can access
router.use(protect, isAdmin);

// Admin Dashboard routes
router.get("/stats", getAdminStats);
router.get("/hospital/all", getAdminAllHospitals);
router.get("/hospital/pending", getPendingHospitals);
router.patch("/hospital/:id/approve", approveHospital);
router.patch("/hospital/:id/reject", rejectHospital);
router.delete("/hospital/:id", deleteHospital);

// User Management
router.get("/users", getAllUsers);
router.patch("/user/:id/toggle-block", toggleBlockUser);

// Appointment Management
router.get("/appointments", getAllAppointments);
router.patch("/appointment/:id/cancel", cancelAppointmentOverride);

// Review Management
router.get("/reviews", getAllReviews);
router.delete("/review/:id", deleteReview);

// Platform Settings
router.get("/settings", getAdminSettings);
router.patch("/settings", updateAdminSettings);

// Detailed Hospital Insights
router.get("/hospital/:id/branches", getHospitalBranchesDetail);

module.exports = router;