const jwt = require("jsonwebtoken");
const User = require("../models/Users");

exports.protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.id === "admin-id") {
        req.user = { id: "admin-id", role: "admin" };
      } else {
        req.user = await User.findById(decoded.id).select("-password");
      }

      if (req.user && req.user.isBlocked) {
        return res.status(403).json({ msg: "User account is blocked. Please contact support." });
      }

      next();
    } catch (error) {
      return res.status(401).json({ msg: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ msg: "Not authorized, no token" });
  }
};

exports.optionalProtect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.id === "admin-id") {
        req.user = { id: "admin-id", role: "admin" };
      } else {
        req.user = await User.findById(decoded.id).select("-password");
      }
      return next();
    } catch (error) {
      // Don't fail if token is invalid, just proceed as unauthenticated
      return next();
    }
  }
  next();
};

exports.isHospital = (req, res, next) => {
  if (req.user && req.user.role === "hospital") {
    next();
  } else {
    return res.status(401).json({ msg: "Not authorized as a hospital" });
  }
};

exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ msg: "Admin resource! Access denied." });
  }
};