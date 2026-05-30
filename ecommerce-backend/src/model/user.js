const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  houseNo: { type: String, trim: true },

  postOffice: { type: String, required: true, trim: true },
  policeStation: { type: String, required: true, trim: true },

  pincode: {
    type: String,
    required: true,
    trim: true,
    match: /^[1-9][0-9]{5}$/
  },

  state: { type: String, required: true, trim: true },
  district: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },

  addressLine: { type: String, required: true, trim: true },
  landmark: { type: String, trim: true },

  isDefault: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    password: { type: String, required: true },

    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer"
    },

    isBlocked: {
      type: Boolean,
      default: false
    },

    addresses: {
      type: [addressSchema],
      default: []
    },

    // 🔐 PASSWORD RESET FIELDS (NEW)
    resetPasswordOTP: { type: String },
    resetPasswordOTPExpire: { type: Date }
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { unique: true });

module.exports = mongoose.model("User_db", userSchema);
