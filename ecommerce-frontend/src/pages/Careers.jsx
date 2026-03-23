import "../styles/careers.css";

const Careers = () => {
  return (
    <div className="careers-page">
      <div className="page-hero">
        <h1>Careers at SahimonCart</h1>
        <p>Join our mission to redefine premium shopping</p>
      </div>

      <div className="careers-content">
        <p className="intro">
          We’re always looking for passionate, talented individuals who share 
          our obsession with quality and customer experience.
        </p>

        <div className="openings">
          <h2>Current Openings</h2>
          <div className="job-card">
            <h3>Senior Frontend Developer</h3>
            <p className="location">Kolkata • Full Time</p>
            <button className="apply-btn">Apply Now</button>
          </div>
          <div className="job-card">
            <h3>Marketing Manager</h3>
            <p className="location">Remote • Full Time</p>
            <button className="apply-btn">Apply Now</button>
          </div>
          <div className="job-card">
            <h3>Customer Experience Executive</h3>
            <p className="location">Kolkata • Full Time</p>
            <button className="apply-btn">Apply Now</button>
          </div>
        </div>

        <div className="culture">
          <h2>Why Join Us?</h2>
          <ul>
            <li>Competitive salary &amp; equity</li>
            <li>Flexible work culture</li>
            <li>Learning and growth opportunities</li>
            <li>Premium product discounts</li>
            <li>Health and wellness benefits</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Careers;