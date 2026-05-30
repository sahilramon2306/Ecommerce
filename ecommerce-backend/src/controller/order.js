const orderModel = require("../model/order.js");
const cartModel = require("../model/cart.js");
const productModel = require("../model/product.js");





// Create Order From Cart
const createOrderFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { paymentType, address } = req.body;

    /* ---------- VALIDATION ---------- */
    if (!["COD", "ONLINE"].includes(paymentType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment type",
      });
    }

    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Delivery address is required",
      });
    }

    /* ---------- FETCH CART ---------- */
    const cart = await cartModel
      .findOne({ userId })
      .populate("items.productId");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    /* ---------- PREPARE ORDER ITEMS ---------- */
    const orderItems = [];
    let subTotal = 0;

    for (const item of cart.items) {
      const product = item.productId;

      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: "One or more products are unavailable",
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`,
        });
      }

      const price = Number(product.salePrice || product.price);
      const quantity = Number(item.quantity);

      orderItems.push({
        productId: product._id,
        quantity,
        price,
      });

      subTotal += price * quantity;
    }

    subTotal = Number(subTotal.toFixed(2));

    /* ---------- GST CALCULATION ---------- */
    const GST_RATE = 18;
    const HALF_GST = GST_RATE / 2;

    const cgstAmount = Number(((subTotal * HALF_GST) / 100).toFixed(2));
    const sgstAmount = Number(((subTotal * HALF_GST) / 100).toFixed(2));
    const gstAmount = Number((cgstAmount + sgstAmount).toFixed(2));
    const totalAmount = Number((subTotal + gstAmount).toFixed(2));

    if (totalAmount <= 0 || isNaN(totalAmount)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order total",
      });
    }

    /* ---------- CREATE ORDER ---------- */
    const newOrder = await orderModel.create({
      userId,

      items: orderItems,

      subTotal,
      gstRate: GST_RATE,
      cgstRate: HALF_GST,
      sgstRate: HALF_GST,

      cgstAmount,
      sgstAmount,
      gstAmount,
      totalAmount,

      paymentType,
      paymentStatus: paymentType === "COD" ? "pending" : "authorized",
      orderStatus: "placed",
      refundStatus: "not_requested",

      address,
    });

    /* ---------- REDUCE STOCK ---------- */
    for (const item of orderItems) {
      await productModel.updateOne(
        { _id: item.productId },
        { $inc: { stock: -item.quantity } }
      );
    }

    /* ---------- CLEAR CART ---------- */
    await cartModel.findOneAndDelete({ userId });

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: newOrder,
    });

  } catch (error) {
    console.error("❌ Create Order Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

//-----------------------------------------------------------------------------------------------------
// Get User Orders
const getUserOrders = async (req, res) => {
  try {
    console.log("▶️ Fetching user orders");
    console.log("▶️ Authenticated user:", req.user);

    const userId = req.user._id; // ✅ FIXED

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const orders = await orderModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .populate({
        path: "items.productId",
        select: "name price salePrice images",
      });

    if (!orders.length) {
      return res.status(200).json({
        success: true,
        message: "No orders found for this user.",
        totalOrders: 0,
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "User orders fetched successfully.",
      totalOrders: orders.length,
      data: orders,
    });

  } catch (error) {
    console.error("❌ Get user orders error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

//-----------------------------------------------------------------------------------------------------
// Get Single Order Details
const getSingleOrderDetails = async (req, res) => {
  try {
    console.log("▶️ Fetching single order details");
    console.log("▶️ Authenticated user:", req.user);

    const userId = req.user.id;
    const { orderId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access"
      });
    }

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }

    const order = await orderModel.findOne({
      _id: orderId,
      userId: userId
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or access denied"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order details fetched successfully",
      data: order
    });

  } catch (err) {
    console.error("❌ Get single order error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//-----------------------------------------------------------------------------------------------------
// Track Order Status
const trackOrderStatus = async (req, res) => {
  try {
    console.log("▶️ Tracking order status");
    console.log("▶️ Authenticated user:", req.user);

    const userId = req.user.id;
    const { orderId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access"
      });
    }

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }

    const order = await orderModel.findOne({
      _id: orderId,
      userId: userId
    }).select("orderStatus paymentStatus createdAt updatedAt");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or access denied"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order status fetched successfully",
      data: {
        orderId: order._id,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        orderedOn: order.createdAt,
        lastUpdatedOn: order.updatedAt
      }
    });

  } catch (err) {
    console.error("❌ Track order error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//-----------------------------------------------------------------------------------------------------
// Cancel Order
const cancelOrder = async (req, res) => {
  try {
    console.log("▶️ Cancel order request");
    console.log("▶️ Authenticated user:", req.user);

    const userId = req.user.id;
    const { orderId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access"
      });
    }

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }

    const order = await orderModel.findOne({
      _id: orderId,
      userId: userId
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or access denied"
      });
    }

    if (order.orderStatus !== "placed") {
      return res.status(400).json({
        success: false,
        message: "Order cannot be cancelled at this stage"
      });
    }

    order.orderStatus = "cancelled";
    await order.save();

    for (let item of order.items) {
      await productModel.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: item.quantity } }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully"
    });

  } catch (err) {
    console.error("❌ Cancel order error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//-----------------------------------------------------------------------------------------------------
// Return Order
const returnOrder = async (req, res) => {
  try {
    console.log("▶️ Return order request");
    console.log("▶️ Authenticated user:", req.user);

    const userId = req.user.id;
    const { orderId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access"
      });
    }

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }

    const order = await orderModel.findOne({
      _id: orderId,
      userId: userId
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or access denied"
      });
    }

    if (order.orderStatus !== "delivered") {
      return res.status(400).json({
        success: false,
        message: "Only delivered orders can be returned"
      });
    }

    order.orderStatus = "returned";
    await order.save();

    for (let item of order.items) {
      await productModel.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: item.quantity } }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Return request submitted successfully"
    });

  } catch (err) {
    console.error("❌ Return order error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//-----------------------------------------------------------------------------------------------------
const getAllOrdersAdmin = async (req, res) => {
  try {
    console.log("▶️ Admin fetching all orders");
    console.log("▶️ Admin user:", req.user);

    const {
      orderId, // <-- Added orderId here
      orderStatus,
      paymentStatus,
      paymentType,
      page = 1,
      limit = 10
    } = req.query;

    let filter = {};

    // 1. Handle Order ID Search
    if (orderId) {
      // Validate if the typed string is a valid 24-char hex MongoDB ID
      const mongoose = require('mongoose'); // Can be moved to top of file
      if (mongoose.Types.ObjectId.isValid(orderId)) {
        filter._id = orderId;
      } else {
        // If invalid ID is typed, return empty array immediately (no crash)
        return res.status(200).json({
          success: true,
          message: "No orders found",
          pagination: {
            totalOrders: 0,
            currentPage: Number(page),
            totalPages: 0,
            limit: Number(limit)
          },
          data: []
        });
      }
    }

    // 2. Apply other filters
    if (orderStatus) filter.orderStatus = orderStatus;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (paymentType) filter.paymentType = paymentType;

    const skip = (Number(page) - 1) * Number(limit);

    const orders = await orderModel
      .find(filter)
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalOrders = await orderModel.countDocuments(filter);

    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      pagination: {
        totalOrders,
        currentPage: Number(page),
        totalPages: Math.ceil(totalOrders / limit),
        limit: Number(limit)
      },
      data: orders
    });

  } catch (err) {
    console.error("❌ Admin get all orders error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//-----------------------------------------------------------------------------------------------------
// GettOrdertBy Id Admin
const getOrderByIdAdmin = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required."
      });
    }

    const order = await orderModel
      .findById(orderId)
      .populate("userId", "name email phone")
      .populate("items.productId", "name price images");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order details fetched successfully.",
      data: order
    });

  } catch (err) {
    console.error("❌ Admin get order by ID error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//-----------------------------------------------------------------------------------------------------
// Update Order Status Admin
const updateOrderStatusAdmin = async (req, res) => {
  try {
    console.log("▶️ Admin updating order status");

    const { orderId } = req.params;
    const { orderStatus } = req.body;

    if (!orderStatus) {
      return res.status(400).json({
        success: false,
        message: "orderStatus is required"
      });
    }

    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    const statusFlow = {
      placed: ["confirmed", "cancelled"],
      confirmed: ["shipped", "cancelled"],
      shipped: ["delivered"],
      delivered: ["returned"],
      returned: [],
      cancelled: []
    };

    const currentStatus = order.orderStatus;

    if (
      !statusFlow[currentStatus] ||
      !statusFlow[currentStatus].includes(orderStatus)
    ) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from '${currentStatus}' to '${orderStatus}'`
      });
    }

    if (currentStatus === orderStatus) {
      return res.status(400).json({
        success: false,
        message: `Order already marked as ${orderStatus}`
      });
    }

    order.orderStatus = orderStatus;

    order.statusHistory.push({
      status: orderStatus,
      changedAt: new Date()
    });

    if (orderStatus === "cancelled") {
      if (order.paymentType === "ONLINE" && order.paymentStatus === "captured") {
        order.refundStatus = "requested";
      }
    }

    if (orderStatus === "delivered" && order.paymentType === "COD") {
      order.paymentStatus = "captured";
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: {
        orderId: order._id,
        orderStatus: order.orderStatus,
        statusHistory: order.statusHistory
      }
    });

  } catch (error) {
    console.error("❌ Admin update order status error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//-----------------------------------------------------------------------------------------------------
// update Payment Status Admin
const updatePaymentStatusAdmin = async (req, res) => {
  try {
    console.log("▶️ Admin updating payment status");

    const { orderId } = req.params;
    const { paymentStatus } = req.body;

    if (!paymentStatus) {
      return res.status(400).json({
        success: false,
        message: "paymentStatus is required"
      });
    }

    if (!["paid", "failed"].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid paymentStatus value"
      });
    }

    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (order.orderStatus === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot update payment for cancelled order"
      });
    }

    if (
      order.paymentType === "COD" &&
      paymentStatus === "paid" &&
      order.orderStatus !== "delivered"
    ) {
      return res.status(400).json({
        success: false,
        message: "COD payment can be marked paid only after delivery"
      });
    }

    order.paymentStatus = paymentStatus;
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Payment status updated successfully",
      data: {
        orderId: order._id,
        paymentStatus: order.paymentStatus
      }
    });

  } catch (error) {
    console.error("❌ Admin update payment status error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//-----------------------------------------------------------------------------------------------------
// Get Order Invoice Admin
const getOrderInvoiceAdmin = async (req, res) => {
  try {
    console.log("▶️ Admin fetching invoice");

    const { orderId } = req.params;

    const order = await orderModel.findById(orderId).populate("userId", "name email phone");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (order.orderStatus === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Invoice not available for cancelled orders"
      });
    }

    if (!order.invoiceId) {
      order.invoiceId = `INV-${Date.now()}`;
      await order.save();
    }

    const totalAmount = order.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const invoice = {
      invoiceId: order.invoiceId,
      orderId: order._id,
      orderDate: order.createdAt,
      customer: {
        name: order.userId.name,
        email: order.userId.email,
        phone: order.userId.phone
      },
      address: order.address,
      items: order.items,
      paymentType: order.paymentType,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      totalAmount
    };

    return res.status(200).json({
      success: true,
      message: "Invoice fetched successfully",
      data: invoice
    });

  } catch (error) {
    console.error("❌ Get invoice error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//-----------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------
// Public Track Order Status
const publicTrackOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    const order = await orderModel
      .findById(orderId)
      .select("orderStatus paymentStatus paymentType createdAt updatedAt totalAmount");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order status fetched successfully",
      data: {
        orderId: order._id,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        paymentType: order.paymentType,
        totalAmount: order.totalAmount,
        orderedOn: order.createdAt,
        lastUpdatedOn: order.updatedAt,
      },
    });
  } catch (error) {
    console.error("Public track order error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};









//====================================================================================================
//====================================================================================================
//====================================================================================================
module.exports = {
  createOrderFromCart: createOrderFromCart,
  getUserOrders: getUserOrders,
  getSingleOrderDetails: getSingleOrderDetails,
  trackOrderStatus: trackOrderStatus,
  cancelOrder: cancelOrder,
  returnOrder: returnOrder,
  getAllOrdersAdmin: getAllOrdersAdmin,
  getOrderByIdAdmin: getOrderByIdAdmin,
  updateOrderStatusAdmin: updateOrderStatusAdmin,
  updatePaymentStatusAdmin: updatePaymentStatusAdmin,
  getOrderInvoiceAdmin: getOrderInvoiceAdmin,
  publicTrackOrderStatus: publicTrackOrderStatus
};
