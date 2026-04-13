const mongoose = require("mongoose");

const emergencyLogSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital",
  },
  ipAddress: {
    type: String,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
}, { timestamps: true });

module.exports = mongoose.model("EmergencyLog", emergencyLogSchema);