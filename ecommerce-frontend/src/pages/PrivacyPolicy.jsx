import {
  FaDatabase,
  FaEnvelope,
  FaLock,
  FaShieldAlt,
  FaUserCheck,
} from "react-icons/fa";
import "../styles/policy.css";
import { Link } from "react-router-dom";

const sections = [
  {
    id: "collection",
    title: "Information we collect",
    icon: <FaDatabase />,
    body:
      "We collect the details needed to create your account, process orders, deliver products, provide support, prevent fraud, and improve SahimonCart.",
    items: [
      "Account details such as name, email address, phone number, and password.",
      "Order details such as delivery address, billing information, products purchased, and payment status.",
      "Support details when you contact us through email, chat, forms, or customer service channels.",
      "Usage details such as pages viewed, device information, browser type, IP address, and activity logs.",
    ],
  },
  {
    id: "usage",
    title: "How we use your information",
    icon: <FaUserCheck />,
    body:
      "We use your information to run the shopping experience securely, personalize your account, complete transactions, and communicate important updates.",
    items: [
      "Process orders, payments, shipping, returns, refunds, and customer support.",
      "Send service messages such as OTPs, order updates, delivery notices, and account alerts.",
      "Improve product recommendations, website performance, fraud detection, and customer experience.",
      "Send marketing messages only where permitted, with an option to unsubscribe.",
    ],
  },
  {
    id: "sharing",
    title: "Information sharing",
    icon: <FaShieldAlt />,
    body:
      "We do not sell your personal information. We share data only with trusted partners who help us operate the platform.",
    items: [
      "Payment providers for secure payment processing.",
      "Delivery partners for shipping and order tracking.",
      "Analytics, hosting, communication, and fraud-prevention providers.",
      "Authorities if required by law, regulation, legal process, or safety obligations.",
    ],
  },
  {
    id: "security",
    title: "Security and retention",
    icon: <FaLock />,
    body:
      "We use technical and organizational safeguards to protect personal data and keep it only as long as needed.",
    items: [
      "Passwords and sensitive authentication data should be protected using secure methods.",
      "Payment details are processed through trusted payment partners.",
      "Order and account records may be retained for legal, tax, fraud-prevention, and support purposes.",
      "No online service is completely risk-free, but we work to reduce unauthorized access and misuse.",
    ],
  },
];

const rights = [
  "Access the personal information linked to your account.",
  "Update inaccurate or incomplete account information.",
  "Request deletion of eligible personal information.",
  "Opt out of promotional communication.",
];

const PrivacyPolicy = () => {
  return (
    <main className="privacy-page">
      <section className="privacy-hero">
        <div className="privacy-hero-copy">
          <span className="privacy-eyebrow">
            <FaShieldAlt /> Privacy Policy
          </span>
          <h1>Your data, handled with care.</h1>
          <p>
            This policy explains what SahimonCart collects, why we collect it,
            how we protect it, and the choices available to you.
          </p>
          <div className="privacy-meta">
            <span>Last updated: March 18, 2026</span>
            <span>Applies to SahimonCart customers</span>
          </div>
        </div>

        <aside className="privacy-trust-panel" aria-label="Privacy highlights">
          <div>
            <strong>No data selling</strong>
            <span>We do not sell your personal information.</span>
          </div>
          <div>
            <strong>Secure checkout</strong>
            <span>Payment processing is handled by trusted providers.</span>
          </div>
          <div>
            <strong>Your choices</strong>
            <span>You can request access, correction, or deletion.</span>
          </div>
        </aside>
      </section>

      <div className="privacy-layout">
        <aside className="privacy-toc" aria-label="Policy navigation">
          <p>On this page</p>
          {sections.map((section) => (
            <a key={section.id} href={`#${section.id}`}>
              {section.title}
            </a>
          ))}
          <a href="#rights">Your rights</a>
          <a href="#contact">Contact</a>
        </aside>

        <div className="privacy-content">
          {sections.map((section) => (
            <section className="privacy-section" id={section.id} key={section.id}>
              <div className="privacy-section-icon">{section.icon}</div>
              <div>
                <h2>{section.title}</h2>
                <p>{section.body}</p>
                <ul>
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </section>
          ))}

          <section className="privacy-section" id="rights">
            <div className="privacy-section-icon">
              <FaUserCheck />
            </div>
            <div>
              <h2>Your privacy rights</h2>
              <p>
                Depending on your location and applicable law, you may have
                control over certain personal information we hold about you.
              </p>
              <div className="privacy-rights-grid">
                {rights.map((right) => (
                  <div key={right}>{right}</div>
                ))}
              </div>
            </div>
          </section>

          <section className="privacy-contact" id="contact">
            <div>
              <span className="privacy-contact-icon">
                <FaEnvelope />
              </span>
              <h2>Questions about privacy?</h2>
              <p>
                Contact us for privacy requests, account data questions, or
                concerns about how your information is handled.
              </p>
            </div>
            
            <Link to="/contact">Contact us</Link>
          </section>
        </div>
      </div>
    </main>
  );
};

export default PrivacyPolicy;