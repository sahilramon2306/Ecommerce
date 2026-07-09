const contactController = require("../controller/contactMessage.js");
const authMiddleware = require("../middleware/auth.js");
const adminMiddleware = require("../middleware/adminMiddleware.js");


const setRouter = (app) => {
  // Public
  app.post(
    "/contact",
    contactController.createContactMessage
  );

  // Admin
  app.get(
    "/contact-messages",
    authMiddleware,
    adminMiddleware,
    contactController.getAllContactMessages
  );

  app.get(
    "/contact-messages/:id",
    authMiddleware,
    adminMiddleware,
    contactController.getContactMessageById
  );

  app.put(
    "/contact-messages/:id/status",
    authMiddleware,
    adminMiddleware,
    contactController.updateContactStatus
  );

  app.delete(
    "/contact-messages/:id",
    authMiddleware,
    adminMiddleware,
    contactController.deleteContactMessage
  );
};

module.exports = { setRouter };