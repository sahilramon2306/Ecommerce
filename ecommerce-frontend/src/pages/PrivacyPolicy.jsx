import "../styles/policy.css";

const PrivacyPolicy = () => {
  return (
    <div className="policy-page">
      <div className="policy-hero">
        <h1>Privacy Policy</h1>
        <p>Last updated: March 18, 2026</p>
      </div>

      <div className="policy-content">
        <section>
          <h2>1. Information We Collect</h2>
          <p>
            We collect information you provide directly to us, such as when you create an account, 
            place an order, subscribe to our newsletter, or contact us. This may include your name, 
            email address, shipping address, phone number, and payment information.
          </p>
        </section>

        <section>
          <h2>2. How We Use Your Information</h2>
          <p>
            We use the information we collect to process your orders, communicate with you, 
            improve our services, and provide a personalized shopping experience.
          </p>
        </section>

        <section>
          <h2>3. Information Sharing</h2>
          <p>
            We do not sell your personal information. We may share your information with trusted 
            third-party service providers who assist us in operating our website and delivering 
            our services.
          </p>
        </section>

        <section>
          <h2>4. Cookies and Tracking</h2>
          <p>
            We use cookies and similar tracking technologies to enhance your browsing experience, 
            analyze website traffic, and understand user preferences.
          </p>
        </section>

        <section>
          <h2>5. Your Rights</h2>
          <p>
            You have the right to access, update, or delete your personal information. 
            You may also opt out of marketing communications at any time.
          </p>
        </section>

        <p className="last-updated">If you have any questions about this Privacy Policy, please contact us at support@sahimoncart.com</p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;