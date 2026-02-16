const mongoose = require("mongoose");

const blacklistSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      index: true,
      unique: true,       
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 60 * 60 * 24 * 7   
    }
  },
  {
    collection: "blacklist_db",
    timestamps: false,
    versionKey: false,
    strict: true
  }
);


blacklistSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });

module.exports = mongoose.model("blacklist_db", blacklistSchema);

