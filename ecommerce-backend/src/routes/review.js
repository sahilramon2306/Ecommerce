const reviewController = require("../controller/review");
const authMiddleware = require("../middleware/auth");
const adminMiddleware = require("../middleware/adminMiddleware");


const setRouter = (app) => {
  app.post("/add-Review/:productId", authMiddleware, reviewController.addReview);
  app.put("/update-Review/:productId", authMiddleware, reviewController.updateReview);
  app.delete("/delete-Review/:productId", authMiddleware, reviewController.deleteReview);
  app.get("/get-Product-Reviews/:productId", reviewController.getProductReviews);
  app.get("/get-Rating-Summary/:productId", reviewController.getRatingSummary);
  app.put("/moderate-Review/:reviewId", authMiddleware, adminMiddleware, reviewController.moderateReview);
};



module.exports = { setRouter };
