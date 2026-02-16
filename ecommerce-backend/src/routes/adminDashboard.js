const dashboardController = require("../controller/adminDashboard");
const authMiddleware = require("../middleware/auth");
const adminMiddleware = require("../middleware/adminMiddleware");


const setRouter = (app) => {
  app.get("/dashboard-Overview", authMiddleware, adminMiddleware, dashboardController.dashboardOverview);
  app.get("/orders-By-Month", authMiddleware, adminMiddleware, dashboardController.ordersByMonth);
  app.get("/sales-By-Month", authMiddleware, adminMiddleware, dashboardController.salesByMonth);
  app.get("/top-Products", authMiddleware, adminMiddleware, dashboardController.topProducts);
  app.get("/lowStock-Products", authMiddleware, adminMiddleware, dashboardController.lowStockProducts);
  app.get("/order-Status-Summary", authMiddleware, adminMiddleware, dashboardController.orderStatusSummary);
};



module.exports = { setRouter };
