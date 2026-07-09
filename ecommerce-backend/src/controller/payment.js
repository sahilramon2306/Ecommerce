const crypto = require("crypto");
const Razorpay = require("razorpay");
const userModel = require("../model/user.js");
const orderModel = require("../model/order");
const productModel = require("../model/product.js");
const generateInvoicePDF = require("../utils/generateInvoice");
const sendInvoiceEmail = require("../utils/sendInvoiceEmail");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const getAuthUserId = (req) => req.user?._id || req.user?.id || req.user?.userId;

const isSameId = (first, second) => {
  return String(first || "") === String(second || "");
};

const getErrorMessage = (error, fallback) => {
  return error?.error?.description || error?.message || fallback;
};

const pushHistory = (order, status, note = "") => {
  if (!Array.isArray(order.statusHistory)) {
    order.statusHistory = [];
  }

  order.statusHistory.push({
    status,
    note,
    changedAt: new Date()
  });
};

/* ======================
   CREATE RAZORPAY ORDER
====================== */
const createRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = getAuthUserId(req);

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

    if (userId && order.userId && !isSameId(order.userId, userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to pay for this order"
      });
    }

    if (order.paymentType !== "ONLINE") {
      return res.status(400).json({
        success: false,
        message: "Only ONLINE orders are allowed"
      });
    }

    if (["cancelled", "returned"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Payment is not allowed for cancelled or returned orders"
      });
    }

    if (["captured", "refunded"].includes(order.paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Payment already completed"
      });
    }

    const amount = Number(order.totalAmount);

    if (!amount || Number.isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order amount. Pricing is corrupted."
      });
    }

    if (order.razorpayOrderId) {
      return res.status(200).json({
        success: true,
        message: "Razorpay order already created",
        data: {
          id: order.razorpayOrderId,
          amount: Math.round(amount * 100),
          currency: "INR"
        }
      });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `order_${order._id}`,
      notes: {
        orderId: order._id.toString(),
        invoiceId: order.invoiceId || "",
        gstIncluded: "YES",
        subTotal: String(order.subTotal || 0),
        gstAmount: String(order.gstAmount || 0),
        totalAmount: String(order.totalAmount || 0)
      }
    });

    order.razorpayOrderId = razorpayOrder.id;
    order.paymentStatus = "authorized";
    pushHistory(order, "payment_authorized", "Razorpay order created");

    await order.save();

    return res.status(200).json({
      success: true,
      data: razorpayOrder
    });
  } catch (error) {
    console.error("Create Razorpay Order Error:", error);

    return res.status(500).json({
      success: false,
      message: getErrorMessage(error, "Failed to create Razorpay order")
    });
  }
};

