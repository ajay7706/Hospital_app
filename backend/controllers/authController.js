const User = require("../models/Users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const adminCreds = require("../config/adminCredentials");

// SIGNUP
exports.signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ msg: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
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
    const { email, password } = req.body;

    // ADMIN LOGIN CHECK (From Separate File)
    if (email === adminCreds.email && password === adminCreds.password) {
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

    const user = await User.findOne({ email });
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
      },
      msg: "Login successful",
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: "Server error during login", error: err.message });
  }
};