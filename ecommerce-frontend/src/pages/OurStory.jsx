import "../styles/ourstory.css";

const OurStory = () => {
  return (
    <div className="story-page">
      {/* Hero Section with Glassmorphism effect */}
      <section className="story-hero">
        <div className="hero-badge">Since 2023</div>
        <h1>Our Story</h1>
        <p>Crafting a premium lifestyle, one curated product at a time.</p>
      </section>

      <section className="story-content">
        <div className="section-header">
          <span>The Journey</span>
          <h2>How we built SahimonCart</h2>
        </div>

        <div className="story-timeline">
          <div className="timeline-line"></div>
          
          <div className="timeline-item left">
            <div className="year-bubble">2023</div>
            <div className="content-card">
              <h3>The Beginning</h3>
              <p>
                SahimonCart started in a small apartment in Kolkata with one goal — 
                to bring carefully curated, high-quality products to Indian homes.
              </p>
            </div>
          </div>

          <div className="timeline-item right">
            <div className="year-bubble">2024</div>
            <div className="content-card">
              <h3>Growth & Trust</h3>
              <p>
                We expanded our collection and earned the trust of 
                thousands of customers who now consider us their go-to destination 
                for premium lifestyle products.
              </p>
            </div>
          </div>

          <div className="timeline-item left">
            <div className="year-bubble">2025</div>
            <div className="content-card">
              <h3>Looking Ahead</h3>
              <p>
                Today, we continue to grow while staying true to our core values: 
                quality, elegance, and customer satisfaction.
              </p>
            </div>
          </div>
        </div>

        {/* Founder Section */}
        <div className="founder-section">
          <div className="founder-grid">
            <div className="founder-image-container">
              {/* Replace the src with your actual portrait path */}
              <img 
                src="/public/founder_picture.png" 
                alt="Sahil Reza" 
                className="founder-image"
              />
              <div className="image-decoration"></div>
            </div>
            <div className="founder-text">
              <span className="quote-icon">“</span>
              <p>
                We believe shopping should be an experience, not just a transaction. 
                Every product on SahimonCart is chosen with love, care, and the promise 
                that it will bring joy and value to your life.
              </p>
              <div className="founder-info">
                <h4 className="founder-name">Sahil Reza</h4>
                <p className="founder-title">Founder, SahimonCart</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default OurStory;