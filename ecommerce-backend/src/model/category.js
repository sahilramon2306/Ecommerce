const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },

    image: {
      type: String,
      default: null
    },

    status: {
      type: Boolean,
      default: true,
      index: true
    },

    // Self-reference for subcategories
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category_db",
      default: null,
      index: true
    }
  },
  {
    timestamps: true
  }
);




categorySchema.index({ name: 1 });
categorySchema.index({ slug: 1 });


categorySchema.index({ parent: 1, status: 1 });


categorySchema.index(
  { name: 1, parent: 1 },
  { unique: true }
);

module.exports = mongoose.model("Category_db", categorySchema);
