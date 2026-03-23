const crypto = require("crypto");
const Razorpay = require("razorpay");
const userModel = require('../model/user.js');
const orderModel = require("../model/order");
const productModel = require('../model/product.js');
const generateInvoicePDF = require("../utils/generateInvoice");
const sendInvoiceEmail = require("../utils/sendInvoiceEmail");



const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

//--------------------------------------------------------------------------------------------------------
//CREATE RAZORPAY ORDER
const createRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "orderId is required"
      });
    }

    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (order.paymentType !== "ONLINE") {
      return res.status(400).json({
        success: false,
        message: "Only ONLINE orders allowed"
      });
    }

    if (order.razorpayOrderId) {
      return res.status(200).json({
        success: true,
        message: "Razorpay order already created",
        data: {
          id: order.razorpayOrderId,
          amount: Math.round(order.totalAmount * 100),
          currency: "INR"
        }
      });
    }

    if (["captured", "refunded"].includes(order.paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Payment already completed"
      });
    }

    const amount = Number(order.totalAmount);

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order amount. Pricing is corrupted."
      });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: "INR",
      receipt: `order_${order._id}`,
      notes: {
        orderId: order._id.toString(),
        invoiceId: order.invoiceId || "",
        gstIncluded: "YES",
        subTotal: order.subTotal,
        gstAmount: order.gstAmount,
        totalAmount: order.totalAmount
      }
    });

    order.razorpayOrderId = razorpayOrder.id;
    order.paymentStatus = "authorized"; // waiting for capture
    await order.save();

    return res.status(200).json({
      success: true,
      data: razorpayOrder
    });

  } catch (error) {
    console.error("Create Razorpay Order Error:", error);

    return res.status(500).json({
      success: false,
      message: error.error?.description || error.message || "Failed to create Razorpay order"
    });
  }
};


//--------------------------------------------------------------------------------------------------------
//VERIFY PAYMENT 
const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment verification data missing" });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    let order = await orderModel.findOne({ razorpayOrderId: razorpay_order_id });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.paymentStatus === "captured") {
      return res.status(400).json({ success: false, message: "Payment already captured" });
    }

    order.paymentStatus = "captured";
    order.razorpayPaymentId = razorpay_payment_id;

    if (!order.invoiceId) {
      order.invoiceId = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      order.invoiceGeneratedAt = new Date();
    }

    await order.save();

    order = await orderModel.findById(order._id).populate("items.productId");

    for (const item of order.items) {
      const product = await productModel.findById(item.productId._id);

      if (!product) continue;

      if (product.trackStock !== false) {
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }

        product.stock -= item.quantity;
        product.soldCount += item.quantity;

        if (product.stock === 0) {
          product.isActive = false;
        }

        await product.save();
      }
    }

    if (!order.invoiceUrl) {
      const invoice = await generateInvoicePDF(order);

      if (!invoice.filePath) {
        throw new Error("Invoice generation failed: file path missing");
      }

      order.invoiceUrl = `/invoices/${invoice.fileName}`;
      await order.save();

      const user = await userModel.findById(order.userId);

      if (user && user.email) {
        await sendInvoiceEmail({
          to: user.email,
          subject: "Your Invoice - Sahil's Ecommerce",
          text: `Hello ${order.address.fullName},

Thank you for shopping with SahimonCart.

Your invoice is attached with this email.

Order ID: ${order._id}

Regards,
Team SahimonCart`,
          attachmentPath: invoice.filePath
        });
      } else {
        console.warn("⚠ Email not sent: user email missing");
      }
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified, invoice generated, stock updated & emailed",
      data: order
    });

  } catch (error) {
    console.error("Verify Payment Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

//--------------------------------------------------------------------------------------------------------
// RAZORPAY WEBHOOK
const razorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(400).json({ success: false, message: "Invalid webhook signature" });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === "payment.captured") {
      const paymentId = payload.payment.entity.id;
      const orderId = payload.payment.entity.order_id;

      const order = await orderModel.findOne({ razorpayOrderId: orderId });
      if (order) {
        order.paymentStatus = "captured";
        order.razorpayPaymentId = paymentId;
        await order.save();
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    return res.status(500).json({ success: false, message: "Webhook error" });
  }
};

//--------------------------------------------------------------------------------------------------------
// REFUND PAYMENT (ADMIN)
const refundRazorpayPayment = async (req, res) => {
  try {

    const { orderId } = req.params;

    const order = await orderModel
      .findById(orderId)
      .populate("items.productId");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (order.paymentType !== "ONLINE") {
      return res.status(400).json({
        success: false,
        message: "Refund allowed only for ONLINE payments"
      });
    }

    if (!["returned", "cancelled"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Order not eligible for refund"
      });
    }

    if (order.refundStatus === "processed") {
      return res.status(400).json({
        success: false,
        message: "Refund already processed"
      });
    }

    if (!order.razorpayPaymentId) {
      return res.status(400).json({
        success: false,
        message: "Razorpay payment ID missing"
      });
    }

    /* Calculate refund amount from order */

    const refundAmount = Math.round(order.totalAmount * 100);

    console.log("Refund Amount (paise):", refundAmount);

    /* Create refund */

    const refund = await razorpay.payments.refund(
      order.razorpayPaymentId,
      {
        amount: refundAmount
      }
    );

    /* Update order */

    order.paymentStatus = "refunded";
    order.refundStatus = "processed";
    order.razorpayRefundId = refund.id;
    order.refundedAt = new Date();

    await order.save();

    /* Restore stock */

    for (const item of order.items) {
      await productModel.findByIdAndUpdate(
        item.productId._id,
        { $inc: { stock: item.quantity } }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Refund processed & stock restored successfully",
      refund
    });

  } catch (error) {

    console.error("Refund error:", error);

    return res.status(500).json({
      success: false,
      message:
        error?.error?.description ||
        error?.message ||
        "Refund failed"
    });

  }
};

