const User = require("../models/Users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const adminCreds = require("../config/adminCredentials");

// SIGNUP
exports.signup = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

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