const express = require("express");
const router = express.Router();
const { protect, isHospital, isHospitalOrBranch } = require("../middlewares/authMiddleware");
const {
  bookAppointment,
  getPatientAppointments,
  getHospitalAppointments,
  updateAppointmentStatus,
} = require("../controllers/appointmentController");

// Appointment Routes
router.post("/book", protect, bookAppointment);
router.get("/patient", protect, getPatientAppointments);
router.get("/hospital", protect, isHospitalOrBranch, getHospitalAppointments);
router.put("/update/:id", protect, isHospitalOrBranch, updateAppointmentStatus);

module.exports = router;
