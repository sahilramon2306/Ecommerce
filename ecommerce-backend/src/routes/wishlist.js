const wishlistController = require("../controller/wishlist");
const authMiddleware = require("../middleware/auth");



const setRouter = (app) => {
  app.post("/add-To-Wish-list", authMiddleware, wishlistController.addToWishlist);
  app.delete("/remove-From-Wishlist/:productId", authMiddleware, wishlistController.removeFromWishlist);
  app.get("/get-User-Wishlist", authMiddleware, wishlistController.getUserWishlist);
};





module.exports = { setRouter };
