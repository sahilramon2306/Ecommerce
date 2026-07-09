const ContactMessage = require("../model/contactMessage");

// Create Contact Message
const createContactMessage = async (req, res) => {
  try {
    const {
      name,
      email,
      subject,
      message,
    } = req.body;

    if (
      !name ||
      !email ||
      !subject ||
      !message
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const contact = await ContactMessage.create({
      name,
      email,
      subject,
      message,
    });

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: contact,
    });
  } catch (error) {
    console.error(
      "createContactMessage:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
//---------------------------------------------------------------------------------------------

// Get All Messages (Admin)
const getAllContactMessages = async (
  req,
  res
) => {
  try {
    const page =
      Number(req.query.page) || 1;

    const limit =
      Number(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const [messages, totalCount] =
      await Promise.all([
        ContactMessage.find()
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),

        ContactMessage.countDocuments(),
      ]);

    return res.status(200).json({
      success: true,
      pagination: {
        page,
        limit,
        totalRecords: totalCount,
        totalPages: Math.ceil(
          totalCount / limit
        ),
      },
      data: messages,
    });
  } catch (error) {
    console.error(
      "getAllContactMessages:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

//---------------------------------------------------------------------------------------------
// Get Single Message
const getContactMessageById = async (
  req,
  res
) => {
  try {
    const message =
      await ContactMessage.findById(
        req.params.id
      );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error(
      "getContactMessageById:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

//---------------------------------------------------------------------------------------------

// Update Status
const updateContactStatus = async (
  req,
  res
) => {
  try {
    const { status } = req.body;

    const updated =
      await ContactMessage.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Status updated",
      data: updated,
    });
  } catch (error) {
    console.error(
      "updateContactStatus:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

//---------------------------------------------------------------------------------------------

// Delete Message
const deleteContactMessage = async (
  req,
  res
) => {
  try {
    const deleted =
      await ContactMessage.findByIdAndDelete(
        req.params.id
      );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Message deleted",
    });
  } catch (error) {
    console.error(
      "deleteContactMessage:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  createContactMessage,
  getAllContactMessages,
  getContactMessageById,
  updateContactStatus,
  deleteContactMessage,
};