const User = require("../models/Users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const adminCreds = require("../config/adminCredentials");
const OTP = require("../models/OTP");

// FORGOT PASSWORD - SEND OTP
exports.forgotPasswordSendOTP = async (req, res) => {
  try {
    const { identifier } = req.body; // email or phone
    const user = await User.findOne({ $or: [{ email: identifier }, { phone: identifier }] });
    
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Use identifier for OTP (if phone exists use phone, else email)
    const otpTarget = user.phone || user.email;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

    await OTP.deleteMany({ phone: otpTarget });
    await OTP.create({ phone: otpTarget, otp, expiresAt });

    console.log(`---------------------------------------`);
    console.log(`FORGOT PASSWORD OTP for ${otpTarget}: ${otp}`);
    console.log(`---------------------------------------`);

    res.json({ success: true, msg: "OTP sent successfully", target: otpTarget });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// RESET PASSWORD
exports.resetPassword = async (req, res) => {
  try {
    const { identifier, otp, newPassword } = req.body;
    
    const user = await User.findOne({ $or: [{ email: identifier }, { phone: identifier }] });
    if (!user) return res.status(404).json({ msg: "User not found" });

    const otpTarget = user.phone || user.email;
    const otpRecord = await OTP.findOne({ phone: otpTarget, otp });

    if (!otpRecord || new Date() > otpRecord.expiresAt) {
      return res.status(400).json({ msg: "Invalid or expired OTP" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    await OTP.deleteOne({ _id: otpRecord._id });

    res.json({ success: true, msg: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// SIGNUP
exports.signup = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // Branch role is NOT allowed via public signup
    if (role === "branch") {
      return res.status(403).json({ msg: "Branch staff cannot sign up directly" });
    }

    if (email) {
      const userExists = await User.findOne({ email });
      if (userExists) return res.status(400).json({ msg: "User with this email already exists" });
    }

    if (phone) {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) return res.status(400).json({ msg: "User with this phone number already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role,
    });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        hospitalAdded: user.hospitalAdded,
      },
      msg: "Signup successful",
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ msg: "Server error during signup", error: err.message });
  }
};

// CREATE BRANCH STAFF (By Hospital Admin)
exports.createBranchStaff = async (req, res) => {
  try {
    const { name, email, password, branchId } = req.body;
    
    // Only hospital role can create branch staff
    if (req.user.role !== "hospital") {
      return res.status(403).json({ msg: "Only hospital admin can create branch staff" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ msg: "Staff with this email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const staff = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "branch",
      branchId,
      hospitalId: req.user.hospitalId || req.body.hospitalId // hospitalId from token or body
    });

    res.status(201).json({ msg: "Branch staff created successfully", staffId: staff._id });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // 'identifier' can be email or phone

    // identifier check - could be email or phone
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    const isEmail = emailRegex.test(identifier);

    // ADMIN LOGIN CHECK
    if (isEmail && identifier === adminCreds.email && password === adminCreds.password) {
      const token = jwt.sign(
        { id: "admin-id", role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      return res.json({
        token,
        user: {
          id: "admin-id",
          name: "Administrator",
          email: adminCreds.email,
          role: "admin",
        },
        role: "admin",
        msg: "Admin login successful",
      });
    }

    // Find user by email or phone
    const user = await User.findOne({
      $or: [
        { email: identifier },
        { phone: identifier }
      ]
    });

    if (!user) return res.status(400).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined");
      return res.status(500).json({ msg: "Server configuration error" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        hospitalAdded: user.hospitalAdded,
      },
      msg: "Login successful",
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: "Server error during login", error: err.message });
  }
};