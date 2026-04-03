const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  hospitalName: {
    type: String,
    required: true,
  },
  hospitalLogo: String,
  adminName: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  address: String,
  contactNumber: {
    type: String,
    required: true,
  },
  officialEmail: {
    type: String,
    required: true,
  },
  hospitalId: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    maxlength: 500,
  },
  specialties: [String], // Array of strings
  services: [
    {
      title: { type: String, required: true },
      description: { type: String, maxlength: 250 },
    },
  ], // Array of objects
  workingDays: [String],
  openingTime: String,
  closingTime: String,
  emergency24x7: Boolean,
  ambulanceAvailable: {
    type: Boolean,
    default: false,
  },
  approvalStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
});

module.exports = mongoose.model("Hospital", hospitalSchema);
