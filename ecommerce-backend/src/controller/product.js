const mongoose = require("mongoose"); 
const productModel = require('../model/product.js');
const categoryModel = require("../model/category.js");


// Add Product (Admin)
const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      salePrice,
      category,
      subCategory,
      childCategory, 
      brand,
      stock,
      lowStockThreshold,
      trackStock
    } = req.body;

    /* ================= VALIDATION ================= */

    if (
      !name?.trim() ||
      !description?.trim() ||
      price === undefined ||
      !category ||
      !subCategory ||
      !childCategory || 
      !brand?.trim() ||
      stock === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Required product fields are missing."
      });
    }

    if (!mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({ success: false, message: "Invalid category ID" });
    }

    if (!mongoose.Types.ObjectId.isValid(subCategory)) {
      return res.status(400).json({ success: false, message: "Invalid subcategory ID" });
    }

    if (!mongoose.Types.ObjectId.isValid(childCategory)) {
      return res.status(400).json({ success: false, message: "Invalid child category ID" });
    }

    /* ================= RELATION VALIDATION 🔥 ================= */

    const categoryData = await categoryModel.findById(category);
    const subCategoryData = await categoryModel.findById(subCategory);
    const childCategoryData = await categoryModel.findById(childCategory);

    // Level 1
    if (!categoryData || categoryData.parent !== null) {
      return res.status(400).json({ success: false, message: "Invalid category" });
    }

    // Level 2
    if (!subCategoryData || subCategoryData.parent?.toString() !== category) {
      return res.status(400).json({
        success: false,
        message: "Subcategory does not belong to category"
      });
    }

    // Level 3 
    if (!childCategoryData || childCategoryData.parent?.toString() !== subCategory) {
      return res.status(400).json({
        success: false,
        message: "Child category does not belong to subcategory"
      });
    }

    /* ================= PRICE ================= */

    if (salePrice !== undefined && Number(salePrice) > Number(price)) {
      return res.status(400).json({
        success: false,
        message: "Sale price cannot be greater than actual price."
      });
    }

    /* ================= IMAGES ================= */

    let images = [];
    if (req.files?.length > 0) {
      images = req.files.map(file => `/uploads/products/${file.filename}`);
    }

    /* ================= CREATE ================= */

    const newProduct = new productModel({
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      salePrice: salePrice ? Number(salePrice) : undefined,
      category,
      subCategory,
      childCategory, 
      brand: brand.trim(),
      stock: Number(stock),
      lowStockThreshold: lowStockThreshold ?? 5,
      trackStock: trackStock ?? true,
      images,
      isActive: true
    });

    await newProduct.save();

    return res.status(201).json({
      success: true,
      message: "Product added successfully.",
      data: newProduct
    });

  } catch (err) {
    console.error("❌ Add product error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//-----------------------------------------------------------------------------------------------------------
// UPDATE PRODUCT (Admin)
const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const {
      name,
      description,
      price,
      salePrice,
      category,
      subCategory,
      childCategory, 
      brand,
      stock,
      isActive
    } = req.body;

    const updateData = {};

    /* ================= BASIC ================= */

    if (salePrice && price && Number(salePrice) > Number(price)) {
      return res.status(400).json({
        success: false,
        message: "Sale price cannot be greater than actual price."
      });
    }

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (price !== undefined) updateData.price = Number(price);
    if (salePrice !== undefined) updateData.salePrice = Number(salePrice);

    /* ================= VALIDATION ================= */

    if (category !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(category)) {
        return res.status(400).json({ success: false, message: "Invalid category ID" });
      }
      updateData.category = category;
    }

    if (subCategory !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(subCategory)) {
        return res.status(400).json({ success: false, message: "Invalid subcategory ID" });
      }
      updateData.subCategory = subCategory;
    }

    if (childCategory !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(childCategory)) {
        return res.status(400).json({ success: false, message: "Invalid child category ID" });
      }
      updateData.childCategory = childCategory;
    }

    /* ================= RELATION CHECK 🔥 ================= */

    if (category && subCategory && childCategory) {
      const subCat = await categoryModel.findById(subCategory);
      const childCat = await categoryModel.findById(childCategory);

      if (!subCat || subCat.parent?.toString() !== category) {
        return res.status(400).json({
          success: false,
          message: "Subcategory does not belong to category"
        });
      }

      if (!childCat || childCat.parent?.toString() !== subCategory) {
        return res.status(400).json({
          success: false,
          message: "Child category does not belong to subcategory"
        });
      }
    }

    if (brand !== undefined) updateData.brand = brand.trim();
    if (stock !== undefined) updateData.stock = Number(stock);
    if (isActive !== undefined) updateData.isActive = isActive;

    /* ================= IMAGES ================= */

    if (req.files?.length > 0) {
      updateData.images = req.files.map(file => `/uploads/products/${file.filename}`);
    }

    /* ================= UPDATE ================= */

    const updatedProduct = await productModel.findByIdAndUpdate(
      productId,
      updateData,
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      data: updatedProduct
    });

  } catch (error) {
    console.error("❌ Update product error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//-----------------------------------------------------------------------------------------------------------
// Delect product (Admin)
const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const deletedProduct = await productModel.findByIdAndDelete(productId);

    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product permanently deleted.",
      data: deletedProduct
    });

  } catch (error) {
    console.error("❌ Delete product error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//-----------------------------------------------------------------------------------------------------------
// Upload Product Images (Admin)
const uploadProductImages = async (req, res) => {
  try {
    // 🔥 SANITIZE productId
    const productId = req.params.productId.trim();

    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please upload at least one image"
      });
    }

    const imagePaths = req.files.map(
      file => `/uploads/products/${file.filename}`
    );

    const product = await productModel.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    product.images = [...product.images, ...imagePaths];
    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product images uploaded successfully",
      data: product
    });

  } catch (error) {
    console.error("❌ uploadProductImages error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//-----------------------------------------------------------------------------------------------------------
// List All Products (Admin)
const listAllProductsAdmin = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "createdAt",
      order = "desc",
      status = "all"
    } = req.query;

    // Convert to numbers
    page = Number(page);
    limit = Number(limit);

    const query = {};

    /* ================= SMOOTH SEARCH ================= */

    if (search && search.trim() !== "") {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } }
      ];
    }

    /* ================= STATUS FILTER ================= */

    if (status !== "all") {
      query.isActive = status === "active";
    }

    /* ================= PAGINATION ================= */

    const skip = (page - 1) * limit;

    const products = await productModel
      .find(query)
      .sort({ [sortBy]: order === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(limit);

    const totalProducts = await productModel.countDocuments(query);

    return res.status(200).json({
      success: true,
      meta: {
        totalProducts,
        totalPages: Math.ceil(totalProducts / limit),
        currentPage: page
      },
      data: products
    });

  } catch (error) {
    console.error("Admin product list error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//------------------------------------------------------------------------------------------------------------
// List All Products (Public)
const listAllProductsPublic = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Filters
    const {
      category,
      brand,
      minPrice,
      maxPrice
    } = req.query;

    // Base query → ONLY active products
    const query = {
      isActive: true
    };

    if (category) {
      query.category = category;
    }

    if (brand) {
      query.brand = brand;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const products = await productModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalProducts = await productModel.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      meta: {
        totalProducts,
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        limit
      },
      data: products
    });

  } catch (error) {
    console.error("❌ listAllProductsPublic error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//------------------------------------------------------------------------------------------------------------
// Search Products(Public)
const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        message: "Search query is required"
      });
    }

    const products = await productModel.find({
      name: { $regex: q, $options: "i" }
    });

    res.status(200).json({ data: products });
  } catch (error) {
    console.error("Search Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//------------------------------------------------------------------------------------------------------------
// Get Single Product Details
const getSingleProductDetails = async (req, res) => {
  try {
    const productId = req.params.productId.trim();


    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }


    const product = await productModel.findOne({
      _id: productId,
      isActive: true
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product details fetched successfully",
      data: product
    });

  } catch (error) {
    console.error("❌ getSingleProductDetails error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//------------------------------------------------------------------------------------------------------------
// Update Product Stock (Admin)
const updateProductStock = async (req, res) => {
  try {
    const productId = req.params.productId.trim();
    const { stock } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    if (stock === undefined || stock === null || isNaN(stock)) {
      return res.status(400).json({
        success: false,
        message: "Stock is required and must be a number"
      });
    }

    if (Number(stock) < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock cannot be negative"
      });
    }

    const updatedProduct = await productModel.findByIdAndUpdate(
      productId,
      { stock: Number(stock) },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product stock updated successfully",
      data: {
        productId: updatedProduct._id,
        stock: updatedProduct.stock
      }
    });

  } catch (error) {
    console.error("❌ updateProductStock error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//-------------------------------------------------------------------------------------------------------------
// Update product status (Admin)
const updateProductStatus = async (req, res) => {
  try {
    const productId = req.params.productId.trim();
    const { isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean value (true or false)"
      });
    }

    const updatedProduct = await productModel.findByIdAndUpdate(
      productId,
      { isActive },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: `Product ${isActive ? "activated" : "deactivated"} successfully`,
      data: {
        productId: updatedProduct._id,
        isActive: updatedProduct.isActive
      }
    });

  } catch (error) {
    console.error("❌ updateProductStatus error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//-------------------------------------------------------------------------------------------------------------
// Rate product (Customer)
const rateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 to 5"
      });
    }

    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const totalRating =
      product.rating * product.ratingCount + Number(rating);

    product.ratingCount += 1;
    product.rating = Number(
      (totalRating / product.ratingCount).toFixed(1)
    );

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product rated successfully",
      data: {
        rating: product.rating,
        ratingCount: product.ratingCount
      }
    });

  } catch (error) {
    console.error("❌ rateProduct error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//-------------------------------------------------------------------------------------------------------------
const getProductsByCategoryPublic = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID"
      });
    }

    // 🔥 Get subcategories
    const subcategories = await categoryModel.find({
      parent: categoryId,
      status: true
    });

    const categoryIds = [
      categoryId,
      ...subcategories.map(c => c._id)
    ];

    // 🔥 Get products
    const products = await productModel.find({
      category: { $in: categoryIds },
      isActive: true
    });

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });

  } catch (error) {
    console.error("❌ getProductsByCategoryPublic error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};











//=========================================================================================
//=========================================================================================
module.exports = {
  addProduct: addProduct,
  updateProduct: updateProduct,
  deleteProduct: deleteProduct,
  uploadProductImages: uploadProductImages,
  listAllProductsAdmin: listAllProductsAdmin,
  listAllProductsPublic: listAllProductsPublic,
  searchProducts: searchProducts,
  getSingleProductDetails: getSingleProductDetails,
  updateProductStock: updateProductStock,
  updateProductStatus: updateProductStatus,
  rateProduct: rateProduct,
  getProductsByCategoryPublic: getProductsByCategoryPublic
}