/* ======================
   VERIFY PAYMENT
====================== */
const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    const userId = getAuthUserId(req);

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification data missing"
      });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature"
      });
    }

    let order = await orderModel.findOne({ razorpayOrderId: razorpay_order_id });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (userId && order.userId && !isSameId(order.userId, userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to verify this payment"
      });
    }

    if (order.paymentStatus === "captured") {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        data: order
      });
    }

    if (order.paymentStatus === "refunded") {
      return res.status(400).json({
        success: false,
        message: "This payment is already refunded"
      });
    }

    if (["cancelled", "returned"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Cannot verify payment for cancelled or returned order"
      });
    }

    order.paymentStatus = "captured";
    order.razorpayPaymentId = razorpay_payment_id;

    if (!order.invoiceId) {
      order.invoiceId = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      order.invoiceGeneratedAt = new Date();
    }

    pushHistory(order, "payment_captured", "Payment verified successfully");

    await order.save();

    order = await orderModel.findById(order._id).populate("items.productId");

    if (!order.invoiceUrl) {
      try {
        const invoice = await generateInvoicePDF(order);

        if (!invoice.filePath) {
          throw new Error("Invoice generation failed: file path missing");
        }

        order.invoiceUrl = `/invoices/${invoice.fileName}`;
        await order.save();

        const user = await userModel.findById(order.userId);

        if (user?.email) {
          try {
            const customerName = user.name || order.address?.name || "Customer";
            const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
            const orderTotal = Number(order.totalAmount || 0).toLocaleString("en-IN");
            const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric"
            });

            const invoiceEmailHtml = `
              <div style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#111827;">
                <div style="max-width:680px;margin:0 auto;padding:28px 16px;">
                  <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;box-shadow:0 16px 40px rgba(15,23,42,0.08);">
                    <div style="background:#0f766e;padding:26px 28px;color:#ffffff;">
                      <h1 style="margin:0;font-size:26px;line-height:1.2;">SahimonCart</h1>
                      <p style="margin:8px 0 0;font-size:15px;opacity:0.95;">Your invoice is ready</p>
                    </div>

                    <div style="padding:28px;">
                      <h2 style="margin:0 0 10px;font-size:22px;color:#111827;">Thank you for your order, ${customerName}</h2>

                      <p style="margin:0 0 22px;color:#4b5563;font-size:15px;line-height:1.7;">
                        Your payment has been verified successfully. We have attached your invoice PDF with this email.
                      </p>

                      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:18px;margin-bottom:22px;">
                        <table style="width:100%;border-collapse:collapse;">
                          <tr>
                            <td style="padding:7px 0;color:#6b7280;font-size:14px;">Order ID</td>
                            <td style="padding:7px 0;text-align:right;font-weight:700;color:#111827;font-size:14px;">${order._id}</td>
                          </tr>
                          <tr>
                            <td style="padding:7px 0;color:#6b7280;font-size:14px;">Invoice ID</td>
                            <td style="padding:7px 0;text-align:right;font-weight:700;color:#111827;font-size:14px;">${order.invoiceId}</td>
                          </tr>
                          <tr>
                            <td style="padding:7px 0;color:#6b7280;font-size:14px;">Order Date</td>
                            <td style="padding:7px 0;text-align:right;font-weight:700;color:#111827;font-size:14px;">${orderDate}</td>
                          </tr>
                          <tr>
                            <td style="padding:7px 0;color:#6b7280;font-size:14px;">Payment Method</td>
                            <td style="padding:7px 0;text-align:right;font-weight:700;color:#111827;font-size:14px;">${order.paymentType}</td>
                          </tr>
                          <tr>
                            <td style="padding:12px 0 0;color:#111827;font-size:16px;font-weight:700;border-top:1px solid #e5e7eb;">Total Paid</td>
                            <td style="padding:12px 0 0;text-align:right;color:#0f766e;font-size:20px;font-weight:800;border-top:1px solid #e5e7eb;">Rs. ${orderTotal}</td>
                          </tr>
                        </table>
                      </div>

                      <div style="text-align:center;margin:26px 0;">
                        <a href="${frontendUrl}/orders"
                          style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:13px 22px;border-radius:10px;font-size:14px;font-weight:700;">
                          View My Orders
                        </a>
                      </div>

                      <p style="margin:0;color:#4b5563;font-size:14px;line-height:1.7;">
                        Please keep the attached invoice for your records. If you have any questions, you can contact our support team.
                      </p>

                      <p style="margin:22px 0 0;color:#111827;font-size:14px;line-height:1.6;">
                        Regards,<br/>
                        <strong>Team SahimonCart</strong>
                      </p>
                    </div>
                  </div>

                  <p style="text-align:center;color:#94a3b8;font-size:12px;margin:16px 0 0;">
                    This is an automated email. Please do not reply.
                  </p>
                </div>
              </div>
            `;

            await sendInvoiceEmail({
              to: user.email,
              subject: "Your Invoice - SahimonCart",
              text: `Dear ${customerName},

Thank you for shopping with SahimonCart.

Your payment has been verified successfully and your invoice is attached with this email.

Order ID: ${order._id}
Invoice ID: ${order.invoiceId}
Total Paid: Rs. ${orderTotal}

Regards,
Team SahimonCart`,
              html: invoiceEmailHtml,
              attachmentPath: invoice.filePath,
              attachmentName: `${order.invoiceId}.pdf`
            });
          } catch (emailError) {
            console.warn("Invoice email not sent:", emailError.message);
          }
        } else {
          console.warn("Invoice email not sent: user email missing");
        }
      } catch (invoiceError) {
        console.error("Invoice generation error:", invoiceError);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: order
    });
  } catch (error) {
    console.error("Verify Payment Error:", error);

    return res.status(500).json({
      success: false,
      message: getErrorMessage(error, "Payment verification failed")
    });
  }
};

