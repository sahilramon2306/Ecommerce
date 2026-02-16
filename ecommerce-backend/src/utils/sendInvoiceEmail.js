const nodemailer = require("nodemailer");

const sendInvoiceEmail = async ({ to, subject, text, attachmentPath }) => {
  if (!to) throw new Error("No recipient email provided");
  if (!attachmentPath) throw new Error("Invoice file path missing");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    attachments: [
      {
        filename: "invoice.pdf",
        path: attachmentPath
      }
    ]
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendInvoiceEmail;
