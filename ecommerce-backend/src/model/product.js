// src/model/product.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    description: {
      type: String,
      required: true,
      trim: true
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    salePrice: {
      type: Number,
      min: 0,
      validate: {
        validator: function (value) {
          return value <= this.price;
        },
        message: "Sale price cannot be greater than regular price"
      }
    },

   category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category_db",
      required: true
    },

  subCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category_db",
    required: true
  },

  childCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category_db",
    required: true
  },

    brand: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },

    soldCount: {
      type: Number,
      default: 0
    },

    lowStockThreshold: {
      type: Number,
      default: 5
    },

    trackStock: {
      type: Boolean,
      default: true
    },

    images: {
      type: [String],
      default: []
    },

    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },

    ratingCount: {
      type: Number,
      default: 0
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

/* Indexes */
productSchema.index({ name: "text", description: "text" });
productSchema.index({ price: 1 });
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });






module.exports = mongoose.model("Product_db", productSchema);
