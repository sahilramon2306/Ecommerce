const nodemailer = require("nodemailer");

const APP_NAME = "SahimonCart";

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    console.log("======================================");
    console.log("📧 Starting email service...");
    console.log("Recipient:", to);
    console.log("EMAIL_USER:", process.env.EMAIL_USER);
    console.log(
      "EMAIL_PASS:",
      process.env.EMAIL_PASS ? "Loaded ✅" : "Missing ❌"
    );

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 30000,
    });

    // Verify SMTP connection
    await transporter.verify();
    console.log("✅ SMTP Server Connected Successfully");

    // Send Email
    const info = await transporter.sendMail({
      from: `"${APP_NAME}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("✅ Email Sent Successfully");
    console.log("Message ID:", info.messageId);
    console.log("Accepted:", info.accepted);
    console.log("Rejected:", info.rejected);
    console.log("Response:", info.response);
    console.log("======================================");

    return info;
  } catch (error) {
    console.log("======================================");
    console.error("❌ Email Sending Failed");
    console.error("Error Name:", error.name);
    console.error("Error Code:", error.code);
    console.error("Error Message:", error.message);

    if (error.response) {
      console.error("SMTP Response:", error.response);
    }

    console.error(error);
    console.log("======================================");

    throw error;
  }
};

module.exports = sendEmail;