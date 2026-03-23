import { Link } from "react-router-dom";
import { FaFacebookF, FaInstagram, FaTwitter, FaGithub, FaLinkedin } from "react-icons/fa";
import "../styles/footer.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">

        {/* BRAND SECTION */}
        <div className="footer-brand">
          <h2 className="brand-name">SahimonCart</h2>
          <p className="brand-desc">
            Curating exceptional products for the modern lifestyle. 
            Where quality meets elegance and trust is our foundation.
          </p>

          <div className="footer-socials">
            <a href="https://www.facebook.com/" aria-label="Facebook" className="social-link"><FaFacebookF /></a>
            <a href="https://www.instagram.com/" aria-label="Instagram" className="social-link"><FaInstagram /></a>
            <a href="https://twitter.com/" aria-label="Twitter" className="social-link"><FaTwitter /></a>
            <a href="https://www.linkedin.com/" aria-label="LinkedIn" className="social-link"><FaLinkedin /></a>
            <a href="https://github.com/" aria-label="GitHub" className="social-link"><FaGithub /></a>
          </div>
        </div>

        {/* SHOP LINKS */}
        <div className="footer-column">
          <h4 className="column-title">Shop</h4>
          <Link to="/" className="footer-link">Home</Link>
          <Link to="/cart" className="footer-link">Cart</Link>
          <Link to="/orders" className="footer-link">My Orders</Link>
          <Link to="/profile" className="footer-link">Profile</Link>
          <Link to="/wishlist" className="footer-link">Wishlist</Link>
        </div>

        {/* COMPANY LINKS - Now using React Router Link */}
        <div className="footer-column">
          <h4 className="column-title">Company</h4>
          <Link to="/about" className="footer-link">About Us</Link>
          <Link to="/careers" className="footer-link">Careers</Link>
          <Link to="/our-story" className="footer-link">Our Story</Link>
          <Link to="/blog" className="footer-link">Blog</Link>
          <Link to="/contact" className="footer-link">Contact Us</Link>
        </div>

        {/* SUPPORT */}
        <div className="footer-column">
          <h4 className="column-title">Support</h4>
          <a href="#" className="footer-link">Help Center</a>
          <a href="#" className="footer-link">Shipping Info</a>
          <a href="#" className="footer-link">Returns & Exchanges</a>
          <a href="#" className="footer-link">Track Order</a>
          <a href="#" className="footer-link">FAQs</a>
        </div>

        {/* NEWSLETTER */}
        <div className="footer-newsletter">
          <h4 className="column-title">Stay in the Know</h4>
          <p className="newsletter-desc">
            Join our community and be the first to receive exclusive offers, new arrivals, and premium insights.
          </p>

          <div className="newsletter-box">
            <input 
              type="email" 
              placeholder="your@email.com" 
              aria-label="Email address"
            />
            <button type="button">Subscribe</button>
          </div>
          <p className="newsletter-note">We respect your inbox. Unsubscribe anytime.</p>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="footer-bottom">
        <div className="bottom-content">
          <p className="copyright">
            © {currentYear} SahimonCart. All rights reserved.
          </p>
          <div className="bottom-links">
            <a href="#">Privacy Policy</a>
            <Link to="/terms-of-service" className="footer-link">Terms of Service</Link>
            <Link to="/accessibility" className="footer-link">Accessibility</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;