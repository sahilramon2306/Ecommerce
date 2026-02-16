const paymentController = require("../controller/payment");
const authMiddleware = require("../middleware/auth");
const adminMiddleware = require("../middleware/adminMiddleware.js");



const setRouter = (app) => {
  app.post("/create-Razorpay-Order", authMiddleware, paymentController.createRazorpayOrder);
  app.post("/verify-Razorpay-Payment", authMiddleware, paymentController.verifyRazorpayPayment);
  app.post("/razorpay-Webhook", paymentController.razorpayWebhook);
  app.post("/refund-Razorpay-Payment/:orderId", authMiddleware, adminMiddleware, paymentController.refundRazorpayPayment);
  app.post("/refund-Single-Item/:orderId", authMiddleware, paymentController.refundSingleItem);
};


module.exports = { setRouter };
