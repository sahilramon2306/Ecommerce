import "../styles/accessibility.css";

const Accessibility = () => {
  return (
    <div className="accessibility-page">
      <div className="access-hero">
        <h1>Accessibility Statement</h1>
        <p>Last updated: March 18, 2026</p>
      </div>

      <div className="access-content">
        <section>
          <h2>Our Commitment</h2>
          <p>
            SahimonCart is committed to making our website accessible to everyone, 
            including people with disabilities. We strive to ensure that our digital 
            experience meets or exceeds accessibility standards.
          </p>
        </section>

        <section>
          <h2>Accessibility Features</h2>
          <div className="feature-list">
            <div className="feature-item">
              <h3>Semantic HTML Structure</h3>
              <p>Proper heading hierarchy and ARIA landmarks for screen readers.</p>
            </div>
            <div className="feature-item">
              <h3>High Color Contrast</h3>
              <p>Meets WCAG AA standards for better readability.</p>
            </div>
            <div className="feature-item">
              <h3>Keyboard Navigation</h3>
              <p>Full support for keyboard-only users.</p>
            </div>
            <div className="feature-item">
              <h3>Image Alternatives</h3>
              <p>Meaningful alt text for all images and icons.</p>
            </div>
            <div className="feature-item">
              <h3>Resizable Text</h3>
              <p>Text can be resized up to 200% without breaking layout.</p>
            </div>
            <div className="feature-item">
              <h3>Focus Indicators</h3>
              <p>Clear visible focus outlines for all interactive elements.</p>
            </div>
          </div>
        </section>

        <section>
          <h2>Feedback and Support</h2>
          <p>
            We welcome your feedback on the accessibility of SahimonCart. 
            If you encounter any barriers while using our website, please let us know so we can improve.
          </p>
          <p>
            Email: <strong>accessibility@sahimoncart.com</strong>
          </p>
        </section>

        <section>
          <h2>Continuous Improvement</h2>
          <p>
            We regularly audit and update our website to enhance accessibility. 
            This statement will be reviewed and updated periodically.
          </p>
        </section>

        <p className="last-updated">
          If you have any questions regarding this Accessibility Statement, please contact us.
        </p>
      </div>
    </div>
  );
};

export default Accessibility;