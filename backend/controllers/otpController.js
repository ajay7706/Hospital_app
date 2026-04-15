const OTP = require("../models/OTP");
const EmergencyLog = require("../models/EmergencyLog");
const Hospital = require("../models/Hospital");

// DEVELOPMENT MODE OTP system
const sendSmsOTP = async (phone, otp) => {
  console.log("---------------------------------------");
  console.log(`DEVELOPMENT OTP for ${phone}: ${otp}`);
  console.log("---------------------------------------");
};

exports.generateOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ msg: "Phone number is required" });
    await OTP.deleteMany({ phone });
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); 
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000);
    await OTP.create({ phone, otp, expiresAt, attempts: 0 });
    await sendSmsOTP(phone, otp);
    res.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ msg: "Server error during OTP generation", error: error.message });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ msg: "Phone and OTP are required" });
    const otpRecord = await OTP.findOne({ phone }).sort({ createdAt: -1 });
    if (!otpRecord) return res.status(400).json({ msg: "OTP not found." });
    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ msg: "OTP expired." });
    }
    if (otpRecord.otp !== otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ msg: "Invalid OTP" });
    }
    otpRecord.verified = true;
    await otpRecord.save();
    res.json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

exports.requestEmergency = async (req, res) => {
  try {
    const { phone, hospitalId, branchId } = req.body;
    if (!phone || !hospitalId) return res.status(400).json({ msg: "Phone and hospital ID are required" });

    // Rate limit
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const count = await EmergencyLog.countDocuments({ phone, createdAt: { $gt: todayStart } });
    if (count >= 3) return res.status(429).json({ msg: "Daily limit reached" });

    const verified = await OTP.findOne({ phone, verified: true, createdAt: { $gt: new Date(Date.now() - 10 * 60 * 1000) } });
    if (!verified) return res.status(401).json({ msg: "Please verify phone first" });

    const log = await EmergencyLog.create({
      phone,
      hospitalId,
      branchId: branchId || null,
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
    let filter = {};
    if (req.user.role === "hospital") {
      const hospital = await Hospital.findOne({ userId: req.user.id });
      if (hospital) filter.hospitalId = hospital._id;
    } else if (req.user.role === "branch") {
      filter.branchId = req.user.branchId;
    }

    const logs = await EmergencyLog.find(filter).sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

exports.updateEmergencyStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const log = await EmergencyLog.findById(req.params.id);
    if (!log) return res.status(404).json({ msg: "Not found" });

    // PERMISSION CHECK
    if (req.user.role === "hospital") {
      if (log.branchId) return res.status(403).json({ msg: "Main hospital can only view branch emergency requests." });
    } else if (req.user.role === "branch") {
      if (log.branchId?.toString() !== req.user.branchId) return res.status(403).json({ msg: "Access denied." });
    }

    log.status = status;
    await log.save();
    res.json(log);
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};