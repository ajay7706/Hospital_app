const express = require("express");
const router = express.Router();
const { protect, isAdmin } = require("../middlewares/authMiddleware");
const {
  getAdminAllHospitals,
  getPendingHospitals,
  approveHospital,
  rejectHospital,
  deleteHospital,
} = require("../controllers/hospitalController");

// All routes here are prefixed with /api/admin in app.js
// Protect all routes to ensure only admin can access
router.use(protect, isAdmin);

// Admin Dashboard routes
router.get("/hospital/all", getAdminAllHospitals);
router.get("/hospital/pending", getPendingHospitals);
router.patch("/hospital/:id/approve", approveHospital);
router.patch("/hospital/:id/reject", rejectHospital);
router.delete("/hospital/:id", deleteHospital);

module.exports = router;