const userModel = require('../model/user.js');
const { getToken } = require("../utils/getToken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const blacklistModel = require('../model/blacklist.js');
const passwordLib = require("../libs/passwordLib.js")
const tokenLib = require('../libs/tokenLib.js')
const bcrypt = require("bcrypt");
require("dotenv").config(); 
const jwt = require("jsonwebtoken");
const RefreshToken = require("../model/refreshToken");




// User registration
const registration = async (req, res) => {
  try {
    console.log("▶️ Incoming request body:", req.body);

    // ❌ DO NOT accept role from client
    const { name, email, phone, password, addresses } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone and password are required."
      });
    }

    if (!Array.isArray(addresses) || addresses.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one address is required."
      });
    }

    const requiredAddressFields = [
      "postOffice",
      "policeStation",
      "pincode",
      "state",
      "district",
      "city",
      "addressLine"
    ];

    for (let addr of addresses) {
      for (let field of requiredAddressFields) {
        if (!addr[field]) {
          return res.status(400).json({
            success: false,
            message: `Address field '${field}' is required.`
          });
        }
      }
    }

    const existingUserEmail = await userModel.findOne({ email });
    if (existingUserEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already exists. Try another email."
      });
    }

    const existingUserPhone = await userModel.findOne({ phone });
    if (existingUserPhone) {
      return res.status(400).json({
        success: false,
        message: "Phone number already exists. Try another number."
      });
    }

    const hashedPassword = await passwordLib.getHashed(password);

    const newUser = new userModel({
      name,
      email,
      phone,
      password: hashedPassword,
      role: "customer", 
      addresses
    });

    await newUser.save();

    return res.status(201).json({
      success: true,
      message: `User ${name} registered successfully.`
    });

  } catch (err) {
    console.error("❌ Registration error:", err);

    if (err.code === 11000) {
      const duplicateField = Object.keys(err.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${duplicateField} already exists. Try another ${duplicateField}.`
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//--------------------------------------------------------------------------------------
// User Login
const login = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: "Email or Phone is required",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    const user = await userModel.findOne({
      $or: [{ email }, { phone }],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await passwordLib.passwordVerify(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    /* ------------------ JWT TOKEN ------------------ */
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" } // ⏱ token expiry
    );

    /* ------------------ SET COOKIE (CRITICAL) ------------------ */
    res.cookie("token", token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60 * 1000,
  });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
  });

  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
//---------------------------------------------------------------------------------------
// User Logout
const logout = async (req, res) => {
  const token = getToken(req);

  if (!token) {
    return res.status(400).json({
      success: false,
      message: "Token required"
    });
  }

  await blacklistModel.create({ token });

  res.json({
    success: true,
    message: "Logout successful."
  });
};

//---------------------------------------------------------------------------------------
// Get user profile
const getUserProfile = async (req, res) => {
  try {
    console.log("▶️ Fetching user profile");
    console.log("▶️ Authenticated user:", req.user);

    const userId = req.user.id; // MongoDB _id from JWT

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access"
      });
    }

    const user = await userModel
      .findById(userId)
      .select("-password -__v");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "User profile fetched successfully",
      data: user
    });

  } catch (err) {
    console.error("❌ Get user profile error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//----------------------------------------------------------------------------------------
// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    console.log("▶️ Incoming profile update request");
    console.log("▶️ Request body:", req.body);
    console.log("▶️ Authenticated user:", req.user);

    const userId = req.user.id; // MongoDB _id from JWT

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access"
      });
    }

    const { name, phone, addresses } = req.body;

    // At least one field must be provided
    if (!name && !phone && !addresses) {
      return res.status(400).json({
        success: false,
        message: "At least one field (name, phone, address) is required to update."
      });
    }

    // Phone number validation (if updating)
    if (phone) {
      const existingPhone = await userModel.findOne({
        phone,
        _id: { $ne: userId }
      });

      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: "Phone number already exists. Try another number."
        });
      }
    }

    // Address validation (if updating)
    if (addresses) {
      if (!Array.isArray(addresses) || addresses.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one address is required."
        });
      }

      const requiredAddressFields = [
        "postOffice",
        "policeStation",
        "pincode",
        "state",
        "district",
        "city",
        "addressLine"
      ];

      for (let addr of addresses) {
        for (let field of requiredAddressFields) {
          if (!addr[field]) {
            return res.status(400).json({
              success: false,
              message: `Address field '${field}' is required.`
            });
          }
        }
      }
    }

    // Build update object dynamically
    const updateData = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (addresses) updateData.addresses = addresses;

    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select("-password -__v");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "User profile updated successfully",
      data: updatedUser
    });

  } catch (err) {
    console.error("❌ Update profile error:", err);

    if (err.code === 11000) {
      const duplicateField = Object.keys(err.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${duplicateField} already exists. Try another ${duplicateField}.`
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//-----------------------------------------------------------------------------------------------------
// Add user address
const addUserAddress = async (req, res) => {
  try {
    console.log("▶️ Incoming add address request");
    console.log("▶️ Request body:", req.body);
    console.log("▶️ Authenticated user:", req.user);

    const userId = req.user.id; // MongoDB _id from JWT

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access"
      });
    }

    const {
      postOffice,
      policeStation,
      pincode,
      state,
      district,
      city,
      addressLine
    } = req.body;

    // Validate required fields
    const requiredFields = [
      "postOffice",
      "policeStation",
      "pincode",
      "state",
      "district",
      "city",
      "addressLine"
    ];

    for (let field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          message: `Address field '${field}' is required.`
        });
      }
    }

    const newAddress = {
      postOffice,
      policeStation,
      pincode,
      state,
      district,
      city,
      addressLine
    };

    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { $push: { addresses: newAddress } },
      { new: true }
    ).select("-password -__v");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(201).json({
      success: true,
      message: "Address added successfully",
      data: updatedUser.addresses
    });

  } catch (err) {
    console.error("❌ Add address error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//-------------------------------------------------------------------------------------------------------
// Get all address under a single user
const getAllAddressUnderASingleUser = async (req, res) => {
  try {
    console.log("▶️ Fetching all addresses under a single user");
    console.log("▶️ Authenticated user:", req.user);

    const userId = req.user.id; // MongoDB _id from JWT

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access"
      });
    }

    const user = await userModel
      .findById(userId)
      .select("addresses");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "All addresses under the user fetched successfully",
      data: user.addresses
    });

  } catch (err) {
    console.error("❌ Get addresses error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//-------------------------------------------------------------------------------------------------
// Get single address of a user
const getSingleAddressOfUser = async (req, res) => {
  try {
    console.log("▶️ Fetching single address of user");
    console.log("▶️ Authenticated user:", req.user);
    console.log("▶️ Address ID:", req.params.addressId);

    const userId = req.user.id; // from JWT
    const { addressId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access"
      });
    }

    if (!addressId) {
      return res.status(400).json({
        success: false,
        message: "Address ID is required"
      });
    }

    const user = await userModel
      .findById(userId)
      .select("addresses");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const address = user.addresses.find(
      (addr) => addr._id && addr._id.toString() === addressId
    );

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found for this user"
      });
    }

    return res.status(200).json({
      success: true,
      message: "User address fetched successfully",
      data: address
    });

  } catch (err) {
    console.error("❌ Get single address error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//--------------------------------------------------------------------------------------------------
// update Single Address Of User
const updateSingleAddressOfUser = async (req, res) => {
  try {
    console.log("▶️ Updating single address of user");
    console.log("▶️ Authenticated user:", req.user);
    console.log("▶️ Address ID:", req.params.addressId);
    console.log("▶️ Update payload:", req.body);

    const userId = req.user.id; // from JWT
    const { addressId } = req.params;
    const updateData = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access"
      });
    }

    if (!addressId) {
      return res.status(400).json({
        success: false,
        message: "Address ID is required"
      });
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No data provided for update"
      });
    }

    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id && addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Address not found for this user"
      });
    }


    if (updateData.isDefault === true) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    const allowedFields = [
      "houseNo",
      "postOffice",
      "policeStation",
      "pincode",
      "state",
      "district",
      "city",
      "addressLine",
      "landmark",
      "isDefault"
    ];

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        user.addresses[addressIndex][field] = updateData[field];
      }
    });

    await user.save();

    return res.status(200).json({
      success: true,
      message: "User address updated successfully",
      data: user.addresses[addressIndex]
    });

  } catch (err) {
    console.error("❌ Update address error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//--------------------------------------------------------------------------------------------------
// Delete Single Address Of User
const deleteSingleAddressOfUser = async (req, res) => {
  try {
    console.log("▶️ Deleting single address of user");
    console.log("▶️ Authenticated user:", req.user);
    console.log("▶️ Address ID:", req.params.addressId);

    const userId = req.user.id; // MongoDB _id from JWT
    const { addressId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access"
      });
    }

    if (!addressId) {
      return res.status(400).json({
        success: false,
        message: "Address ID is required"
      });
    }

    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id && addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Address not found for this user"
      });
    }

    const deletedAddress = user.addresses[addressIndex];
    const wasDefault = deletedAddress.isDefault === true;

    // Remove the address
    user.addresses.splice(addressIndex, 1);

    // If default address was deleted, assign default to first address
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "User address deleted successfully",
      data: deletedAddress
    });

  } catch (err) {
    console.error("❌ Delete address error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//----------------------------------------------------------------------------------------------------
// Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // 🔐 Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 🔐 Hash OTP
    const hashedOTP = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    // 🔐 Save hashed OTP & expiry
    user.resetPasswordOTP = hashedOTP;
    user.resetPasswordOTPExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    // 📧 Send OTP
    await sendEmail({
      to: user.email,
      subject: "Password Reset OTP",
      text: `Your password reset OTP is ${otp}. It is valid for 10 minutes.`
    });

    return res.status(200).json({
      success: true,
      message: `OTP sent to registered email ${email}`
    });

  } catch (err) {
    console.error("❌ Forgot password error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//------------------------------------------------------------------------------------------------------
// Verify Reset OTP
const verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required"
      });
    }

    const hashedOTP = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    const user = await userModel.findOne({
      email,
      resetPasswordOTP: hashedOTP,
      resetPasswordOTPExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP"
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully"
    });

  } catch (err) {
    console.error("❌ Verify OTP error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//----------------------------------------------------------------------------------------------------
// Reset Password 
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const hashedOTP = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    const user = await userModel.findOne({
      email,
      resetPasswordOTP: hashedOTP,
      resetPasswordOTPExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP"
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpire = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successful"
    });

  } catch (err) {
    console.error("❌ Reset password error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//-----------------------------------------------------------------------------------------------------
// Change Password
const changePassword = async (req, res) => {
  try {
    console.log("▶️ Change password request");
    console.log("▶️ Authenticated user:", req.user);

    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Old password and new password are required"
      });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from old password"
      });
    }

    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Old password is incorrect"
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });

  } catch (err) {
    console.error("❌ Change password error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//------------------------------------------------------------------------------------------------------
// Refresh Token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required"
      });
    }

    let decoded;
    try {
      decoded = tokenLib.verifyRefreshToken(refreshToken);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token"
      });
    }

    const user = await userModel.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const newAccessToken = tokenLib.generateAccessToken(user);

    return res.status(200).json({
      success: true,
      message: "Access token refreshed",
      data: {
        accessToken: newAccessToken
      }
    });

  } catch (error) {
    console.error("Refresh token error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};






//=========================================================================================================
//=========================================================================================================
//=========================================================================================================
module.exports = {
  registration: registration,
  login: login,
  logout: logout,
  getUserProfile: getUserProfile,
  updateUserProfile: updateUserProfile,
  addUserAddress: addUserAddress,
  getAllAddressUnderASingleUser: getAllAddressUnderASingleUser,
  getSingleAddressOfUser: getSingleAddressOfUser,
  updateSingleAddressOfUser: updateSingleAddressOfUser,
  deleteSingleAddressOfUser: deleteSingleAddressOfUser,
  forgotPassword: forgotPassword,
  verifyResetOTP: verifyResetOTP,
  resetPassword: resetPassword,
  changePassword: changePassword,
  refreshToken: refreshToken
};
