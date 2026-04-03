const express = require("express");
const router = express.Router();
const { protect, isHospital, isAdmin, optionalProtect } = require("../middlewares/authMiddleware");
const {
  addHospital,
  getAllHospitals,
  getHospitalById,
  updateHospitalProfile,
} = require("../controllers/hospitalController");

// Public routes
router.get("/all", getAllHospitals);
router.get("/:id", optionalProtect, getHospitalById);

// Hospital owner routes
router.post("/add", protect, isHospital, addHospital);
router.put("/update", protect, isHospital, updateHospitalProfile);

module.exports = router;
