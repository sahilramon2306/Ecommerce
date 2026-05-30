import { Link } from "react-router-dom";
import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaGithub,
  FaLinkedin,
} from "react-icons/fa";
import {
  Mail,
  MapPin,
  Phone,
  Send,
  ShieldCheck,
  Truck,
  RefreshCcw,
} from "lucide-react";
import "../styles/footer.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const shopLinks = [
    { to: "/", label: "Home" },
    { to: "/cart", label: "Cart" },
    { to: "/orders", label: "My Orders" },
    { to: "/profile", label: "Profile" },
    { to: "/wishlist", label: "Wishlist" },
  ];

  const companyLinks = [
    { to: "/about", label: "About Us" },
    { to: "/careers", label: "Careers" },
    { to: "/our-story", label: "Our Story" },
    { to: "/blog", label: "Blog" },
    { to: "/contact", label: "Contact Us" },
  ];

  const supportLinks = [
    { to: "/help-center", label: "Help Center" },
    { to: "/shipping-info", label: "Shipping Info" },
    { to: "/returns", label: "Returns & Exchanges" },
    { to: "/track-order", label: "Track Order" },
    { to: "/faq", label: "FAQs" },
  ];

  return (
    <footer className="footer">
      <div className="footer-trustbar">
        <div className="trust-item">
          <ShieldCheck size={18} />
          <span>Secure checkout</span>
        </div>

        <div className="trust-item">
          <Truck size={18} />
          <span>Fast delivery</span>
        </div>

        <div className="trust-item">
          <RefreshCcw size={18} />
          <span>Easy returns</span>
        </div>
      </div>

      <div className="footer-container">
        <div className="footer-brand">
          <Link to="/" className="brand-name">
            SahimonCart
          </Link>

          <p className="brand-desc">
            Curating exceptional products for the modern lifestyle. Where quality
            meets elegance and trust is our foundation.
          </p>

          <div className="footer-contact">
            <a href="mailto:support@sahimoncart.com">
              <Mail size={16} />
              <span>support@sahimoncart.com</span>
            </a>

            <a href="tel:+919999999999">
              <Phone size={16} />
              <span>+91 99999 99999</span>
            </a>

            <span>
              <MapPin size={16} />
              India
            </span>
          </div>

          <div className="footer-socials">
            <a href="https://www.facebook.com/" aria-label="Facebook" className="social-link">
              <FaFacebookF />
            </a>
            <a href="https://www.instagram.com/" aria-label="Instagram" className="social-link">
              <FaInstagram />
            </a>
            <a href="https://twitter.com/" aria-label="Twitter" className="social-link">
              <FaTwitter />
            </a>
            <a href="https://www.linkedin.com/" aria-label="LinkedIn" className="social-link">
              <FaLinkedin />
            </a>
            <a href="https://github.com/" aria-label="GitHub" className="social-link">
              <FaGithub />
            </a>
          </div>
        </div>

        <div className="footer-column">
          <h4 className="column-title">Shop</h4>
          {shopLinks.map((link) => (
            <Link key={link.to} to={link.to} className="footer-link">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="footer-column">
          <h4 className="column-title">Company</h4>
          {companyLinks.map((link) => (
            <Link key={link.to} to={link.to} className="footer-link">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="footer-column">
          <h4 className="column-title">Support</h4>
          {supportLinks.map((link) => (
            <Link key={link.to} to={link.to} className="footer-link">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="footer-newsletter">
          <h4 className="column-title">Stay in the Know</h4>

          <p className="newsletter-desc">
            Get early access to exclusive offers, new arrivals, and premium
            product updates.
          </p>

          <form className="newsletter-box">
            <input
              type="email"
              placeholder="your@email.com"
              aria-label="Email address"
            />
            <button type="submit" aria-label="Subscribe">
              <span>Subscribe</span>
              <Send size={16} />
            </button>
          </form>

          <p className="newsletter-note">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="bottom-content">
          <p className="copyright">
            © {currentYear} SahimonCart. All rights reserved.
          </p>

          <div className="bottom-links">
            <Link to="/terms-of-service">Terms of Service</Link>
            <Link to="/accessibility">Accessibility</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
