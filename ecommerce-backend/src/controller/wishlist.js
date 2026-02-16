const mongoose = require("mongoose");
const wishlistModel = require("../model/wishlist");
const productModel = require('../model/product.js');


// Add To Wishlist
const addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

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
        message: "Product not found or inactive"
      });
    }

    let wishlist = await wishlistModel.findOne({ userId });

    if (!wishlist) {
      wishlist = new wishlistModel({
        userId,
        productIds: [productId]
      });
    } else {
  
      if (wishlist.productIds.includes(productId)) {
        return res.status(409).json({
          success: false,
          message: "Product already in wishlist"
        });
      }

      wishlist.productIds.push(productId);
    }

    await wishlist.save();

    return res.status(200).json({
      success: true,
      message: "Product added to wishlist",
      data: wishlist
    });

  } catch (error) {
    console.error("❌ addToWishlist error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//------------------------------------------------------------------------------------------------------
// Remove From Wishlist
const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    const wishlist = await wishlistModel.findOne({ userId });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: "Wishlist not found"
      });
    }

    // 🔧 SAFETY FIX (important)
    if (!Array.isArray(wishlist.productIds)) {
      wishlist.productIds = [];
    }

    const index = wishlist.productIds.findIndex(
      id => id.toString() === productId
    );

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not found in wishlist"
      });
    }

    wishlist.productIds.splice(index, 1);
    await wishlist.save();

    return res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
      data: wishlist.productIds
    });

  } catch (error) {
    console.error("❌ removeFromWishlist error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//------------------------------------------------------------------------------------------------------
const getUserWishlist = async (req, res) => {
  try {
    const userId = req.user.id;

    const wishlist = await wishlistModel.findOne({ userId })
      .populate({
        path: "productIds",
        match: { isActive: true }, 
        select: "name price salePrice images stock rating ratingCount"
      });

    if (!wishlist) {
      return res.status(200).json({
        success: true,
        message: "Wishlist is empty",
        data: []
      });
    }

    return res.status(200).json({
      success: true,
      message: "Wishlist fetched successfully",
      data: wishlist.productIds
    });

  } catch (error) {
    console.error("❌ getUserWishlist error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};



//==========================================================================================================
//==========================================================================================================
//==========================================================================================================
module.exports = {
  addToWishlist,
  removeFromWishlist,
  getUserWishlist
};
