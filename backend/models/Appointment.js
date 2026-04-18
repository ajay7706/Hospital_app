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
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
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
    enum: [
      "Waiting",
      "Confirmed",
      "In Consultation",
      "Lab Pending",
      "Completed",
      "Rescheduled",
      "Not Selected",
      "Not Selected Today",
      "pending",
      "approved",
      "completed",
      "cancelled"
    ],
    default: "Waiting",
  },
  tokenNumber: {
    type: Number,
    default: 0
  },
  type: {
    type: String,
    enum: ["Normal", "Emergency"],
    default: "Normal"
  },
  opdCharge: {
    type: Number,
    default: 0
  },
  patientName: String,
  patientEmail: String,
  phone: String,
  problem: String,
  hospitalName: String,
  location: String,
  ambulanceRequired: {
    type: Boolean,
    default: false,
  },
  assignedDoctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
  },
  assignedDoctorName: String,
  isRated: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model("Appointment", appointmentSchema);
