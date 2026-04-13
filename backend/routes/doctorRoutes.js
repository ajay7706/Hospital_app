const express = require("express");
const router = express.Router();
const { protect, isHospital } = require("../middlewares/authMiddleware");
const { upload } = require("../config/cloudinary");
const {
  addDoctor,
  getDoctorsByHospital,
  deleteDoctor
} = require("../controllers/doctorController");

router.post("/add", protect, isHospital, upload.single("image"), addDoctor);
router.get("/:hospitalId", getDoctorsByHospital);
router.delete("/:id", protect, isHospital, deleteDoctor);

module.exports = router;