/* ======================
   RAZORPAY WEBHOOK
====================== */
const razorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    if (!secret) {
      return res.status(500).json({
        success: false,
        message: "Webhook secret is missing"
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature"
      });
    }

    const { event, payload } = req.body;

    if (event === "payment.captured") {
      const payment = payload?.payment?.entity;

      if (payment?.order_id && payment?.id) {
        const order = await orderModel.findOne({
          razorpayOrderId: payment.order_id
        });

        if (order && order.paymentStatus !== "captured") {
          order.paymentStatus = "captured";
          order.razorpayPaymentId = payment.id;
          pushHistory(order, "payment_captured", "Payment captured by Razorpay webhook");
          await order.save();
        }
      }
    }

    if (event === "refund.processed") {
      const refund = payload?.refund?.entity;

      if (refund?.payment_id) {
        const order = await orderModel.findOne({
          razorpayPaymentId: refund.payment_id
        });

        if (order && order.refundStatus !== "processed") {
          order.paymentStatus = "refunded";
          order.refundStatus = "processed";
          order.razorpayRefundId = refund.id;
          order.refundAmount = Number((refund.amount / 100).toFixed(2));
          order.refundedAt = new Date();
          order.refundFailureReason = "";
          pushHistory(order, "refund_processed", "Refund processed by Razorpay webhook");
          await order.save();
        }
      }
    }

    if (event === "refund.failed") {
      const refund = payload?.refund?.entity;

      if (refund?.payment_id) {
        const order = await orderModel.findOne({
          razorpayPaymentId: refund.payment_id
        });

        if (order) {
          order.refundStatus = "failed";
          order.refundFailureReason = refund.error_description || "Refund failed";
          pushHistory(order, "refund_failed", order.refundFailureReason);
          await order.save();
        }
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook Error:", error);

    return res.status(500).json({
      success: false,
      message: "Webhook error"
    });
  }
};

/* ======================
   FULL REFUND PAYMENT
   ADMIN ONLY
====================== */
const refundRazorpayPayment = async (req, res) => {
  let order = null;

  try {
    const { orderId } = req.params;

    order = await orderModel.findById(orderId).populate("items.productId");

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

    if (order.paymentStatus !== "captured") {
      return res.status(400).json({
        success: false,
        message: "Only captured payments can be refunded"
      });
    }

    if (!["returned", "cancelled"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Only cancelled or returned orders are eligible for refund"
      });
    }

    if (order.refundStatus === "processed") {
      return res.status(400).json({
        success: false,
        message: "Refund already processed"
      });
    }

    if (order.refundStatus === "processing") {
      return res.status(400).json({
        success: false,
        message: "Refund is already processing"
      });
    }

    if (!order.razorpayPaymentId) {
      return res.status(400).json({
        success: false,
        message: "Razorpay payment ID missing"
      });
    }

    const refundAmount = Number(order.refundAmount || order.totalAmount);

    if (!refundAmount || Number.isNaN(refundAmount) || refundAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid refund amount"
      });
    }

    order.refundStatus = "processing";
    order.refundAmount = refundAmount;
    order.refundFailureReason = "";
    pushHistory(order, "refund_processing", "Admin started refund processing");
    await order.save();

    const refund = await razorpay.payments.refund(order.razorpayPaymentId, {
      amount: Math.round(refundAmount * 100)
    });

    order.paymentStatus = "refunded";
    order.refundStatus = "processed";
    order.razorpayRefundId = refund.id;
    order.refundedAt = new Date();
    order.refundFailureReason = "";
    pushHistory(order, "refund_processed", "Full refund processed successfully");

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Refund processed successfully",
      refund,
      order
    });
  } catch (error) {
    const message = getErrorMessage(error, "Refund failed");

    console.error("Refund error:", error);

    if (order) {
      try {
        order.refundStatus = "failed";
        order.refundFailureReason = message;
        pushHistory(order, "refund_failed", message);
        await order.save();
      } catch (saveError) {
        console.error("Refund failure save error:", saveError);
      }
    }

    return res.status(500).json({
      success: false,
      message
    });
  }
};