//--------------------------------------------------------------------------------------------------------
// Refund Single Item
const refundSingleItem = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Product ID and valid quantity are required"
      });
    }

    const order = await orderModel
      .findById(orderId)
      .populate("items.productId");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (order.paymentType !== "ONLINE") {
      return res.status(400).json({
        success: false,
        message: "Partial refund allowed only for ONLINE payments"
      });
    }

    if (order.paymentStatus !== "captured") {
      return res.status(400).json({
        success: false,
        message: "Payment not captured yet"
      });
    }

    if (!["delivered", "returned"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Partial refund allowed only after delivery"
      });
    }

    const item = order.items.find(
      i => i.productId._id.toString() === productId
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Product not found in order"
      });
    }

    const alreadyRefundedQty = order.refundedItems
      .filter(r => r.productId.toString() === productId)
      .reduce((sum, r) => sum + r.quantity, 0);

    const remainingQty = item.quantity - alreadyRefundedQty;

    if (quantity > remainingQty) {
      return res.status(400).json({
        success: false,
        message: `Refund quantity exceeds remaining refundable quantity (${remainingQty})`
      });
    }

    const refundAmount = Number((item.price * quantity).toFixed(2));

    if (!refundAmount || refundAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid refund amount"
      });
    }

    const refund = await razorpay.payments.refund(
      order.razorpayPaymentId,
      { amount: Math.round(refundAmount * 100) }
    );

    await productModel.findByIdAndUpdate(
      productId,
      { $inc: { stock: quantity } },
      { new: true }
    );

    order.refundedItems.push({
      productId,
      quantity,
      amount: refundAmount,
      refundedAt: new Date()
    });

    order.totalAmount = Number(
      (order.totalAmount - refundAmount).toFixed(2)
    );

    const totalRefundedAmount = order.refundedItems.reduce(
      (sum, r) => sum + r.amount,
      0
    );

    if (totalRefundedAmount >= order.totalAmount) {
      order.paymentStatus = "refunded";
      order.refundStatus = "processed";
    } else {
      order.paymentStatus = "captured";
      order.refundStatus = "processed";
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Partial refund processed successfully",
      refund,
      updatedOrder: order
    });

  } catch (error) {
    console.error("Partial refund error:", error);

    return res.status(500).json({
      success: false,
      message: error.error?.description || error.message || "Partial refund failed"
    });
  }
};



//=================================================================================================
//=================================================================================================
//=================================================================================================
module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  razorpayWebhook,
  refundRazorpayPayment,
  refundSingleItem
};
