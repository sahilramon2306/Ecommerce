import { useState } from "react";
import { createContactMessage } from "../api/contactApi";
import "../styles/contact.css";


const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    setError("");
    setIsSuccess(false);
    setIsSubmitting(true);

    const response = await createContactMessage(formData);

    if (response.data.success) {
      setIsSuccess(true);

      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });

      setTimeout(() => {
        setIsSuccess(false);
      }, 5000);
    }
  } catch (error) {
    console.error("Contact Form Error:", error);

    setError(
      error?.response?.data?.message ||
      "Failed to send message. Please try again."
    );
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="contact-page">
      {/* Hero Section */}
      <section className="contact-hero">
        <span className="hero-badge">Get in Touch</span>

        <h1>
          How can we <span className="text-gradient">help you?</span>
        </h1>

        <p>
          Whether you have a question about our products,
          your order, or anything else, our team is ready
          to answer all your questions.
        </p>
      </section>

      {/* Contact Cards */}
      <div className="contact-cards-grid">
        <div className="contact-card">
          <div className="card-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </div>

          <h3>Talk to Sales</h3>

          <p>
            Interested in bulk orders or corporate
            gifting? Contact our sales team.
          </p>

          <span className="contact-detail">
            +91 98765 43210
          </span>
        </div>

        <div className="contact-card">
          <div className="card-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>

          <h3>Customer Support</h3>

          <p>
            Need help with an order? Our support team is
            here for you.
          </p>

          <span className="contact-detail">
            support@sahimoncart.com
          </span>
        </div>
      </div>

      <div className="contact-main-grid">
        {/* Form Section */}
        <div className="form-container">
          <div className="form-header">
            <h2>Send us a message</h2>

            <p>
              We usually respond within 2-4 hours during
              business days.
            </p>
          </div>

          {error && (
            <div className="error-banner">
              {error}
            </div>
          )}

          {isSuccess && (
            <div className="success-banner">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>

              Message sent successfully! We'll be in touch
              soon.
            </div>
          )}

          <form
            className="contact-form"
            onSubmit={handleSubmit}
          >
            <div className="input-group-row">
              <div className="input-field">
                <label htmlFor="name">
                  Full Name
                </label>

                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-field">
                <label htmlFor="email">
                  Email Address
                </label>

                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input-field">
              <label htmlFor="subject">
                Subject
              </label>

              <input
                type="text"
                id="subject"
                name="subject"
                placeholder="How can we help?"
                value={formData.subject}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-field">
              <div className="message-header">
                <label htmlFor="message">
                  Message
                </label>

                <span>
                  {formData.message.length}/1000
                </span>
              </div>

              <textarea
                id="message"
                name="message"
                rows="5"
                maxLength={1000}
                placeholder="Tell us more about your inquiry..."
                value={formData.message}
                onChange={handleChange}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`submit-btn ${
                isSubmitting ? "loading" : ""
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Sending Message...
                </>
              ) : (
                "Send Message"
              )}
            </button>
          </form>
        </div>

        {/* Sidebar */}
        <div className="contact-sidebar">
          <div className="sidebar-box">
            <h3>Visit our HQ</h3>

            <p className="address-text">
              SahimonCart Innovation Center
              <br />
              Sector V, Salt Lake City
              <br />
              Kolkata, West Bengal 700091
              <br />
              India
            </p>
          </div>

          <div className="sidebar-box faq-box">
            <h3>Frequently Asked Questions</h3>

            <div className="mini-faq">
              <h4>
                Do you ship internationally?
              </h4>

              <p>
                Currently, we only ship across India.
              </p>
            </div>

            <div className="mini-faq">
              <h4>
                What is your return policy?
              </h4>

              <p>
                We offer a hassle-free 7-day return
                window.
              </p>
            </div>

            <div className="mini-faq">
              <h4>
                Can I change my order?
              </h4>

              <p>
                Orders can be modified within 2 hours
                of placement.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;