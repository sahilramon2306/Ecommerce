const nodemailer = require("nodemailer");

const sendInvoiceEmail = async ({
  to,
  subject,
  text,
  html,
  attachmentPath,
  attachmentName = "invoice.pdf"
}) => {
  if (!to) {
    throw new Error("Email recipient is required");
  }

  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: `"SahimonCart" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html
  };

  if (attachmentPath) {
    mailOptions.attachments = [
      {
        filename: attachmentName,
        path: attachmentPath,
        contentType: "application/pdf"
      }
    ];
  }

  return transporter.sendMail(mailOptions);
};

module.exports = sendInvoiceEmail;