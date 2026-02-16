const cartController = require("../controller/cart.js");
const authMiddleware = require("../middleware/auth.js");



const setRouter = (app) => {
    app.post("/add-To-Cart", authMiddleware, cartController.addToCart);
    app.get("/get-User-Cart", authMiddleware, cartController.getUserCart);
    app.put("/update-Cart-Item-Quantity", authMiddleware, cartController.updateCartItemQuantity);
    app.delete("/remove-Cart-Item/:productId", authMiddleware, cartController.removeCartItem);
    app.delete("/clear-Cart", authMiddleware, cartController.clearCart);
}


module.exports = { setRouter };