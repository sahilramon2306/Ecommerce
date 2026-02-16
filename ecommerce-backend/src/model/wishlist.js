const mongoose = require("mongoose");


const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User_db",
      required: true,
      unique: true,
      index: true
    },

    productIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product_db"
      }
    ]
  },
  { timestamps: true }
);




module.exports = mongoose.model("Wishlist_db", wishlistSchema);
