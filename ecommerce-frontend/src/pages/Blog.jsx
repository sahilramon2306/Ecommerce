import "../styles/blog.css";

const Blog = () => {
  return (
    <div className="blog-page">
      {/* SaaS Style Header */}
      <header className="blog-hero">
        <span className="blog-badge">Our Journal</span>
        <h1>Insights on <span className="text-gradient">Premium Living</span></h1>
        <p>Curated stories, design inspiration, and the philosophy behind SahimonCart.</p>
      </header>

      <div className="blog-container">
        {/* Featured Post - Large Horizontal Layout */}
        <section className="featured-post">
          <div className="featured-image-box">
             {/* Use 'Copy Relative Path' for your actual image */}
             <div className="placeholder-img main-img"></div>
          </div>
          <div className="featured-content">
            <span className="category-pill">Editor's Choice</span>
            <h2>The Evolution of Modern Indian Aesthetics in 2026</h2>
            <p>Exploring how traditional craftsmanship meets 21st-century minimalism to create spaces that breathe.</p>
            <div className="post-meta">
              <span className="author">By Sahil Reza</span>
              <span className="dot"></span>
              <span className="read-time">6 min read</span>
            </div>
          </div>
        </section>

        {/* Blog Grid */}
        <div className="blog-grid">
          <div className="blog-card">
            <div className="blog-image">
               <div className="placeholder-img"></div>
            </div>
            <div className="blog-info">
              <span className="category">Lifestyle</span>
              <h3>How to Build a Minimalist Wardrobe in 2026</h3>
              <p>Discover timeless pieces that never go out of style and reduce clutter.</p>
              <div className="card-footer">
                <span className="date">April 12, 2026</span>
                <button className="read-more">Read →</button>
              </div>
            </div>
          </div>

          <div className="blog-card">
            <div className="blog-image">
               <div className="placeholder-img"></div>
            </div>
            <div className="blog-info">
              <span className="category">Sustainability</span>
              <h3>Why We Choose Ethical Brands</h3>
              <p>Our commitment to responsible sourcing and conscious consumption for a better planet.</p>
              <div className="card-footer">
                <span className="date">April 08, 2026</span>
                <button className="read-more">Read →</button>
              </div>
            </div>
          </div>

          <div className="blog-card">
            <div className="blog-image">
               <div className="placeholder-img"></div>
            </div>
            <div className="blog-info">
              <span className="category">Design</span>
              <h3>The Art of Curating Your Home</h3>
              <p>Expert tips to create a space that reflects your personality through curated items.</p>
              <div className="card-footer">
                <span className="date">April 05, 2026</span>
                <button className="read-more">Read →</button>
              </div>
            </div>
          </div>
        </div>

        {/* SaaS Newsletter Section */}
        <section className="newsletter-cta">
          <div className="newsletter-box">
            <h3>Never miss a story</h3>
            <p>Join 5,000+ others receiving our weekly journal on premium lifestyle.</p>
            <div className="input-group">
              <input type="email" placeholder="Enter your email" />
              <button className="subscribe-btn">Subscribe</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Blog;