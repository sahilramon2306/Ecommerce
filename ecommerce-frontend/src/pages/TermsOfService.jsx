import "../styles/termsofservice.css";

const TermsOfService = () => {
  return (
    <div className="termsofservice-page">
      <div className="terms-hero">
        <h1>Terms of Service</h1>
        <p>Last updated: March 18, 2026</p>
      </div>

      <div className="terms-content">
        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using SahimonCart, you agree to be bound by these Terms of Service 
            and all applicable laws and regulations.
          </p>
        </section>

        <section>
          <h2>2. Use of the Service</h2>
          <p>
            You may use SahimonCart only for lawful purposes and in accordance with these Terms. 
            You agree not to use the service for any unauthorized, illegal, or harmful purpose.
          </p>
        </section>

        <section>
          <h2>3. Products, Pricing and Availability</h2>
          <p>
            All prices are subject to change without prior notice. We reserve the right to 
            modify, discontinue, or limit the availability of any product at any time.
          </p>
        </section>

        <section>
          <h2>4. Shipping, Delivery and Returns</h2>
          <p>
            Please refer to our detailed Shipping and Returns policy for information regarding 
            delivery timelines, shipping charges, and return procedures.
          </p>
        </section>

        <section>
          <h2>5. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, SahimonCart shall not be liable for any 
            indirect, incidental, special, consequential, or punitive damages arising from 
            your use of our website or services.
          </p>
        </section>

        <section>
          <h2>6. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of India.
          </p>
        </section>

        <p className="last-updated">
          By using our website and services, you acknowledge that you have read, understood, 
          and agree to be bound by these Terms of Service.
        </p>
      </div>
    </div>
  );
};

export default TermsOfService;