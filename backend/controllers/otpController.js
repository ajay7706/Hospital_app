const OTP = require("../models/OTP");
const EmergencyLog = require("../models/EmergencyLog");
const axios = require("axios");

// DEVELOPMENT MODE OTP system - No external SMS API used
const sendSmsOTP = async (phone, otp) => {
  // Log OTP for development/testing
  // Visible in local console and Render logs
  console.log("---------------------------------------");
  console.log(`DEVELOPMENT OTP for ${phone}: ${otp}`);
  console.log("---------------------------------------");
  
  if (process.env.NODE_ENV !== "production") {
    // Extra log for non-production environments
    console.log(`[DEV ONLY] OTP for ${phone}: ${otp}`);
  }
};

exports.generateOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ msg: "Phone number is required" });
    }

    // Overwrite old OTP if new request comes for the same phone
    await OTP.deleteMany({ phone });

    // Generate 4 or 6 digit OTP (using 6 digits as per previous implementation but can be 4)
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); 
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 mins expiry as requested

    await OTP.create({ 
      phone, 
      otp, 
      expiresAt,
      attempts: 0 
    });
    
    // Log OTP to console/logs
    await sendSmsOTP(phone, otp);

    res.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("OTP Generate Error:", error);
    res.status(500).json({ msg: "Server error during OTP generation", error: error.message });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ msg: "Phone and OTP are required" });
    }

    const otpRecord = await OTP.findOne({ phone }).sort({ createdAt: -1 });
    
    if (!otpRecord) {
      return res.status(400).json({ msg: "OTP not found. Please request a new one." });
    }

    // Check expiry
    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ msg: "OTP expired. Please request a new one." });
    }

    // Check attempts
    if (otpRecord.attempts >= 3) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ msg: "Too many failed attempts. Please request a new OTP." });
    }

    // Match OTP
    if (otpRecord.otp !== otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ msg: `Invalid OTP. ${3 - otpRecord.attempts} attempts remaining.` });
    }

    // If valid: Delete OTP and return success
    await OTP.deleteOne({ _id: otpRecord._id });

    res.json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    console.error("OTP Verify Error:", error);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

exports.requestEmergency = async (req, res) => {
  try {
    const { phone, hospitalId } = req.body;
    if (!phone || !hospitalId) {
      return res.status(400).json({ msg: "Phone and hospital ID are required" });
    }

    // Rate limiting: max 2 emergencies per day per IP/Phone
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const emergenciesToday = await EmergencyLog.countDocuments({ phone, createdAt: { $gt: todayStart } });
    if (emergenciesToday >= 2) {
      return res.status(429).json({ msg: "Emergency request limit reached for today." });
    }

    // Ensure OTP was verified recently
    const recentVerifiedOTP = await OTP.findOne({ phone, verified: true, createdAt: { $gt: new Date(Date.now() - 10 * 60 * 1000) } });
    if (!recentVerifiedOTP) {
      return res.status(401).json({ msg: "Please verify phone number with OTP first" });
    }

    const log = await EmergencyLog.create({
      phone,
      hospitalId,
      ipAddress: req.ip,
      status: "pending"
    });

    res.status(201).json({ msg: "Emergency requested", logId: log._id });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

exports.getEmergencyRequests = async (req, res) => {
  try {
    const logs = await EmergencyLog.find({ hospitalId: req.params.hospitalId }).sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

exports.updateEmergencyStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const log = await EmergencyLog.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(log);
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};