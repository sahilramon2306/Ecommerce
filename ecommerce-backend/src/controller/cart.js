const mongoose = require("mongoose");
const Cart = require("../model/cart");
const Product = require("../model/product");



// Add To Cart
const addToCart = async (req, res) => {
  try {
    const userId = req.user._id; 
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({
        success: false,
        message: "ProductId and quantity are required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0"
      });
    }

    const product = await Product.findOne({
      _id: productId,
       isActive: true
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or inactive"
      });
    }

    let cart = await Cart.findOne({ userId });

    // If cart does not exist, create new
    if (!cart) {
      cart = new Cart({
        userId,
        items: [
          {
            productId,
            quantity,
            totalPrice: product.salePrice * quantity
          }
        ]
      });
    } else {
      const itemIndex = cart.items.findIndex(
        item => item.productId.toString() === productId
      );

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
        cart.items[itemIndex].totalPrice =
          cart.items[itemIndex].quantity * product.salePrice;
      } else {
        cart.items.push({
          productId,
          quantity,
          totalPrice: product.salePrice * quantity
        });
      }
    }

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Product added to cart successfully",
      data: cart
    });

  } catch (error) {
    console.error("❌ addToCart error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//----------------------------------------------------------------------------------------------
// Get User Cart
const getUserCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ userId })
      .populate({
        path: "items.productId",
        select: "name price salePrice images stock isActive"
      });

    if (!cart || cart.items.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Cart is empty",
        data: {
          items: [],
          grandTotal: 0
        }
      });
    }

    let grandTotal = 0;

    const formattedItems = cart.items.map(item => {
      const product = item.productId;

      if (!product || !product.isActive) {
        return null; 
      }

      const price = product.salePrice || product.price;
      const totalPrice = price * item.quantity;
      grandTotal += totalPrice;

      return {
        productId: product._id,
        name: product.name,
        price,
        quantity: item.quantity,
        totalPrice,
        image: product.images?.[0] || null
      };
    }).filter(Boolean);

    return res.status(200).json({
      success: true,
      message: "Cart fetched successfully",
      data: {
        items: formattedItems,
        grandTotal
      }
    });

  } catch (error) {
    console.error("❌ getUserCart error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//----------------------------------------------------------------------------------------------
// Update Cart Item Quantity
const updateCartItemQuantity = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "productId and quantity are required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    if (quantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity cannot be negative"
      });
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    const itemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart"
      });
    }

    if (quantity === 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      const product = await Product.findOne({
        _id: productId,
        isActive: true
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found or inactive"
        });
      }

      cart.items[itemIndex].quantity = quantity;
      cart.items[itemIndex].totalPrice =
        quantity * product.salePrice;
    }

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      data: cart
    });

  } catch (error) {
    console.error("❌ updateCartItemQuantity error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//------------------------------------------------------------------------------------------------
// Remove Cart Item
const removeCartItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    const cart = await Cart.findOne({ userId });

    if (!cart || cart.items.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cart is empty"
      });
    }

    const itemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart"
      });
    }

    cart.items.splice(itemIndex, 1);

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Product removed from cart successfully",
      data: cart
    });

  } catch (error) {
    console.error("❌ removeCartItem error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//-------------------------------------------------------------------------------------------------
// Clear Cart
const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ userId });

    if (!cart || cart.items.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Cart is already empty",
        data: {
          items: [],
          grandTotal: 0
        }
      });
    }

    cart.items = [];

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      data: {
        items: [],
        grandTotal: 0
      }
    });

  } catch (error) {
    console.error("❌ clearCart error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};





//==========================================================================================
//==========================================================================================
//==========================================================================================
module.exports = {
  addToCart: addToCart,
  getUserCart: getUserCart,
  updateCartItemQuantity: updateCartItemQuantity,
  removeCartItem: removeCartItem,
  clearCart: clearCart
};
