const aiController = require("../controller/ai.js");
const authMiddleware = require("../middleware/auth.js");
const adminMiddleware = require("../middleware/adminMiddleware.js");


const setRouter = (app) => {
  app.post("/ai-shopping-assistant", aiController.askShoppingAssistant);
  app.post("/generate-product-content", authMiddleware, adminMiddleware, aiController.generateProductContent);
};


module.exports = { setRouter };