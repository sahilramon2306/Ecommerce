import "../styles/termsofservice.css";

const TermsOfService = () => {
  return (
    <div className="tos-page">
      {/* SaaS Hero Section */}
      <section className="tos-hero">
        <span className="hero-badge">Legal Hub</span>
        <h1>Terms of <span className="text-gradient">Service</span></h1>
        <p>Last updated: April 23, 2026</p>
      </section>

      <div className="tos-container">
        {/* Sticky Sidebar Navigation */}
        <aside className="tos-sidebar">
          <div className="sidebar-sticky">
            <h3>Contents</h3>
            <nav className="tos-nav">
              <a href="#acceptance">1. Acceptance of Terms</a>
              <a href="#use">2. Use of the Service</a>
              <a href="#products">3. Products & Pricing</a>
              <a href="#shipping">4. Shipping & Returns</a>
              <a href="#liability">5. Limitation of Liability</a>
              <a href="#law">6. Governing Law</a>
            </nav>
          </div>
        </aside>

        {/* Main Legal Document */}
        <main className="tos-content">
          <div className="legal-document">
            <section id="acceptance">
              <h2>1. Acceptance of Terms</h2>
              <p>
                By accessing or using SahimonCart, you agree to be bound by these Terms of Service 
                and all applicable laws and regulations. If you disagree with any part of these terms, 
                you may not access the service.
              </p>
            </section>

            <section id="use">
              <h2>2. Use of the Service</h2>
              <p>
                You may use SahimonCart only for lawful purposes and in accordance with these Terms. 
                You agree not to use the service:
              </p>
              <ul>
                <li>For any unauthorized, illegal, or harmful purpose.</li>
                <li>To transmit any advertising or promotional material without our prior written consent.</li>
                <li>To impersonate or attempt to impersonate SahimonCart, a company employee, or another user.</li>
              </ul>
            </section>

            <section id="products">
              <h2>3. Products, Pricing and Availability</h2>
              <p>
                All prices are subject to change without prior notice. We reserve the right to 
                modify, discontinue, or limit the availability of any product at any time. We make 
                every effort to display the colors and images of our products as accurately as possible.
              </p>
            </section>

            <section id="shipping">
              <h2>4. Shipping, Delivery and Returns</h2>
              <p>
                Please refer to our detailed Shipping and Returns policy for information regarding 
                delivery timelines, shipping charges, and return procedures. By agreeing to these Terms, 
                you also agree to our shipping and return policies.
              </p>
            </section>

            <section id="liability">
              <h2>5. Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by law, SahimonCart shall not be liable for any 
                indirect, incidental, special, consequential, or punitive damages arising from 
                your use of our website or services, or for any unauthorized access to or use of 
                our secure servers and/or any personal information stored therein.
              </p>
            </section>

            <section id="law">
              <h2>6. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of India, 
                specifically under the jurisdiction of the courts in West Bengal, without regard to its 
                conflict of law provisions.
              </p>
            </section>

            <div className="document-footer">
              <p>
                By using our website and services, you acknowledge that you have read, understood, 
                and agree to be bound by these Terms of Service.
              </p>
              <button className="print-btn" onClick={() => window.print()}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                Print Document
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TermsOfService;