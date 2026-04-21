const express = require("express");
const router = express.Router();
const { protect, isHospital, isHospitalOrBranch, isHospitalBranchOrDoctor } = require("../middlewares/authMiddleware");
const {
  bookAppointment,
  getPatientAppointments,
  getHospitalAppointments,
  updateAppointmentStatus,
  checkAvailability,
  getNowServing,
  trackAppointment,
  getSlotOccupancy
} = require("../controllers/appointmentController");



// Appointment Routes
router.post("/book", protect, bookAppointment);
router.get("/patient", protect, getPatientAppointments);
router.get("/hospital", protect, isHospitalOrBranch, getHospitalAppointments);
router.get("/availability", checkAvailability);
router.put("/update/:id", protect, isHospitalBranchOrDoctor, updateAppointmentStatus);

router.get("/now-serving", getNowServing);
router.get("/track/:token", trackAppointment);
router.get("/track-appointment", trackAppointment);
router.get("/slot-occupancy", getSlotOccupancy);

module.exports = router;
