import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Headphones,
  PackageCheck,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
  WalletCards,
  X,
} from "lucide-react";
import "../styles/faq.css";

const faqData = [
  {
    id: 1,
    category: "Orders",
    icon: PackageCheck,
    question: "How do I track my order?",
    answer:
      "You can track your order from the Track Order page using your Order ID. Once shipped, you will see live courier updates, estimated delivery time, and the latest package status.",
  },
  {
    id: 2,
    category: "Returns",
    icon: RefreshCcw,
    question: "What is your return and exchange policy?",
    answer:
      "We offer a 7-day return and exchange window for eligible products. Items should be unused, in original packaging, and include all tags or accessories. Refunds are usually processed within 5-7 business days after quality verification.",
  },
  {
    id: 3,
    category: "Payments",
    icon: WalletCards,
    question: "Do you offer Cash on Delivery?",
    answer:
      "Yes, Cash on Delivery is available for most serviceable pin codes across India. You can select COD during checkout if it is available for your delivery address.",
  },
  {
    id: 4,
    category: "Shipping",
    icon: Truck,
    question: "How long does shipping take?",
    answer:
      "Standard delivery usually takes 3-5 business days. Express delivery may be available at checkout for selected locations and can deliver eligible orders within 1-2 business days.",
  },
  {
    id: 5,
    category: "Orders",
    icon: Clock3,
    question: "Can I modify my order after placing it?",
    answer:
      "Orders can be modified or cancelled within 2 hours of placement, as long as they have not been packed or shipped. For urgent changes, contact support with your Order ID.",
  },
  {
    id: 6,
    category: "Security",
    icon: ShieldCheck,
    question: "Is my payment information secure?",
    answer:
      "Yes. SahimonCart uses secure payment partners and encrypted checkout flows. We do not store sensitive card details on our servers.",
  },
];

const categories = ["All", "Orders", "Shipping", "Returns", "Payments", "Security"];

const FAQ = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeId, setActiveId] = useState(faqData[0].id);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredFaqs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return faqData.filter((faq) => {
      const matchesCategory =
        selectedCategory === "All" || faq.category === selectedCategory;

      const matchesSearch =
        !query ||
        `${faq.question} ${faq.answer} ${faq.category}`
          .toLowerCase()
          .includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <main className="faq-page">
      <section className="faq-hero" aria-labelledby="faq-title">
        <div className="faq-hero__content">
          <div className="faq-eyebrow">
            <Sparkles size={16} aria-hidden="true" />
            Help Center
          </div>

          <h1 id="faq-title">Frequently Asked Questions</h1>
          <p>
            Quick, clear answers for orders, delivery, payments, returns, and
            account safety at SahimonCart.
          </p>

          <form className="faq-search-form" onSubmit={(e) => e.preventDefault()}>
            <Search className="faq-search-icon" size={22} aria-hidden="true" />

            <input
              type="search"
              placeholder="Search returns, delivery, COD, refunds..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search frequently asked questions"
            />

            {searchQuery && (
              <button
                className="faq-clear-btn"
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
              >
                <X size={18} aria-hidden="true" />
              </button>
            )}
          </form>
        </div>

        <aside className="faq-hero__panel" aria-label="Support highlights">
          <div className="faq-status-card">
            <span>
              <CheckCircle2 size={18} aria-hidden="true" />
              Support online
            </span>
            <strong>Today</strong>
          </div>

          <div className="faq-metric">
            <span>Average response</span>
            <strong>&lt; 8 min</strong>
          </div>

          <div className="faq-metric">
            <span>Return window</span>
            <strong>7 days</strong>
          </div>

          <div className="faq-panel-note">
            <ShieldCheck size={18} aria-hidden="true" />
            Secure support for order, payment, and account questions.
          </div>
        </aside>
      </section>

      <section className="faq-container" aria-label="FAQ content">
        <div className="faq-toolbar">
          <div>
            <span className="faq-section-kicker">Knowledge base</span>
            <h2>Browse answers</h2>
          </div>

          <p>
            {filteredFaqs.length} answer
            {filteredFaqs.length === 1 ? "" : "s"} found
          </p>
        </div>

        <div className="faq-category-tabs" aria-label="FAQ categories">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={selectedCategory === category ? "active" : ""}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="faq-layout">
          <div className="faq-list">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq) => {
                const Icon = faq.icon;
                const isOpen = activeId === faq.id;

                return (
                  <article className={`faq-item ${isOpen ? "active" : ""}`} key={faq.id}>
                    <button
                      className="faq-question"
                      type="button"
                      onClick={() => setActiveId(isOpen ? null : faq.id)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-answer-${faq.id}`}
                    >
                      <span className="faq-question-icon">
                        <Icon size={21} aria-hidden="true" />
                      </span>

                      <span className="faq-question-text">
                        <span>{faq.category}</span>
                        <strong>{faq.question}</strong>
                      </span>

                      <ChevronDown className="faq-toggle-icon" size={22} aria-hidden="true" />
                    </button>

                    <div className="faq-answer" id={`faq-answer-${faq.id}`}>
                      <div className="faq-answer-inner">
                        <p>{faq.answer}</p>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="faq-empty-state">
                <Search size={26} aria-hidden="true" />
                <h3>No matching answers</h3>
                <p>Try searching for order, refund, delivery, COD, or return.</p>
              </div>
            )}
          </div>

          <aside className="faq-contact-card" aria-labelledby="faq-contact-title">
            <div className="faq-contact-icon">
              <Headphones size={24} aria-hidden="true" />
            </div>

            <h2 id="faq-contact-title">Still need help?</h2>
            <p>
              Send your Order ID and our support team will guide you through the
              next best step.
            </p>

            <button className="faq-support-btn" type="button">
              Contact Support
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </aside>
        </div>
      </section>
    </main>
  );
};

export default FAQ;
