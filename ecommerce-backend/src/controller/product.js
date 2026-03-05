const mongoose = require("mongoose"); 
const productModel = require('../model/product.js');



// Add Product (Admin)
const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      salePrice,
      category,
      brand,
      stock,
      lowStockThreshold,
      trackStock
    } = req.body;

    if (
      !name?.trim() ||
      !description?.trim() ||
      price === undefined ||
      !category?.trim() ||
      !brand?.trim() ||
      stock === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Required product fields are missing."
      });
    }

    if (salePrice !== undefined && salePrice > price) {
      return res.status(400).json({
        success: false,
        message: "Sale price cannot be greater than actual price."
      });
    }

    let images = [];
    if (req.files?.length > 0) {
      images = req.files.map(file => `/uploads/products/${file.filename}`);
    }

    const newProduct = new productModel({
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      salePrice: salePrice !== undefined ? Number(salePrice) : undefined,
      category: category.trim(),
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
      brand,
      stock,
      isActive
    } = req.body;


    if (salePrice && price && Number(salePrice) > Number(price)) {
      return res.status(400).json({
        success: false,
        message: "Sale price cannot be greater than actual price."
      });
    }

   
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (salePrice !== undefined) updateData.salePrice = salePrice;
    if (category !== undefined) updateData.category = category;
    if (brand !== undefined) updateData.brand = brand;
    if (stock !== undefined) updateData.stock = stock;
    if (isActive !== undefined) updateData.isActive = isActive;

  
    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map(
        file => `/uploads/products/${file.filename}`
      );
    }

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
  rateProduct: rateProduct
}