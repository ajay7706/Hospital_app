const express = require("express");
const router = express.Router();
const { protect, isHospital, isHospitalOrBranch } = require("../middlewares/authMiddleware");
const { upload } = require("../config/cloudinary");
const {
  addDoctor,
  getDoctorsByHospital,
  getBranchDoctors,
  getDoctorsByBranch,
  deleteDoctor,
  getDoctorAppointments
} = require("../controllers/doctorController");

const { isDoctor } = require("../middlewares/authMiddleware");

router.post("/add", protect, isHospitalOrBranch, upload.single("image"), addDoctor);
router.get("/appointments", protect, isDoctor, getDoctorAppointments);
router.get("/branch/list", protect, getBranchDoctors);
router.get("/branch/:branchId", getDoctorsByBranch);
router.get("/:hospitalId", getDoctorsByHospital);
router.delete("/:id", protect, isHospitalOrBranch, deleteDoctor);

module.exports = router;