const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital",
    required: true,
  },
  name: {
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
}, { timestamps: true });

module.exports = mongoose.model("Branch", branchSchema);