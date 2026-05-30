const categoryController = require("../controller/category.js");
const authMiddleware = require("../middleware/auth.js");
const adminMiddleware = require("../middleware/adminMiddleware.js");
const uploadCategoryImage = require("../middleware/uploadCategory");


const setRouter = (app) => {
  app.post("/create-Category", authMiddleware, adminMiddleware, categoryController.createCategory);
  app.put("/update-Category/:categoryId", authMiddleware, adminMiddleware, categoryController.updateCategory);
  app.delete("/delete-Category/:categoryId", authMiddleware, adminMiddleware, categoryController.deleteCategory);
  app.post("/upload-Category-Image/:categoryId/", authMiddleware, adminMiddleware, uploadCategoryImage.single("image"), categoryController.uploadCategoryImage);
  app.put("/change-Category-Status/:categoryId", authMiddleware, adminMiddleware, categoryController.changeCategoryStatus);
  app.get("/get-All-Categories", authMiddleware, adminMiddleware, categoryController.getAllCategories);
  app.get("/get-All-Active-Categories-Public", categoryController.getAllActiveCategoriesPublic);
  app.get("/get-Single-Category-Public/:categoryId", categoryController.getSingleCategoryPublic);
  app.get("/get-Subcategories-Public/:categoryId", categoryController.getSubcategoriesPublic);
  
};


module.exports = { setRouter };


