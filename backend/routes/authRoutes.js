const express = require("express");
const router = express.Router();

const { signup, login, createBranchStaff, forgotPasswordSendOTP, resetPassword } = require("../controllers/authController");
const { protect, isHospital } = require("../middlewares/authMiddleware");

router.post("/signup", signup);
router.post("/login", login);
router.post("/create-branch-staff", protect, isHospital, createBranchStaff);
router.post("/forgot-password-otp", forgotPasswordSendOTP);
router.post("/reset-password", resetPassword);

module.exports = router;