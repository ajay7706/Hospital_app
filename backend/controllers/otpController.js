const OTP = require("../models/OTP");
const EmergencyLog = require("../models/EmergencyLog");
const axios = require("axios");

// Fast2SMS OTP integration
const sendSmsOTP = async (phone, otp) => {
  try {
    const apiKey = process.env.FAST2SMS_API_KEY;
    if (!apiKey) {
      console.error("FAST2SMS_API_KEY is missing in .env");
      return;
    }

    // Fast2SMS OTP API call
    const response = await axios.get(`https://www.fast2sms.com/dev/bulkV2`, {
      params: {
        authorization: apiKey,
        route: 'otp',
        variables_values: otp,
        numbers: phone,
      }
    });

    if (response.data.return === true) {
      console.log(`OTP ${otp} sent to ${phone} via Fast2SMS`);
    } else {
      console.error("Fast2SMS Error:", response.data.message);
    }
  } catch (error) {
    console.error("Failed to send SMS via Fast2SMS:", error.message);
  }
};

exports.generateOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ msg: "Phone number is required" });
    }

    // Rate limiting: max 3 OTPs per hour per phone
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentOTPs = await OTP.countDocuments({ phone, createdAt: { $gt: oneHourAgo } });
    
    if (recentOTPs >= 3) {
      return res.status(429).json({ msg: "Maximum OTP limit reached for this hour. Try again later." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins expiry

    await OTP.create({ phone, otp, expiresAt });
    
    // Send SMS asynchronously
    sendSmsOTP(phone, otp);

    res.json({ msg: "OTP sent successfully" });
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

    const otpRecord = await OTP.findOne({ phone, otp, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
    if (!otpRecord) {
      return res.status(400).json({ msg: "Invalid or expired OTP" });
    }

    otpRecord.verified = true;
    await otpRecord.save();

    res.json({ msg: "OTP verified successfully" });
  } catch (error) {
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