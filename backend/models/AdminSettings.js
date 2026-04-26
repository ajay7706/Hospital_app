const mongoose = require("mongoose");

const AdminSettingsSchema = new mongoose.Schema({
  // 1. GENERAL SETTINGS
  platformName: { type: String, default: "Clinoza" },
  platformLogo: { type: String },
  supportEmail: { type: String, default: "support@clinoza.com" },
  supportPhone: { type: String, default: "+91 98765 43210" },
  defaultCity: { type: String, default: "Lucknow" },

  // 2. OPD SETTINGS
  enableOpdFeeGlobally: { type: Boolean, default: true },
  defaultOpdFee: { type: Number, default: 0 },
  allowBranchOverride: { type: Boolean, default: true },

  // 3. APPOINTMENT SETTINGS
  maxBookingsPerDay: { type: Number, default: 300 },
  maxApprovalsPerDay: { type: Number, default: 200 },
  slotTimingMinutes: { type: Number, default: 15 },
  allowOverbooking: { type: Boolean, default: false },

  // 4. NOTIFICATION SETTINGS
  enableSms: { type: Boolean, default: false },
  enableEmail: { type: Boolean, default: true },
  enableWhatsApp: { type: Boolean, default: false },

  // 5. RATING SETTINGS
  enableRatingSystem: { type: Boolean, default: true },
  maxReminderCount: { type: Number, default: 2 },
  showOnlyVerifiedReviews: { type: Boolean, default: true },

  // 6. SECURITY SETTINGS
  autoLogoutTimeMinutes: { type: Number, default: 60 },
  enableSessionManagement: { type: Boolean, default: true },
  enableLoginProtection: { type: Boolean, default: true },

  // 7. DATA MANAGEMENT
  enableSoftDelete: { type: Boolean, default: true },

  // 8. API SETTINGS
  smsApiKey: { type: String },
  emailApiKey: { type: String },
  paymentGatewayKey: { type: String },

  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("AdminSettings", AdminSettingsSchema);
