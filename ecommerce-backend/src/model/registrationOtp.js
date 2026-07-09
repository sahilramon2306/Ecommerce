const mongoose = require("mongoose");

const registrationOtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },

    phone: {
      type: String,
      required: true,
      trim: true
    },

    userData: {
      type: Object,
      required: true
    },

    registrationOTP: {
      type: String,
      required: true
    },

    registrationOTPExpire: {
      type: Date,
      required: true
    },

    attempts: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

registrationOtpSchema.index(
  { registrationOTPExpire: 1 },
  { expireAfterSeconds: 0 }
);

module.exports = mongoose.model("Registration_OTP", registrationOtpSchema);