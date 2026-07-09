const userModel = require('../model/user.js');
const orderModel = require("../model/order.js");
const productModel = require('../model/product.js');



// Dashboard Overview (Total Users, Orders, Revenue)
const dashboardOverview = async (req, res) => {
  try {
    const totalUsers = await userModel.countDocuments();
    const totalOrders = await orderModel.countDocuments();

    const revenueAgg = await orderModel.aggregate([
      {
        $match: {
          paymentStatus: { $in: ["paid", "captured"] }
        }
      },
      {
        $group: {
          _id: null,
          grossRevenue: { $sum: "$totalAmount" }, 
          netRevenue: { $sum: "$subTotal" },     
          gstCollected: { $sum: "$gstAmount" }    
        }
      }
    ]);

    const revenueData = revenueAgg[0] || {
      grossRevenue: 0,
      netRevenue: 0,
      gstCollected: 0
    };

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalOrders,
        grossRevenue: Number(revenueData.grossRevenue.toFixed(2)),
        netRevenue: Number(revenueData.netRevenue.toFixed(2)),
        gstCollected: Number(revenueData.gstCollected.toFixed(2))
      }
    });

  } catch (error) {
    console.error("❌ dashboardOverview:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//----------------------------------------------------------------------------------------------------------------
// Orders By Month
const ordersByMonth = async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();

    const rawData = await orderModel.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${year}-01-01T00:00:00.000Z`),
            $lte: new Date(`${year}-12-31T23:59:59.999Z`)
          }
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const formattedData = monthNames.map((month, index) => {
      const found = rawData.find(item => item._id === index + 1);
      return {
        month,
        totalOrders: found ? found.totalOrders : 0
      };
    });

    return res.status(200).json({
      success: true,
      year,
      data: formattedData
    });

  } catch (error) {
    console.error("❌ ordersByMonth error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//----------------------------------------------------------------------------------------------------------------
// Sales By Month (Revenue)
const salesByMonth = async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();

    // 1️⃣ Aggregate sales by month
    const rawData = await orderModel.aggregate([
      {
        $match: {
          paymentStatus: { $in: ["paid", "captured"] },
          createdAt: {
            $gte: new Date(`${year}-01-01T00:00:00.000Z`),
            $lte: new Date(`${year}-12-31T23:59:59.999Z`)
          }
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          grossRevenue: { $sum: "$totalAmount" },
          netRevenue: { $sum: "$subTotal" },
          gstCollected: { $sum: "$gstAmount" }
        }
      }
    ]);

    // 2️⃣ Month labels
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    // 3️⃣ Normalize to all 12 months
    const formattedData = monthNames.map((month, index) => {
      const found = rawData.find(item => item._id === index + 1);
      return {
        month,
        grossRevenue: found ? Number(found.grossRevenue.toFixed(2)) : 0,
        netRevenue: found ? Number(found.netRevenue.toFixed(2)) : 0,
        gstCollected: found ? Number(found.gstCollected.toFixed(2)) : 0
      };
    });

    // 4️⃣ Exact response
    return res.status(200).json({
      success: true,
      year,
      data: formattedData
    });

  } catch (error) {
    console.error("❌ salesByMonth error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//----------------------------------------------------------------------------------------------------------------
// Top Selling Products
const topProducts = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const year = Number(req.query.year) || new Date().getFullYear();

    const data = await orderModel.aggregate([
      {
        $match: {
          paymentStatus: { $in: ["paid", "captured"] },
          createdAt: {
            $gte: new Date(`${year}-01-01T00:00:00.000Z`),
            $lte: new Date(`${year}-12-31T23:59:59.999Z`)
          }
        }
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          soldQuantity: { $sum: "$items.quantity" },
          grossRevenue: {
            $sum: {
              $multiply: ["$items.price", "$items.quantity"]
            }
          }
        }
      },
      { $sort: { soldQuantity: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "product_dbs",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $project: {
          _id: 0,
          productId: "$product._id",
          name: "$product.name",
          soldQuantity: 1,
          grossRevenue: { $round: ["$grossRevenue", 2] }
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      year,
      data
    });

  } catch (error) {
    console.error("❌ topProducts error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//----------------------------------------------------------------------------------------------------------------
// Low Stock Products
const lowStockProducts = async (req, res) => {
  try {
    const threshold = Number(req.query.threshold) || 10;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {
      stock: { $lte: threshold },
      isActive: true 
    };

    const [products, totalCount] = await Promise.all([
      productModel
        .find(query)
        .select("name stock price category brand isActive")
        .sort({ stock: 1 }) 
        .skip(skip)
        .limit(limit),

      productModel.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      threshold,
      pagination: {
        page,
        limit,
        totalRecords: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      data: products
    });

  } catch (error) {
    console.error("❌ lowStockProducts error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//----------------------------------------------------------------------------------------------------------------
// Order Status Summary
const orderStatusSummary = async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();

    const rawData = await orderModel.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${year}-01-01T00:00:00.000Z`),
            $lte: new Date(`${year}-12-31T23:59:59.999Z`)
          }
        }
      },
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 }
        }
      }
    ]);

    const statusList = [
      "placed",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
      "returned"
    ];

    const formattedData = statusList.map(status => {
      const found = rawData.find(item => item._id === status);
      return {
        status,
        count: found ? found.count : 0
      };
    });

    return res.status(200).json({
      success: true,
      year,
      data: formattedData
    });

  } catch (error) {
    console.error("❌ orderStatusSummary error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};


//----------------------------------------------------------------------------------------------------------------
// Sales By Category
const salesByCategory = async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();

    const data = await orderModel.aggregate([
      {
        $match: {
          paymentStatus: { $in: ["paid", "captured"] },
          createdAt: {
            $gte: new Date(`${year}-01-01T00:00:00.000Z`),
            $lte: new Date(`${year}-12-31T23:59:59.999Z`)
          }
        }
      },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "product_dbs", 
          localField: "items.productId",
          foreignField: "_id",
          as: "product"
        }
      },
      { 
        $unwind: { 
          path: "$product", 
          preserveNullAndEmptyArrays: true 
        } 
      },
      {
        $group: {
          _id: "$product.category",
          totalSold: { $sum: "$items.quantity" },
          grossRevenue: {
            $sum: { $multiply: ["$items.price", "$items.quantity"] }
          }
        }
      },
      {
        $lookup: {
          from: "category_dbs", 
          localField: "_id",
          foreignField: "_id",
          as: "categoryDetails"
        }
      },
      { 
        $unwind: { 
          path: "$categoryDetails", 
          preserveNullAndEmptyArrays: true 
        } 
      },
      {
        $project: {
          _id: 0,
          category: { $ifNull: ["$categoryDetails.name", "Unknown Category"] },
          totalSold: 1,
          grossRevenue: { $round: ["$grossRevenue", 2] }
        }
      },
      { $sort: { grossRevenue: -1 } }
    ]);

    return res.status(200).json({
      success: true,
      year,
      data
    });

  } catch (error) {
    console.error("❌ salesByCategory error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

//----------------------------------------------------------------------------------------------------------------
// Top Customers (Lifetime Value)
const topCustomers = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;

    const data = await orderModel.aggregate([
      {
        $match: {
          paymentStatus: { $in: ["paid", "captured"] } // Only counts successful payments
        }
      },
      {
        $group: {
          _id: "$userId", // Groups everything by the User's ID
          totalOrders: { $sum: 1 },
          lifetimeSpent: { $sum: "$totalAmount" } // Adds up their total spend
        }
      },
      { $sort: { lifetimeSpent: -1 } }, // Sorts highest spenders to the top
      { $limit: limit },
      {
        $lookup: {
          // VERIFY: This string MUST exactly match the collection name inside your MongoDB database (e.g., 'users', 'user_dbs', 'Users')
          from: "user_dbs", 
          localField: "_id", // The userId we grouped by earlier
          foreignField: "_id", // The _id field in the Users collection
          as: "user"
        }
      },
      { 
        $unwind: { 
          path: "$user", 
          // CRITICAL: If the lookup fails, this prevents the array from wiping out the data
          preserveNullAndEmptyArrays: true 
        } 
      },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          // Fallbacks added so your frontend doesn't crash if the lookup fails
          name: { $ifNull: ["$user.name", "Unknown User"] },
          email: { $ifNull: ["$user.email", "Unknown Email"] },
          totalOrders: 1,
          lifetimeSpent: { $round: ["$lifetimeSpent", 2] }
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      data
    });

  } catch (error) {
    console.error("❌ topCustomers error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

//----------------------------------------------------------------------------------------------------------------
// User Growth By Month
const userGrowthByMonth = async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();

    const rawData = await userModel.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${year}-01-01T00:00:00.000Z`),
            $lte: new Date(`${year}-12-31T23:59:59.999Z`)
          }
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          newUsers: { $sum: 1 }
        }
      }
    ]);

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const formattedData = monthNames.map((month, index) => {
      const found = rawData.find(item => item._id === index + 1);
      return {
        month,
        newUsers: found ? found.newUsers : 0
      };
    });

    return res.status(200).json({
      success: true,
      year,
      data: formattedData
    });

  } catch (error) {
    console.error("❌ userGrowthByMonth error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//----------------------------------------------------------------------------------------------------------------
// Recent Orders Feed
const recentOrders = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;

    const orders = await orderModel.find()
      .sort({ createdAt: -1 }) // Sorts by newest first
      .limit(limit)
      // VERIFY: Ensure 'userId' exactly matches the field name in your order schema
      .populate('userId', 'name email') 
      .select('userId totalAmount orderStatus paymentStatus createdAt'); 

    return res.status(200).json({
      success: true,
      limit,
      data: orders
    });

  } catch (error) {
    console.error("❌ recentOrders error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};





//=========================================================================================================
//=========================================================================================================
//=========================================================================================================
module.exports = {
  dashboardOverview,
  ordersByMonth,
  salesByMonth,
  topProducts,
  lowStockProducts,
  orderStatusSummary,
  salesByCategory,
  topCustomers,
  userGrowthByMonth,
  recentOrders
};
