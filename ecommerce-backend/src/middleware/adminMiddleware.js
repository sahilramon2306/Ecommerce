const adminMiddleware = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access"
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access only"
      });
    }

    next();

  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Admin authorization failed"
    });
  }
};

module.exports = adminMiddleware;
