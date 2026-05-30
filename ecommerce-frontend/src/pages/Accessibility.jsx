import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Eye,
  Keyboard,
  Mail,
  MonitorSmartphone,
  MousePointer2,
  ShieldCheck,
  Sparkles,
  Volume2,
} from "lucide-react";
import "../styles/accessibility.css";

const navItems = [
  { href: "#commitment", label: "Our Commitment" },
  { href: "#conformance", label: "Conformance Status" },
  { href: "#features", label: "Platform Features" },
  { href: "#technology", label: "Supported Technology" },
  { href: "#feedback", label: "Feedback & Support" },
];

const accessFeatures = [
  {
    icon: Keyboard,
    title: "Keyboard Navigation",
    description:
      "Core flows are designed for keyboard use with visible focus states and predictable tab order.",
  },
  {
    icon: Eye,
    title: "Readable Contrast",
    description:
      "Interface colors are tuned for readability across product pages, forms, dashboards, and checkout.",
  },
  {
    icon: MonitorSmartphone,
    title: "Responsive Scaling",
    description:
      "Layouts support mobile, tablet, desktop, browser zoom, and larger text preferences.",
  },
  {
    icon: Volume2,
    title: "Screen Reader Support",
    description:
      "Semantic structure, labels, landmarks, and ARIA patterns help assistive technology navigate content.",
  },
];

const supportedTechnology = [
  "Recent versions of NVDA, JAWS, VoiceOver, and TalkBack",
  "Browser zoom, operating system magnification, and larger text settings",
  "Speech recognition software and standard keyboard interfaces",
  "Modern browsers including Chrome, Edge, Safari, and Firefox",
];

const Accessibility = () => {
  return (
    <main className="access-page">
      <section className="access-hero" aria-labelledby="access-title">
        <div className="access-hero__content">
          <div className="access-eyebrow">
            <Sparkles size={16} aria-hidden="true" />
            Inclusive commerce
          </div>

          <h1 id="access-title">Accessibility Statement</h1>
          <p>
            SahimonCart is committed to building a shopping experience that is
            usable, understandable, and welcoming for everyone.
          </p>

          <div className="access-hero__meta" aria-label="Accessibility summary">
            <span>
              <BadgeCheck size={17} aria-hidden="true" />
              WCAG 2.1 AA target
            </span>
            <span>
              <ShieldCheck size={17} aria-hidden="true" />
              Reviewed regularly
            </span>
            <span>Last updated: May 6, 2026</span>
          </div>
        </div>

        <aside className="access-hero__panel" aria-label="Accessibility status">
          <div className="access-status-card">
            <span>
              <CheckCircle2 size={18} aria-hidden="true" />
              Active improvement program
            </span>
            <strong>In progress</strong>
          </div>

          <div className="access-metric">
            <span>Target standard</span>
            <strong>WCAG AA</strong>
          </div>

          <div className="access-metric">
            <span>Support response</span>
            <strong>2 days</strong>
          </div>

          <div className="access-panel-note">
            <MousePointer2 size={18} aria-hidden="true" />
            We review accessibility feedback as part of our product quality
            workflow.
          </div>
        </aside>
      </section>

      <section className="access-container">
        <aside className="access-sidebar" aria-label="Accessibility contents">
          <div className="access-sidebar__card">
            <h2>Contents</h2>

            <nav className="access-nav">
              {navItems.map((item, index) => (
                <a href={item.href} key={item.href}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <article className="access-content">
          <section id="commitment" className="access-section">
            <span className="access-section-kicker">01</span>
            <h2>Our Commitment</h2>
            <p>
              At SahimonCart, premium ecommerce should be accessible to every
              customer. We are working to improve the usability of our platform
              for people with disabilities and for anyone using assistive
              technologies, keyboard navigation, zoom controls, or alternative
              input methods.
            </p>
            <p>
              Accessibility is treated as an ongoing product responsibility. As
              we add features, redesign pages, and refine checkout flows, we aim
              to keep clarity, contrast, structure, and interaction quality at
              the center of the experience.
            </p>
          </section>

          <section id="conformance" className="access-section">
            <span className="access-section-kicker">02</span>
            <h2>Conformance Status</h2>
            <p>
              The Web Content Accessibility Guidelines define requirements for
              making digital experiences more accessible. These guidelines
              include Level A, Level AA, and Level AAA success criteria.
            </p>

            <div className="access-status-box">
              <div className="access-status-icon">
                <CheckCircle2 size={22} aria-hidden="true" />
              </div>

              <div>
                <h3>SahimonCart is partially conformant with WCAG 2.1 Level AA.</h3>
                <p>
                  Partially conformant means some areas may not fully meet the
                  standard yet. We are actively identifying, prioritizing, and
                  improving those areas.
                </p>
              </div>
            </div>
          </section>

          <section id="features" className="access-section">
            <span className="access-section-kicker">03</span>
            <h2>Platform Features</h2>
            <p>
              Our team focuses on practical accessibility improvements that make
              shopping, account management, and support easier to use.
            </p>

            <div className="access-feature-grid">
              {accessFeatures.map(({ icon: Icon, title, description }) => (
                <div className="access-feature-card" key={title}>
                  <div className="access-feature-icon">
                    <Icon size={24} aria-hidden="true" />
                  </div>

                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="technology" className="access-section">
            <span className="access-section-kicker">04</span>
            <h2>Supported Assistive Technology</h2>
            <p>
              SahimonCart is designed to work with common assistive technologies
              and modern browser environments.
            </p>

            <ul className="access-check-list">
              {supportedTechnology.map((item) => (
                <li key={item}>
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="access-note">
              <strong>Note:</strong> SahimonCart relies on HTML, CSS,
              JavaScript, and WAI-ARIA to function properly. Third-party
              services, including payment gateways, may maintain their own
              accessibility standards.
            </div>
          </section>

          <section id="feedback" className="access-section">
            <span className="access-section-kicker">05</span>
            <h2>Feedback & Support</h2>

            <div className="access-feedback-card">
              <div className="access-feedback-content">
                <div className="access-feedback-icon">
                  <Mail size={24} aria-hidden="true" />
                </div>

                <div>
                  <h3>Encountered an accessibility barrier?</h3>
                  <p>
                    Tell us what happened, where it happened, and what assistive
                    technology or browser you were using. This helps our team
                    investigate and improve the experience faster.
                  </p>

                  <div className="access-contact-list">
                    <span>
                      <strong>Email:</strong> accessibility@sahimoncart.com
                    </span>
                    <span>
                      <strong>Response time:</strong> Within 2 business days
                    </span>
                  </div>
                </div>
              </div>

              <a
                className="access-report-btn"
                href="mailto:accessibility@sahimoncart.com?subject=Accessibility%20Issue%20Report"
              >
                Report an Issue
                <ArrowRight size={18} aria-hidden="true" />
              </a>
            </div>
          </section>
        </article>
      </section>
    </main>
  );
};

export default Accessibility;
