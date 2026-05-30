import "../styles/returns.css";

const Returns = () => {
  return (
    <div className="returns-page">
      {/* SaaS Hero Section */}
      <section className="returns-hero">
        <span className="hero-badge">Hassle-Free</span>
        <h1>Returns & <span className="text-gradient">Exchanges</span></h1>
        <p>We stand behind the quality of SahimonCart products. If you're not completely satisfied, we've made the return process as simple as possible.</p>
      </section>

      <div className="returns-container">
        {/* Core Policy Highlights */}
        <div className="policy-highlights">
          <div className="highlight-card">
            <div className="icon">🗓️</div>
            <h3>7-Day Window</h3>
            <p>You have 7 days from the date of delivery to initiate a return or exchange for any eligible items.</p>
          </div>
          <div className="highlight-card">
            <div className="icon">✨</div>
            <h3>Pristine Condition</h3>
            <p>Items must be unused, unwashed, and in their original premium packaging with all tags attached.</p>
          </div>
          <div className="highlight-card">
            <div className="icon">💳</div>
            <h3>Fast Refunds</h3>
            <p>Once inspected, refunds are processed to your original payment method within 5-7 business days.</p>
          </div>
        </div>

        {/* Step-by-Step Guide */}
        <section className="process-section">
          <h2>How to Return an Item</h2>
          <div className="steps-container">
            <div className="step-box">
              <div className="step-number">01</div>
              <h4>Initiate Request</h4>
              <p>Log into your SahimonCart account, navigate to 'Orders', and select the item you wish to return.</p>
            </div>
            <div className="step-box">
              <div className="step-number">02</div>
              <h4>Pack Carefully</h4>
              <p>Place the item back in its original packaging to ensure it stays protected during transit.</p>
            </div>
            <div className="step-box">
              <div className="step-number">03</div>
              <h4>Hand to Courier</h4>
              <p>Our delivery partner will pick up the package directly from your address within 24-48 hours.</p>
            </div>
          </div>
        </section>

        {/* Exceptions Box */}
        <section className="exceptions-section">
          <div className="exceptions-content">
            <h3>Non-Returnable Items</h3>
            <p>For hygiene and safety reasons, the following items cannot be returned or exchanged unless defective:</p>
            <ul>
              <li>Personalized or custom-made products</li>
              <li>Intimate apparel and innerwear</li>
              <li>Gift cards and promotional freebies</li>
            </ul>
          </div>
        </section>

        {/* Support CTA */}
        <section className="help-cta">
          <p>Need help with a return or have a defective item?</p>
          <button className="support-btn">Contact Support</button>
        </section>
      </div>
    </div>
  );
};

export default Returns;