/* ======================
   SINGLE ITEM REFUND
====================== */
const refundSingleItem = async (req, res) => {
  let order = null;

  try {
    const { orderId } = req.params;
    const { productId, quantity } = req.body;

    const refundQuantity = Number(quantity);

    if (!productId || !Number.isInteger(refundQuantity) || refundQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Product ID and valid quantity are required"
      });
    }

    order = await orderModel.findById(orderId).populate("items.productId");

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

    if (!order.razorpayPaymentId) {
      return res.status(400).json({
        success: false,
        message: "Razorpay payment ID missing"
      });
    }

    if (!["delivered", "returned"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Partial refund allowed only after delivery"
      });
    }

    const item = order.items.find((currentItem) => {
      const currentProductId = currentItem.productId?._id || currentItem.productId;
      return isSameId(currentProductId, productId);
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Product not found in order"
      });
    }

    const alreadyRefundedQty = order.refundedItems
      .filter((refundedItem) => isSameId(refundedItem.productId, productId))
      .reduce((sum, refundedItem) => sum + Number(refundedItem.quantity || 0), 0);

    const remainingQty = Number(item.quantity || 0) - alreadyRefundedQty;

    if (refundQuantity > remainingQty) {
      return res.status(400).json({
        success: false,
        message: `Refund quantity exceeds remaining refundable quantity (${remainingQty})`
      });
    }

    const refundAmount = Number((Number(item.price || 0) * refundQuantity).toFixed(2));

    if (!refundAmount || refundAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid refund amount"
      });
    }

    order.refundStatus = "processing";
    order.refundFailureReason = "";
    pushHistory(order, "refund_processing", "Admin started partial refund processing");
    await order.save();

    const refund = await razorpay.payments.refund(order.razorpayPaymentId, {
      amount: Math.round(refundAmount * 100)
    });

    if (order.orderStatus !== "returned") {
      await productModel.findByIdAndUpdate(productId, {
        $inc: { stock: refundQuantity }
      });
    }

    order.refundedItems.push({
      productId,
      quantity: refundQuantity,
      amount: refundAmount,
      refundId: refund.id,
      refundedAt: new Date()
    });

    order.refundAmount = Number((Number(order.refundAmount || 0) + refundAmount).toFixed(2));
    order.razorpayRefundId = refund.id;
    order.refundStatus = "processed";
    order.refundFailureReason = "";

    if (order.refundAmount >= Number(order.totalAmount || 0)) {
      order.paymentStatus = "refunded";
      order.refundedAt = new Date();
    }

    pushHistory(order, "partial_refund_processed", "Partial refund processed successfully");

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Partial refund processed successfully",
      refund,
      updatedOrder: order
    });
  } catch (error) {
    const message = getErrorMessage(error, "Partial refund failed");

    console.error("Partial refund error:", error);

    if (order) {
      try {
        order.refundStatus = "failed";
        order.refundFailureReason = message;
        pushHistory(order, "refund_failed", message);
        await order.save();
      } catch (saveError) {
        console.error("Partial refund failure save error:", saveError);
      }
    }

    return res.status(500).json({
      success: false,
      message
    });
  }
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  razorpayWebhook,
  refundRazorpayPayment,
  refundSingleItem
};