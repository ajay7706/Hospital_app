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
  hospitalLogo: {
    type: String,
    required: true,
  },
  navbarIcon: {
    type: String,
  },
  adminName: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  contactNumber: {
    type: String,
    required: true,
    unique: true,
  },
  officialEmail: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    maxlength: 500,
  },
  specialties: [String],
  services: [
    {
      title: { type: String, required: true },
      description: { type: String, maxlength: 250 },
    },
  ],
  ambulanceAvailable: {
    type: Boolean,
    default: false,
  },
  dailyCapacity: {
    type: Number,
    min: 50,
    max: 300,
    default: 100,
  },
  workingDays: [String],
  openingTime: String,
  closingTime: String,
  appointmentSlots: {
    startTime: String,
    endTime: String,
  },
  emergency24x7: {
    type: Boolean,
    default: false,
  },

  // Step 2 Fields
  hospitalLicenseNumber: {
    type: String,
    required: true,
  },
  licenseCertificate: {
    type: String, // URL from Cloudinary
    required: true,
  },
  ownerIdProof: {
    type: String, // URL from Cloudinary
    required: true,
  },
  fullAddress: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  emergencyContactNumber: {
    type: String,
    required: true,
  },
  gallery: [{
    type: String,
  }], // max 4 images

  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  branchCapacity: {
    type: Number,
    min: 30,
    max: 300,
    default: 50,
  },
  opdCharge: {
    type: Number,
    default: 0,
  },
  gstNumber: {
    type: String,
    required: true,
  },
  gstDocument: {
    type: String, // Cloudinary URL
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("Hospital", hospitalSchema);
