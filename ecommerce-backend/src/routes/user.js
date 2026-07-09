const userController = require("../controller/user.js");
const authMiddleware = require("../middleware/auth.js");
const adminMiddleware = require("../middleware/adminMiddleware.js");

// set Routes for User
const setRouter = (app) => {
    app.post("/registration", userController.registration);
    app.post("/verify-Registration-OTP", userController.verifyRegistrationOTP);
    app.post("/user-login", userController.login);
    app.post("/user-logout", authMiddleware, userController.logout);
    app.get("/get-User-Profile", authMiddleware, userController.getUserProfile);
    app.put("/update-User-Profile", authMiddleware, userController.updateUserProfile);
    app.post("/add-User-Address", authMiddleware, userController.addUserAddress);
    app.get("/get-All-Address-Under-A-Single-User", authMiddleware, userController.getAllAddressUnderASingleUser);
    app.get("/get-Single-Address-Of-User/:addressId", authMiddleware, userController.getSingleAddressOfUser);
    app.put("/update-Single-Address-Of-User/:addressId", authMiddleware, userController.updateSingleAddressOfUser);
    app.delete("/delete-Single-Address-Of-User/:addressId", authMiddleware, userController.deleteSingleAddressOfUser);
    app.post("/forgot-Password", userController.forgotPassword);
    app.post("/verify-Reset-OTP", userController.verifyResetOTP);
    app.post("/reset-Password", userController.resetPassword);
    app.put("/change-Password", authMiddleware, userController.changePassword);
    app.post("/refresh-Token", authMiddleware, userController.refreshToken);
    app.get("/get-All-Users-Admin", authMiddleware, adminMiddleware, userController.getAllUsersAdmin);
    app.get("/get-Single-User-Admin/:userId", authMiddleware, adminMiddleware, userController.getSingleUserAdmin);
    app.put("/change-User-Status-Admin/:userId", authMiddleware, adminMiddleware, userController.changeUserStatusAdmin);
    app.put("/change-User-Role-Admin/:userId", authMiddleware, adminMiddleware, userController.changeUserRoleAdmin);
    app.delete("/delete-User-Admin/:userId", authMiddleware, adminMiddleware, userController.deleteUserAdmin);
    app.get("/public-site-stats", userController.getPublicSiteStats);
};

module.exports = { setRouter };
