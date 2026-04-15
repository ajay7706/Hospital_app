const express = require("express");
const router = express.Router();
const { generateOTP, verifyOTP, requestEmergency, getEmergencyRequests, updateEmergencyStatus } = require("../controllers/otpController");
const { protect, isHospital, isHospitalOrBranch } = require("../middlewares/authMiddleware");

router.post("/generate", generateOTP);
router.post("/verify", verifyOTP);
router.post("/emergency", requestEmergency);
router.get("/emergency/:hospitalId?", protect, isHospitalOrBranch, getEmergencyRequests);
router.put("/emergency/:id", protect, isHospitalOrBranch, updateEmergencyStatus);

module.exports = router;