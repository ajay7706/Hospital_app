const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital",
    required: true,
  },
  branchName: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  image: {
    type: String, // Used in card
    required: true,
  },
  specialties: {
    type: String, // Comma separated list for now
  },
  ambulanceAvailable: {
    type: Boolean,
    default: false,
  },
  emergency24x7: {
    type: Boolean,
    default: false,
  },
  branchCapacity: {
    type: Number,
    min: 30,
    max: 300,
    default: 50,
  },
  opdChargeType: {
    type: String,
    enum: ["hospitalDefault", "custom"],
    default: "hospitalDefault",
  },
  opdCharge: {
    type: Number,
    default: 0,
  },
  gallery: {
    type: [String],
    default: [],
  },
  about: {
    type: String,
  },
  workingDays: {
    type: [String],
    default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  },
  openingTime: {
    type: String,
    default: "09:00 AM",
  },
  closingTime: {
    type: String,
    default: "08:00 PM",
  },
  startTime: {
    type: String,
    default: "09:00",
  },
  endTime: {
    type: String,
    default: "18:00",
  },
  emergencyContactNumber: {
    type: String,
  },
  services: [
    {
      title: String,
      description: String,
    }
  ],
}, { timestamps: true });

module.exports = mongoose.model("Branch", branchSchema);