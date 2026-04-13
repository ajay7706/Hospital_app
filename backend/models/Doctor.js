const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital",
    required: true,
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
    required: true,
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