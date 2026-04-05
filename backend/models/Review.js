const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
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
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: true,
    maxlength: 500,
  },
  patientName: String,
}, { timestamps: true });

// Ensure one review per hospital per patient
reviewSchema.index({ patientId: 1, hospitalId: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
