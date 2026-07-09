const orderModel = require("../model/order");
const productModel = require("../model/product");
const cartModel = require("../model/cart");
const userModel = require("../model/user");
const sendEmail = require("../utils/sendEmail");


const ORDER_STATUSES = [
  "placed",
  "confirmed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned"
];

const PAYMENT_STATUSES = [
  "pending",
  "authorized",
  "captured",
  "failed",
  "refunded"
];

const orderProductPopulate = {
  path: "items.productId",
  select: "name brand images price salePrice description stock isActive"
};

const getAuthUserId = (req) => {
  return req.user?._id || req.user?.id || req.user?.userId;
};

const isSameId = (first, second) => {
  return String(first || "") === String(second || "");
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

const getSellingPrice = (product) => {
  const salePrice = Number(product?.salePrice || 0);
  const price = Number(product?.price || 0);

  return salePrice > 0 ? salePrice : price;
};

const restoreOrderStock = async (order) => {
  for (const item of order.items || []) {
    const productId = item.productId?._id || item.productId;

    if (!productId) continue;

    await productModel.findByIdAndUpdate(productId, {
      $inc: { stock: Number(item.quantity || 0) },
      $set: { isActive: true }
    });
  }
};

const requestRefundIfNeeded = (order, noteStatus) => {
  if (order.paymentType === "ONLINE" && order.paymentStatus === "captured") {
    order.refundStatus = "requested";
    order.refundAmount = Number(order.totalAmount || 0);
    pushHistory(order, noteStatus, "Refund requested for online payment");
  }
};

/* ======================
   CREATE ORDER FROM CART
====================== */
const createOrderFromCart = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { address, shippingAddress } = req.body;
    const paymentType = String(req.body.paymentType || "COD").toUpperCase();
    const finalAddress = address || shippingAddress;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    if (!["COD", "ONLINE"].includes(paymentType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment type"
      });
    }

    if (!finalAddress) {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required"
      });
    }

    const cart = await cartModel
      .findOne({ userId })
      .populate({
        path: "items.productId",
        select: "name price salePrice stock trackStock isActive"
      });

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty"
      });
    }

    const orderItems = [];
    let subTotal = 0;

    for (const cartItem of cart.items) {
      const product = cartItem.productId;
      const quantity = Number(cartItem.quantity || 0);

      if (!product) {
        return res.status(400).json({
          success: false,
          message: "Product not found in cart"
        });
      }

      if (!product.isActive) {
        return res.status(400).json({
          success: false,
          message: `${product.name} is not available`
        });
      }

      if (quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid product quantity"
        });
      }

      if (product.trackStock !== false && Number(product.stock || 0) < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`
        });
      }

      const price = getSellingPrice(product);

      orderItems.push({
        productId: product._id,
        quantity,
        price
      });

      subTotal += price * quantity;
    }

    const gstRate = 18;
    const cgstRate = 9;
    const sgstRate = 9;
    const gstAmount = Number(((subTotal * gstRate) / 100).toFixed(2));
    const cgstAmount = Number((gstAmount / 2).toFixed(2));
    const sgstAmount = Number((gstAmount / 2).toFixed(2));
    const totalAmount = Number((subTotal + gstAmount).toFixed(2));

    const order = await orderModel.create({
      userId,
      items: orderItems,
      subTotal: Number(subTotal.toFixed(2)),
      gstRate,
      cgstRate,
      sgstRate,
      cgstAmount,
      sgstAmount,
      gstAmount,
      totalAmount,
      paymentType,
      paymentStatus: paymentType === "COD" ? "pending" : "pending",
      orderStatus: "placed",
      refundStatus: "not_requested",
      refundAmount: 0,
      address: finalAddress,
      statusHistory: [
        {
          status: "placed",
          note: "Order placed",
          changedAt: new Date()
        }
      ]
    });

    for (const item of orderItems) {
      const product = await productModel.findById(item.productId);

      if (product && product.trackStock !== false) {
        product.stock = Number(product.stock || 0) - Number(item.quantity || 0);
        product.soldCount = Number(product.soldCount || 0) + Number(item.quantity || 0);

        if (product.stock <= 0) {
          product.stock = 0;
          product.isActive = false;
        }

        await product.save();
      }
    }

    cart.items = [];
    await cart.save();

    const populatedOrder = await orderModel
      .findById(order._id)
      .populate(orderProductPopulate);

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: populatedOrder
    });
  } catch (error) {
    console.error("Create Order From Cart Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create order"
    });
  }
};

/* ======================
   CUSTOMER ORDERS
====================== */
const getUserOrders = async (req, res) => {
  try {
    const userId = getAuthUserId(req);

    const orders = await orderModel
      .find({ userId })
      .populate(orderProductPopulate)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    console.error("Get User Orders Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user orders"
    });
  }
};

const getSingleOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = getAuthUserId(req);

    const order = await orderModel
      .findOne({ _id: orderId, userId })
      .populate(orderProductPopulate);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    return res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error("Get Single Order Details Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order details"
    });
  }
};

const trackOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = getAuthUserId(req);

    const order = await orderModel
      .findOne({ _id: orderId, userId })
      .select("orderStatus paymentStatus refundStatus statusHistory createdAt updatedAt");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    return res.status(200).json({
      success: true,
      tracking: {
        orderId: order._id,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        refundStatus: order.refundStatus,
        statusHistory: order.statusHistory,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      }
    });
  } catch (error) {
    console.error("Track Order Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to track order"
    });
  }
};

// ===================================================================================================
// CANCEL ORDER
const cancelOrder = async (req, res) => {
  try {

    const { orderId } = req.params;
    const { reason = "" } = req.body;

    const userId = getAuthUserId(req);

    const order = await orderModel.findOne({
      _id: orderId,
      userId
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (!["placed", "confirmed"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Only placed or confirmed orders can be cancelled"
      });
    }

    // ======================
    // UPDATE ORDER
    // ======================

    order.orderStatus = "cancelled";
    order.cancelReason = reason;
    order.cancelledAt = new Date();

    pushHistory(
      order,
      "cancelled",
      reason || "Order cancelled by customer"
    );

    requestRefundIfNeeded(order, "refund_requested");

    // ======================
    // RESTORE STOCK
    // ======================

    await restoreOrderStock(order);

    // ======================
    // SAVE ORDER
    // ======================

    await order.save();

    // ======================
    // GET USER
    // ======================

    const user = await userModel.findById(userId);

    // ======================
    // SEND EMAIL
    // ======================

    if (user?.email) {

      await sendEmail({

        to: user.email,

        subject: `Order Cancelled - ${order._id}`,

        html: `
        <!DOCTYPE html>
        <html>

        <body style="
          margin:0;
          padding:0;
          background:#f4f7fb;
          font-family:Arial,sans-serif;
        ">

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="padding:40px 15px;">

                <table width="600" cellpadding="0" cellspacing="0" style="
                  background:#ffffff;
                  border-radius:18px;
                  overflow:hidden;
                  box-shadow:0 10px 30px rgba(0,0,0,0.08);
                ">

                 
                  <tr>
                    <td style="
                      background:#dc2626;
                      padding:35px;
                      text-align:center;
                    ">

                      <h1 style="
                        color:#ffffff;
                        margin:0;
                        font-size:30px;
                      ">
                        Order Cancelled
                      </h1>

                    </td>
                  </tr>

                  
                  <tr>
                    <td style="padding:40px;">

                      <h2 style="
                        color:#111827;
                        margin-top:0;
                      ">
                        Hello ${user.name},
                      </h2>

                      <p style="
                        color:#4b5563;
                        font-size:16px;
                        line-height:28px;
                      ">
                        Your order has been cancelled successfully.
                      </p>

                      <div style="
                        background:#f9fafb;
                        border-radius:12px;
                        padding:20px;
                        margin:25px 0;
                      ">

                        <p>
                          <strong>Order ID:</strong>
                          ${order._id}
                        </p>

                        <p>
                          <strong>Total Amount:</strong>
                          ₹${order.totalAmount}
                        </p>

                        <p>
                          <strong>Payment Type:</strong>
                          ${order.paymentType}
                        </p>

                        <p>
                          <strong>Refund Status:</strong>
                          ${order.refundStatus}
                        </p>

                      </div>

                      <p style="
                        color:#6b7280;
                        font-size:15px;
                        line-height:26px;
                        margin-top:30px;
                      ">
                        If payment was completed online,
                        your refund will be processed soon.
                      </p>

                    </td>
                  </tr>

                  
                  <tr>
                    <td style="
                      background:#f8fafc;
                      padding:25px;
                      text-align:center;
                      border-top:1px solid #e5e7eb;
                    ">

                      <p style="
                        margin:0;
                        color:#94a3b8;
                        font-size:13px;
                      ">
                        © 2026 SahimonCart. All rights reserved.
                      </p>

                    </td>
                  </tr>

                </table>

              </td>
            </tr>
          </table>

        </body>
        </html>
        `
      });

    }

    // ======================
    // RESPONSE
    // ======================

    return res.status(200).json({
      success: true,

      message:
        order.refundStatus === "requested"
          ? "Order cancelled successfully. Refund request sent to admin."
          : "Order cancelled successfully.",

      order
    });

  } catch (error) {

    console.error("Cancel Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to cancel order"
    });

  }
};

//=======================================
const returnOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason = "" } = req.body;
    const userId = getAuthUserId(req);

    const order = await orderModel.findOne({ _id: orderId, userId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (order.orderStatus !== "delivered") {
      return res.status(400).json({
        success: false,
        message: "Only delivered orders can be returned"
      });
    }

    order.orderStatus = "returned";
    order.returnReason = reason;
    order.returnedAt = new Date();

    pushHistory(order, "returned", reason || "Order returned by customer");
    requestRefundIfNeeded(order, "refund_requested");

    await restoreOrderStock(order);
    await order.save();

    return res.status(200).json({
      success: true,
      message:
        order.refundStatus === "requested"
          ? "Order returned successfully. Refund request sent to admin."
          : "Order returned successfully.",
      order
    });
  } catch (error) {
    console.error("Return Order Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to return order"
    });
  }
};

/* ======================
   ADMIN ORDERS
====================== */
const getAllOrdersAdmin = async (req, res) => {
  try {
    const orders = await orderModel
      .find({})
      .populate(orderProductPopulate)
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    console.error("Get All Orders Admin Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin orders"
    });
  }
};

const getOrderByIdAdmin = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await orderModel
      .findById(orderId)
      .populate(orderProductPopulate)
      .populate("userId", "name email phone");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    return res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error("Get Order By Id Admin Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin order"
    });
  }
};

const updateOrderStatusAdmin = async (req, res) => {
  try {
    const { orderId } = req.params;
    const nextStatus = req.body.orderStatus || req.body.status;

    if (!ORDER_STATUSES.includes(nextStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status"
      });
    }

    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    const previousStatus = order.orderStatus;

    if (previousStatus === nextStatus) {
      return res.status(200).json({
        success: true,
        message: "Order status already updated",
        order
      });
    }

    order.orderStatus = nextStatus;

    if (nextStatus === "cancelled") {
      order.cancelledAt = order.cancelledAt || new Date();
    }

    if (nextStatus === "returned") {
      order.returnedAt = order.returnedAt || new Date();
    }

    const movedToStockReturnStatus =
      ["cancelled", "returned"].includes(nextStatus) &&
      !["cancelled", "returned"].includes(previousStatus);

    if (movedToStockReturnStatus) {
      await restoreOrderStock(order);
      requestRefundIfNeeded(order, "refund_requested");
    }

    pushHistory(order, nextStatus, `Admin changed status from ${previousStatus} to ${nextStatus}`);

    await order.save();

    const populatedOrder = await orderModel
      .findById(order._id)
      .populate(orderProductPopulate)
      .populate("userId", "name email phone");

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order: populatedOrder
    });
  } catch (error) {
    console.error("Update Order Status Admin Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update order status"
    });
  }
};

const updatePaymentStatusAdmin = async (req, res) => {
  try {
    const { orderId } = req.params;
    const nextStatus = req.body.paymentStatus || req.body.status;

    if (!PAYMENT_STATUSES.includes(nextStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status"
      });
    }

    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    const previousStatus = order.paymentStatus;
    order.paymentStatus = nextStatus;

    if (nextStatus === "refunded") {
      order.refundStatus = "processed";
      order.refundAmount = order.refundAmount || order.totalAmount;
      order.refundedAt = order.refundedAt || new Date();
    }

    pushHistory(order, "payment_status_updated", `Admin changed payment from ${previousStatus} to ${nextStatus}`);

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Payment status updated successfully",
      order
    });
  } catch (error) {
    console.error("Update Payment Status Admin Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update payment status"
    });
  }
};

const getOrderInvoiceAdmin = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await orderModel
      .findById(orderId)
      .select("invoiceId invoiceUrl invoiceGeneratedAt");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    return res.status(200).json({
      success: true,
      invoice: {
        invoiceId: order.invoiceId,
        invoiceUrl: order.invoiceUrl,
        invoiceGeneratedAt: order.invoiceGeneratedAt
      }
    });
  } catch (error) {
    console.error("Get Order Invoice Admin Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch invoice"
    });
  }
};

/* ======================
   PUBLIC TRACKING
====================== */
const publicTrackOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await orderModel
      .findById(orderId)
      .select("orderStatus paymentStatus refundStatus statusHistory createdAt updatedAt");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    return res.status(200).json({
      success: true,
      tracking: {
        orderId: order._id,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        refundStatus: order.refundStatus,
        statusHistory: order.statusHistory,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      }
    });
  } catch (error) {
    console.error("Public Track Order Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to track order"
    });
  }
};

module.exports = {
  createOrderFromCart,
  getUserOrders,
  getSingleOrderDetails,
  trackOrderStatus,
  cancelOrder,
  returnOrder,
  getAllOrdersAdmin,
  getOrderByIdAdmin,
  updateOrderStatusAdmin,
  updatePaymentStatusAdmin,
  getOrderInvoiceAdmin,
  publicTrackOrderStatus
};