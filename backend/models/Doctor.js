const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
  },
  email: {
    type: String,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  specialization: {
    type: String,
    required: true,
  },
  experience: {
    type: Number, // in years
    default: 0,
  },
  availability: [
    {
      day: String,
      startTime: String,
      endTime: String,
    }
  ],
  image: String,
}, { timestamps: true });

module.exports = mongoose.model("Doctor", doctorSchema);