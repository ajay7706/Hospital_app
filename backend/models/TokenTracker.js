const mongoose = require("mongoose");

const tokenTrackerSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital",
    required: true,
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
    default: null
  },
  date: {
    type: String,
    required: true,
  },
  currentToken: {
    type: Number,
    default: 1,
  },
}, { timestamps: true });

// Index for performance
tokenTrackerSchema.index({ hospitalId: 1, branchId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("TokenTracker", tokenTrackerSchema);
