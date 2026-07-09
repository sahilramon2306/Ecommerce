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
      type: Number,
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
    refundId: {
      type: String,
      default: ""
    },
    refundedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

/* ======================
   STATUS HISTORY SCHEMA
====================== */
const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true
    },
    note: {
      type: String,
      default: ""
    },
    changedAt: {
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

    refundAmount: {
      type: Number,
      default: 0,
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
        "out_for_delivery",
        "delivered",
        "cancelled",
        "returned"
      ],
      default: "placed",
      index: true
    },

    statusHistory: {
      type: [statusHistorySchema],
      default: [
        {
          status: "placed",
          note: "Order placed"
        }
      ]
    },

    /* ---------- CANCEL / RETURN ---------- */
    cancelReason: {
      type: String,
      default: ""
    },

    cancelledAt: {
      type: Date
    },

    returnReason: {
      type: String,
      default: ""
    },

    returnedAt: {
      type: Date
    },

    /* ---------- REFUND ---------- */
    refundStatus: {
      type: String,
      enum: ["not_requested", "requested", "processing", "processed", "failed"],
      default: "not_requested",
      index: true
    },

    refundFailureReason: {
      type: String,
      default: ""
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
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ refundStatus: 1 });

module.exports = mongoose.model("Order_db", orderSchema);