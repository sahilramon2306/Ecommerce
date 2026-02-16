const mongoose = require("mongoose");

/* ======================
   ORDER ITEM SCHEMA
====================== */
const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product_db",
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number, // snapshot price
      required: true,
      min: 0
    }
  },
  { _id: false }
);

/* ======================
   REFUNDED ITEM SCHEMA
====================== */
const refundedItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product_db",
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    refundedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

/* ======================
   ORDER SCHEMA
====================== */
const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User_db",
      required: true,
      index: true
    },

    items: {
      type: [orderItemSchema],
      required: true
    },

    refundedItems: {
      type: [refundedItemSchema],
      default: []
    },

    /* ---------- AMOUNTS ---------- */
    subTotal: {
      type: Number,
      required: true,
      min: 0
    },

    gstRate: {
      type: Number,
      required: true,
      default: 18
    },

    cgstRate: {
      type: Number,
      required: true
    },

    sgstRate: {
      type: Number,
      required: true
    },

    cgstAmount: {
      type: Number,
      required: true,
      min: 0
    },

    sgstAmount: {
      type: Number,
      required: true,
      min: 0
    },

    gstAmount: {
      type: Number,
      required: true,
      min: 0
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },

    /* ---------- PAYMENT ---------- */
    paymentType: {
      type: String,
      enum: ["COD", "ONLINE"],
      required: true
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "authorized", "captured", "failed", "refunded"],
      default: "pending"
    },

    razorpayOrderId: {
      type: String,
      index: true
    },

    razorpayPaymentId: {
      type: String
    },

    razorpayRefundId: {
      type: String
    },

    /* ---------- ORDER STATUS ---------- */
    orderStatus: {
      type: String,
      enum: [
        "placed",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
        "returned"
      ],
      default: "placed"
    },

    statusHistory: [
      {
        status: {
          type: String,
          required: true
        },
        changedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    refundStatus: {
      type: String,
      enum: ["not_requested", "requested", "processed"],
      default: "not_requested"
    },

    refundedAt: {
      type: Date
    },

    /* ---------- INVOICE ---------- */
    invoiceId: {
    type: String,
    default: undefined
  },

    invoiceUrl: {
      type: String
    },

    invoiceGeneratedAt: {
      type: Date
    },

    /* ---------- ADDRESS ---------- */
    address: {
      name: String,
      phone: String,
      addressLine: String,
      city: String,
      district: String,
      state: String,
      pincode: String
    }
  },
  { timestamps: true }
);

/* ======================
   INDEXES
====================== */
orderSchema.index({ userId: 1 });
orderSchema.index({ razorpayOrderId: 1 });

module.exports = mongoose.model("Order_db", orderSchema);
