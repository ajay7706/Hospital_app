const express = require("express");
const router = express.Router();
const { protect, isHospital } = require("../middlewares/authMiddleware");
const { upload } = require("../config/cloudinary");
const {
  addDoctor,
  getDoctorsByHospital,
  getBranchDoctors,
  deleteDoctor,
  getDoctorAppointments
} = require("../controllers/doctorController");

const { isDoctor } = require("../middlewares/authMiddleware");

router.post("/add", protect, isHospital, upload.single("image"), addDoctor);
router.get("/appointments", protect, isDoctor, getDoctorAppointments);
router.get("/branch/list", protect, getBranchDoctors);
router.get("/:hospitalId", getDoctorsByHospital);
router.delete("/:id", protect, isHospital, deleteDoctor);

module.exports = router;