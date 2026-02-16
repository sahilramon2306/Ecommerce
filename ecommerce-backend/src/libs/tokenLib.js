const jwt = require("jsonwebtoken");

// 1️⃣ Short-lived token (used in auth middleware)
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "60m" }
  );
};

// 2️⃣ Long-lived token (used to get new access token)
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// 3️⃣ Verify refresh token
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
};
