const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital",
    required: true,
  },
  date: {
    type: String, // Storing as string for simplicity with time
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "completed"],
    default: "pending",
  },
  patientName: String,
  patientEmail: String,
  phone: String,
});

module.exports = mongoose.model("Appointment", appointmentSchema);
