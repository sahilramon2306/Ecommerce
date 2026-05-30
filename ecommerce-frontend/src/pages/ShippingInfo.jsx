import "../styles/shipping.css";

const ShippingInfo = () => {
  return (
    <div className="shipping-page">
      {/* SaaS Hero Header */}
      <section className="shipping-hero">
        <span className="hero-badge">Logistics</span>
        <h1>Shipping & <span className="text-gradient">Delivery</span></h1>
        <p>Everything you need to know about how your SahimonCart orders get from our Kolkata fulfillment center directly to your doorstep.</p>
      </section>

      <div className="shipping-container">
        {/* Shipping Methods Grid */}
        <div className="section-title">
          <h2>Delivery Options</h2>
          <p>Choose the speed that works best for you at checkout.</p>
        </div>

        <div className="methods-grid">
          <div className="method-card">
            <div className="method-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
            <div className="method-details">
              <h3>Standard Delivery</h3>
              <p>Reliable and tracked shipping across India.</p>
              <div className="method-meta">
                <span className="time">3-5 Business Days</span>
                <span className="price">Free over ₹999</span>
              </div>
            </div>
          </div>

          <div className="method-card express">
            <div className="method-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <div className="method-details">
              <h3>Express Delivery</h3>
              <p>Priority processing and expedited transit times.</p>
              <div className="method-meta">
                <span className="time">1-2 Business Days</span>
                <span className="price">₹149</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Lifecycle Timeline */}
        <section className="process-section">
          <h2>The Journey of Your Order</h2>
          <div className="timeline">
            <div className="timeline-step">
              <div className="step-circle">1</div>
              <div className="step-content">
                <h4>Order Placed</h4>
                <p>Once you complete checkout, you'll receive a confirmation email with your order number.</p>
              </div>
            </div>
            <div className="timeline-step">
              <div className="step-circle">2</div>
              <div className="step-content">
                <h4>Processing & Quality Check</h4>
                <p>Our team carefully inspects and packs your items. Orders are dispatched within 24 hours.</p>
              </div>
            </div>
            <div className="timeline-step">
              <div className="step-circle">3</div>
              <div className="step-content">
                <h4>In Transit</h4>
                <p>Your package is handed over to our trusted courier partners. A tracking link is sent via email.</p>
              </div>
            </div>
            <div className="timeline-step">
              <div className="step-circle">4</div>
              <div className="step-content">
                <h4>Delivery</h4>
                <p>Your premium lifestyle products arrive safely at your doorstep.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Premium Packaging & Tracking Grid */}
        <div className="info-grid">
          <div className="info-card">
            <div className="info-icon">🎁</div>
            <h3>Premium Packaging</h3>
            <p>Every order is wrapped in our signature eco-friendly, protective packaging to ensure your items arrive in pristine condition, ready for the perfect unboxing experience.</p>
          </div>
          
          <div className="info-card">
            <div className="info-icon">📍</div>
            <h3>Real-Time Tracking</h3>
            <p>Stay updated every step of the way. You can track your order directly from your Account Dashboard or using the tracking link provided in your dispatch email.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingInfo;