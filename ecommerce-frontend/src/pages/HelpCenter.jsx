import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeHelp,
  Banknote,
  BookOpenText,
  Building2,
  Clock3,
  FileText,
  Headphones,
  LockKeyhole,
  PackageCheck,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import "../styles/help-center.css";

const supportTopics = [
  {
    title: "Track Orders",
    description: "Live shipment updates, delivery windows, and courier handoff details.",
    icon: PackageCheck,
    meta: "Most used",
  },
  {
    title: "Payments & Refunds",
    description: "Cards, UPI, wallet payments, invoices, failed payments, and refund status.",
    icon: Banknote,
    meta: "2-5 day refunds",
  },
  {
    title: "Returns & Exchanges",
    description: "Start a return, exchange sizes, review pickup slots, and policy timelines.",
    icon: RotateCcw,
    meta: "7-day window",
  },
  {
    title: "Account & Security",
    description: "Profile settings, password changes, addresses, alerts, and login protection.",
    icon: LockKeyhole,
    meta: "Secure",
  },
  {
    title: "Product Guides",
    description: "Sizing notes, material care, authenticity checks, and product fit guidance.",
    icon: BookOpenText,
    meta: "Expert tips",
  },
  {
    title: "Partner with Us",
    description: "Vendor onboarding, corporate gifting, bulk orders, and marketplace queries.",
    icon: Building2,
    meta: "Business",
  },
];

const popularArticles = [
  "How do I initiate a return or exchange?",
  "What payment methods does SahimonCart accept?",
  "Why is my order delayed?",
  "How do I update my shipping address?",
];

const quickStats = [
  { label: "Avg. first response", value: "< 8 min" },
  { label: "Self-serve articles", value: "120+" },
  { label: "Support coverage", value: "7 days" },
];

const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTopics = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return supportTopics;
    }

    return supportTopics.filter(({ title, description, meta }) =>
      `${title} ${description} ${meta}`.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
  };

  return (
    <main className="help-page">
      <section className="help-hero" aria-labelledby="help-title">
        <div className="help-hero__content">
          <div className="help-eyebrow">
            <Sparkles size={16} aria-hidden="true" />
            Premium customer support
          </div>

          <h1 id="help-title">SahimonCart Support</h1>
          <p>
            Find trusted answers for orders, payments, returns, account safety,
            and product care without waiting in a queue.
          </p>

          <form className="search-form" onSubmit={handleSearch}>
            <label className="search-input-wrapper" htmlFor="help-search">
              <Search className="search-icon" size={22} aria-hidden="true" />
              <input
                id="help-search"
                type="search"
                placeholder="Search orders, refunds, delivery, returns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
              />
            </label>
          </form>

          <div className="hero-actions" aria-label="Quick support actions">
            <a href="#popular-articles">
              <FileText size={18} aria-hidden="true" />
              View articles
            </a>
            <a href="#contact-support">
              <Headphones size={18} aria-hidden="true" />
              Contact team
            </a>
          </div>
        </div>

        <aside className="help-hero__panel" aria-label="Support status">
          <div className="status-card">
            <div>
              <span className="status-dot" />
              Support is online
            </div>
            <strong>Today</strong>
          </div>

          <div className="support-metric-grid">
            {quickStats.map((stat) => (
              <div className="support-metric" key={stat.label}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>

          <div className="trust-strip">
            <ShieldCheck size={18} aria-hidden="true" />
            Account-safe guidance from verified support specialists.
          </div>
        </aside>
      </section>

      <section className="help-container" aria-labelledby="topic-title">
        <div className="section-header">
          <div>
            <span className="section-kicker">Knowledge base</span>
            <h2 id="topic-title">Browse by Topic</h2>
          </div>
          <p>
            {filteredTopics.length} topic
            {filteredTopics.length === 1 ? "" : "s"} available
          </p>
        </div>

        <div className="help-grid">
          {filteredTopics.map(({ title, description, icon: Icon, meta }) => (
            <article className="help-card" key={title}>
              <div className="help-card__topline">
                <span className="icon-box">
                  <Icon size={24} aria-hidden="true" />
                </span>
                <span>{meta}</span>
              </div>

              <h3>{title}</h3>
              <p>{description}</p>

              <a href="#popular-articles" aria-label={`Open ${title} articles`}>
                Explore
                <ArrowRight size={17} aria-hidden="true" />
              </a>
            </article>
          ))}
        </div>

        <div className="help-content-grid">
          <section
            className="popular-articles"
            id="popular-articles"
            aria-labelledby="popular-title"
          >
            <div className="section-header section-header--compact">
              <div>
                <span className="section-kicker">Recommended</span>
                <h2 id="popular-title">Popular Articles</h2>
              </div>
            </div>

            <div className="articles-list">
              {popularArticles.map((article) => (
                <a href="#" className="article-link" key={article}>
                  <FileText size={20} aria-hidden="true" />
                  <span>{article}</span>
                  <ArrowRight
                    className="article-arrow"
                    size={18}
                    aria-hidden="true"
                  />
                </a>
              ))}
            </div>
          </section>

          <section
            className="support-cta"
            id="contact-support"
            aria-labelledby="cta-title"
          >
            <div className="cta-icon">
              <BadgeHelp size={24} aria-hidden="true" />
            </div>

            <h2 id="cta-title">Still need help?</h2>
            <p>Share your order ID and our team will help with the next best step.</p>

            <div className="cta-meta">
              <span>
                <Clock3 size={16} aria-hidden="true" />
                8 min avg.
              </span>
              <span>
                <Truck size={16} aria-hidden="true" />
                Order-ready
              </span>
            </div>

            <button className="contact-btn" type="button">
              <Headphones size={18} aria-hidden="true" />
              Contact Support
            </button>
          </section>
        </div>
      </section>
    </main>
  );
};

export default HelpCenter;
