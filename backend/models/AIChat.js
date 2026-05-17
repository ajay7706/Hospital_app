const mongoose = require("mongoose");

const aiChatSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: false,
  },
  userMessage: {
    type: String,
    required: true,
  },
  aiResponse: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: "7d",
  },
});

module.exports = mongoose.model("AIChat", aiChatSchema);
