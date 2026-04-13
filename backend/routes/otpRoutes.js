const express = require("express");
const router = express.Router();
const { generateOTP, verifyOTP, requestEmergency, getEmergencyRequests, updateEmergencyStatus } = require("../controllers/otpController");
const { protect, isHospital } = require("../middlewares/authMiddleware");

router.post("/generate", generateOTP);
router.post("/verify", verifyOTP);
router.post("/emergency", requestEmergency);
router.get("/emergency/:hospitalId", protect, isHospital, getEmergencyRequests);
router.put("/emergency/:id", protect, isHospital, updateEmergencyStatus);

module.exports = router;