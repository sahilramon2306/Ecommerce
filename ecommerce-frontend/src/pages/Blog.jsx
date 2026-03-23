import "../styles/blog.css";

const Blog = () => {
  return (
    <div className="blog-page">
      <div className="blog-hero">
        <h1>Journal</h1>
        <p>Stories, insights, and inspiration from the world of SahimonCart</p>
      </div>

      <div className="blog-grid">
        <div className="blog-card">
          <div className="blog-image"></div>
          <div className="blog-info">
            <span className="category">Lifestyle</span>
            <h3>How to Build a Minimalist Wardrobe in 2025</h3>
            <p>Discover timeless pieces that never go out of style.</p>
            <span className="date">March 12, 2025</span>
          </div>
        </div>

        <div className="blog-card">
          <div className="blog-image"></div>
          <div className="blog-info">
            <span className="category">Sustainability</span>
            <h3>Why We Choose Ethical Brands</h3>
            <p>Our commitment to responsible sourcing and conscious consumption.</p>
            <span className="date">March 8, 2025</span>
          </div>
        </div>

        <div className="blog-card">
          <div className="blog-image"></div>
          <div className="blog-info">
            <span className="category">Design</span>
            <h3>The Art of Curating Your Home</h3>
            <p>Expert tips to create a space that reflects your personality.</p>
            <span className="date">March 5, 2025</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blog;