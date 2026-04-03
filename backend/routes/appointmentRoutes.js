const express = require("express");
const router = express.Router();
const { protect, isHospital } = require("../middlewares/authMiddleware");
const {
  bookAppointment,
  getPatientAppointments,
  getHospitalAppointments,
  updateAppointmentStatus,
} = require("../controllers/appointmentController");

// Appointment Routes
router.post("/book", protect, bookAppointment);
router.get("/patient", protect, getPatientAppointments);
router.get("/hospital", protect, isHospital, getHospitalAppointments);
router.put("/update/:id", protect, isHospital, updateAppointmentStatus);

module.exports = router;
