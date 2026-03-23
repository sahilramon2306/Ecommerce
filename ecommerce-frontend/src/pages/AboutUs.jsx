import "../styles/about.css";

const AboutUs = () => {
  return (
    <div className="about-page">
      <div className="about-hero">
        <h1>About SahimonCart</h1>
        <p>Elevating everyday living through curated excellence</p>
      </div>

      <div className="about-content">
        <section className="about-section">
          <h2>Our Story</h2>
          <p>
            Founded in 2023, SahimonCart was born from a simple belief — 
            that everyone deserves access to premium, thoughtfully curated products 
            that enhance their lifestyle without compromise.
          </p>
          <p>
            What started as a small collection of handpicked essentials has grown 
            into a trusted destination for modern consumers who value quality, 
            design, and authenticity.
          </p>
        </section>

        <section className="about-section">
          <h2>Our Mission</h2>
          <p>
            To deliver exceptional products with transparency, sustainability, 
            and unmatched customer experience. We carefully select every item 
            we offer, ensuring it meets our rigorous standards of quality and style.
          </p>
        </section>

        <section className="values">
          <h2>Our Values</h2>
          <div className="values-grid">
            <div className="value-card">
              <h3>Quality First</h3>
              <p>Only the finest materials and craftsmanship make it to our store.</p>
            </div>
            <div className="value-card">
              <h3>Customer Obsessed</h3>
              <p>Your satisfaction is our top priority. Always.</p>
            </div>
            <div className="value-card">
              <h3>Transparency</h3>
              <p>Honest pricing, clear policies, and ethical sourcing.</p>
            </div>
            <div className="value-card">
              <h3>Sustainability</h3>
              <p>Supporting brands that care about our planet.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutUs;