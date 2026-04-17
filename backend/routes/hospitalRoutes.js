const express = require("express");
const router = express.Router();
const { protect, isHospital, isAdmin, optionalProtect } = require("../middlewares/authMiddleware");
const { upload } = require("../config/cloudinary");
const {
  addHospital,
  getAllHospitals,
  getHospitalById,
  updateHospitalProfile,
  getHospitalByUserId,
} = require("../controllers/hospitalController");

// Public routes
router.get("/all", getAllHospitals);
router.get("/me", protect, isHospital, getHospitalByUserId);
router.get("/:id", optionalProtect, getHospitalById);

const cpUpload = upload.fields([
  { name: 'hospitalLogo', maxCount: 1 },
  { name: 'navbarIcon', maxCount: 1 },
  { name: 'licenseCertificate', maxCount: 1 },
  { name: 'ownerIdProof', maxCount: 1 },
  { name: 'gstDocument', maxCount: 1 },
  { name: 'gallery', maxCount: 8 }
]);

// Hospital owner routes
router.post("/add", protect, isHospital, cpUpload, addHospital);
router.put("/update", protect, isHospital, cpUpload, updateHospitalProfile);

module.exports = router;
