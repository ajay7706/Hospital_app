const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: { type: String, unique: true, sparse: true },
  password: String,
  role: {
    type: String,
    enum: ["patient", "hospital", "admin"],
    default: "patient",
  },
  hospitalAdded: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);










