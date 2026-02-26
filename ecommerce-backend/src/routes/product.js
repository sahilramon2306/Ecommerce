const productController = require("../controller/product.js");
const authMiddleware = require("../middleware/auth.js");
const adminMiddleware = require("../middleware/adminMiddleware.js");
const upload = require("../middleware/upload.js");



const setRouter = (app) => {
    app.post("/add-Product", authMiddleware, adminMiddleware, upload.array("images", 5), productController.addProduct);
    app.put("/update-Product/:productId", authMiddleware, adminMiddleware, upload.array("images", 5), productController.updateProduct);
    app.delete("/delete-Product/:productId", authMiddleware, adminMiddleware, productController.deleteProduct);
    app.post("/upload-Product-Images/:productId", authMiddleware, adminMiddleware, upload.array("images", 5), productController.uploadProductImages);
    app.get("/list-All-Products-Admin", authMiddleware, adminMiddleware, productController.listAllProductsAdmin);
    app.get("/list-All-Products-Public", productController.listAllProductsPublic);
    app.get("/search-products", productController.searchProducts);
    app.get("/get-Single-Product-Details/:productId", productController.getSingleProductDetails);
    app.put("/update-Product-Stock/:productId", authMiddleware, adminMiddleware, productController.updateProductStock);
    app.put("/update-Product-Status/:productId", authMiddleware, adminMiddleware, productController.updateProductStatus);
    app.post("/rate-Product/:productId", authMiddleware, productController.rateProduct);
}





module.exports = { setRouter };
