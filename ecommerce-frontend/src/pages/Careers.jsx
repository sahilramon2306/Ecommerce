import "../styles/careers.css";

const Careers = () => {
  return (
    <div className="careers-page">
      {/* SaaS Hero Section */}
      <section className="page-hero">
        <div className="hero-content">
          <span className="hiring-badge">We're Growing!</span>
          <h1>Build the future of <span className="text-gradient">premium commerce</span></h1>
          <p>Join Sahil and the team in our mission to redefine lifestyle shopping for Indian homes.</p>
        </div>
      </section>

      <div className="careers-container">
        {/* Founder's Invitation Section */}
        <section className="founder-invite">
          <div className="founder-flex">
            <div className="founder-image-box">
              {/* Use 'Copy Relative Path' for your portrait here */}
              <img src="/founder_picture.png" alt="Sahil Reza" className="founder-avatar" />
              <div className="status-indicator"></div>
            </div>
            <div className="founder-message">
              <h2>"We don't just hire employees; we build a family of innovators."</h2>
              <p>
                At SahimonCart, we value creativity and ownership. Whether you're a developer or a marketer, 
                your work directly impacts how thousands of customers experience quality.
              </p>
              <div className="founder-sig">
                <strong>Sahil Reza</strong>
                <span>Founder & CEO</span>
              </div>
            </div>
          </div>
        </section>

        {/* Current Openings */}
        <section className="openings-section">
          <div className="section-header">
            <h2>Current Opportunities</h2>
            <p>Find your place in our growing team in Kolkata or remotely.</p>
          </div>
          
          <div className="job-list">
            <div className="job-card">
              <div className="job-info">
                <h3>Senior Frontend Developer</h3>
                <span className="job-tag engineering">Engineering</span>
                <p className="location">📍 Kolkata, IN • Full Time</p>
              </div>
              <button className="apply-btn">View Role</button>
            </div>

            <div className="job-card">
              <div className="job-info">
                <h3>Marketing Manager</h3>
                <span className="job-tag marketing">Growth</span>
                <p className="location">🌍 Remote • Full Time</p>
              </div>
              <button className="apply-btn">View Role</button>
            </div>

            <div className="job-card">
              <div className="job-info">
                <h3>Customer Experience Executive</h3>
                <span className="job-tag support">Support</span>
                <p className="location">📍 Kolkata, IN • Full Time</p>
              </div>
              <button className="apply-btn">View Role</button>
            </div>
          </div>
        </section>

        {/* Perks Section */}
        <section className="perks-grid">
          <div className="perk-card">
            <div className="perk-icon">📈</div>
            <h4>Equity & Growth</h4>
            <p>Every team member gets a stake in the success of SahimonCart.</p>
          </div>
          <div className="perk-card">
            <div className="perk-icon">🏠</div>
            <h4>Flexible Work</h4>
            <p>We prioritize output over hours. Work from wherever you thrive.</p>
          </div>
          <div className="perk-card">
            <div className="perk-icon">🛍️</div>
            <h4>Store Credit</h4>
            <p>Enjoy huge discounts on our premium product collections.</p>
          </div>
          <div className="perk-card">
            <div className="perk-icon">💡</div>
            <h4>Learning Budget</h4>
            <p>Monthly stipend for books, courses, and certifications.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Careers;