import "../styles/ourstory.css";

const OurStory = () => {
  return (
    <div className="story-page">
      <div className="story-hero">
        <h1>Our Story</h1>
        <p>From a small idea to a premium lifestyle brand</p>
      </div>

      <div className="story-content">
        <div className="story-timeline">
          <div className="timeline-item">
            <div className="year">2023</div>
            <div className="content">
              <h3>The Beginning</h3>
              <p>
                SahimonCart started in a small apartment in Kolkata with one goal — 
                to bring carefully curated, high-quality products to Indian homes.
              </p>
            </div>
          </div>

          <div className="timeline-item">
            <div className="year">2024</div>
            <div className="content">
              <h3>Growth &amp; Trust</h3>
              <p>
                Within a year, we expanded our collection and earned the trust of 
                thousands of customers who now consider SahimonCart their go-to destination 
                for premium lifestyle products.
              </p>
            </div>
          </div>

          <div className="timeline-item">
            <div className="year">2025</div>
            <div className="content">
              <h3>Looking Ahead</h3>
              <p>
                Today, we continue to grow while staying true to our core values: 
                quality, elegance, and customer satisfaction.
              </p>
            </div>
          </div>
        </div>

        <div className="founder-note">
          <h2>A Note from the Founder</h2>
          <p>
            "We believe shopping should be an experience, not just a transaction. 
            Every product on SahimonCart is chosen with love, care, and the promise 
            that it will bring joy and value to your life."
          </p>
          <p className="founder-name">— Sahil Reza, Founder</p>
        </div>
      </div>
    </div>
  );
};

export default OurStory;