const mongoose = require("mongoose");


const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User_db",
      required: true,
      index: true
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product_db",
      required: true,
      index: true
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },

    review: {
      type: String,
      trim: true,
      maxlength: 1000
    },

    status: {
      type: String,
      enum: ["active", "hidden"],
      default: "active"
    }
  },
  { timestamps: true }
);



reviewSchema.index(
  { userId: 1, productId: 1 },
  { unique: true }
);




module.exports = mongoose.model("Review_db", reviewSchema);
