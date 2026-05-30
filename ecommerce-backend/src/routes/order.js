const orderController = require("../controller/order.js");
const authMiddleware = require("../middleware/auth.js");
const adminMiddleware = require("../middleware/adminMiddleware.js");


const setRouter = (app) => {
    app.post("/create-Order-From-Cart", authMiddleware, orderController.createOrderFromCart);
    app.get("/get-User-Orders", authMiddleware, orderController.getUserOrders);
    app.get("/get-Single-Order-Details/:orderId", authMiddleware, orderController.getSingleOrderDetails);
    app.get("/track-Order-Status/:orderId", authMiddleware, orderController.trackOrderStatus);
    app.put("/cancel-Order/:orderId", authMiddleware, orderController.cancelOrder);
    app.put("/return-Order/:orderId", authMiddleware, orderController.returnOrder);
    app.get("/get-All-Orders-Admin", authMiddleware, adminMiddleware, orderController.getAllOrdersAdmin);
    app.get("/get-Order-By-Id-Admin/:orderId", authMiddleware, adminMiddleware, orderController.getOrderByIdAdmin);
    app.put("/update-Order-Status-Admin/:orderId", authMiddleware, adminMiddleware, orderController.updateOrderStatusAdmin);
    app.put("/update-Payment-Status-Admin/:orderId", authMiddleware, adminMiddleware, orderController.updatePaymentStatusAdmin);
    app.get("/get-Order-Invoice-Admin/:orderId", authMiddleware, adminMiddleware, orderController.getOrderInvoiceAdmin);
    app.get("/public-track-Order-Status/:orderId", orderController.publicTrackOrderStatus);
};

module.exports = { setRouter };
