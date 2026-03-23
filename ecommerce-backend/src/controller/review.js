const mongoose = require("mongoose");
const reviewmodel = require("../model/review");
const productModel = require('../model/product.js');



// Add Review
const addReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    const { rating, review } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5"
      });
    }

    const product = await productModel.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found or inactive"
      });
    }

    const newReview = await reviewmodel.create({
      userId,
      productId,
      rating,
      review
    });

    const totalRating =
      product.rating * product.ratingCount + rating;

    product.ratingCount += 1;
    product.rating = Number(
      (totalRating / product.ratingCount).toFixed(1)
    );

    await product.save();

    return res.status(201).json({
      success: true,
      message: "Review added successfully",
      data: newReview
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this product"
      });
    }

    console.error("❌ addReview error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//-------------------------------------------------------------------------------------------------------
// Update Review
const updateReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    const { rating, review } = req.body;

    const existingReview = await reviewmodel.findOne({
      userId,
      productId
    });

    if (!existingReview) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }

    const product = await productModel.findById(productId);

    if (rating && rating >= 1 && rating <= 5) {
      const totalRating =
        product.rating * product.ratingCount -
        existingReview.rating +
        rating;

      product.rating = Number(
        (totalRating / product.ratingCount).toFixed(1)
      );

      existingReview.rating = rating;
    }

    if (review !== undefined) {
      existingReview.review = review;
    }

    await existingReview.save();
    await product.save();

    return res.status(200).json({
      success: true,
      message: "Review updated successfully",
      data: existingReview
    });

  } catch (error) {
    console.error("❌ updateReview error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//-------------------------------------------------------------------------------------------------------
// Delete Review
const deleteReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const review = await reviewmodel.findOne({
      userId,
      productId
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }

    const product = await productModel.findById(productId);

    const totalRating =
      product.rating * product.ratingCount - review.rating;

    product.ratingCount -= 1;
    product.rating =
      product.ratingCount === 0
        ? 0
        : Number(
            (totalRating / product.ratingCount).toFixed(1)
          );

    await reviewmodel.deleteOne({ _id: review._id });
    await product.save();

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully"
    });

  } catch (error) {
    console.error("❌ deleteReview error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//-------------------------------------------------------------------------------------------------------
// Get Product Reviews
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await reviewmodel
      .find({
        productId,
        status: "active"
      })
      .populate("userId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      data: reviews
    });

  } catch (error) {
    console.error("❌ getProductReviews error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//-------------------------------------------------------------------------------------------------------
// Get Rating Summary
const getRatingSummary = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await productModel
      .findById(productId)
      .select("rating ratingCount");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        averageRating: product.rating,
        ratingCount: product.ratingCount
      }
    });

  } catch (error) {
    console.error("❌ getRatingSummary error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//-------------------------------------------------------------------------------------------------------
// Moderate Review(admin)
const moderateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { status } = req.body;

    if (!["active", "hidden"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }

    const review = await reviewmodel.findByIdAndUpdate(
      reviewId,
      { status },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Review status updated successfully",
      data: review
    });

  } catch (error) {
    console.error("❌ moderateReview error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//----------------------------------------------------------------------------------------------------------
const getAllReviewsAdmin = async (req, res) => {
  try {

    const reviews = await reviewmodel
      .find({})
      .populate("userId", "name email")
      .populate("productId", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: reviews
    });

  } catch (error) {

    console.error("getAllReviewsAdmin error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });

  }
};







//======================================================================================================
//======================================================================================================
//======================================================================================================
module.exports = {
  addReview,
  updateReview,
  deleteReview,
  getProductReviews,
  getRatingSummary,
  moderateReview,
  getAllReviewsAdmin
};
