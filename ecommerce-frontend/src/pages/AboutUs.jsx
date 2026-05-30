// src/pages/AboutUs.jsx

import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/about.css";

const AboutUs = () => {
  const [stats, setStats] = useState({
    customers: 0,
    products: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const formatCount = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M+";
    }

    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K+";
    }

    return num + "+";
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(
        "/api/public-site-stats"
      );

      if (res.data.success) {
        setStats({
          customers:
            res.data.customers || 0,

          products:
            res.data.products || 0
        });
      }

    } catch (error) {
      console.log(
        "Stats Error:",
        error
      );
    }
  };

  return (
    <div className="about-page">

      {/* Hero Section */}
      <section className="about-hero">

        <div className="hero-content">

          <span className="badge">
            About SahimonCart
          </span>

          <h1>
            Elevating lifestyle through{" "}
            <span className="text-gradient">
              curated excellence
            </span>
          </h1>

          <p>
            We're on a mission to redefine
            premium living by bringing
            world-class craftsmanship to
            your doorstep.
          </p>

        </div>

      </section>

      {/* Stats Bar */}
      <div className="stats-bar">

        <div className="stat-item">
          <span>2023</span>
          <p>Founded</p>
        </div>

        <div className="stat-item">
          <span>
            {formatCount(
              stats.customers
            )}
          </span>
          <p>Customers</p>
        </div>

        <div className="stat-item">
          <span>
            {formatCount(
              stats.products
            )}
          </span>
          <p>Premium Products</p>
        </div>

        <div className="stat-item">
          <span>4.9/5</span>
          <p>Rating</p>
        </div>

      </div>

      <div className="about-container">

        {/* Founder Section */}
        <section className="founder-spotlight">

          <div className="founder-grid">

            <div className="founder-visual">

              <div className="image-wrapper">

                <img
                  src="/founder_picture.png"
                  alt="Sahil Reza"
                  className="founder-img"
                />

                <div className="experience-tag">
                  Since 2023
                </div>

              </div>

            </div>

            <div className="founder-details">

              <span className="sub-title">
                Founder's Vision
              </span>

              <h2>
                Driven by Passion &
                Quality
              </h2>

              <p>
                "I founded SahimonCart
                with a singular goal:
                to bridge the gap between
                luxury and everyday
                essentials. What started
                small has become a trusted
                destination for premium
                lifestyle products."
              </p>

              <div className="founder-signature">
                <h4>Sahil Reza</h4>
                <p>Founder & CEO</p>
              </div>

            </div>

          </div>

        </section>

        {/* Mission Section */}
        <section className="mission-section">

          <div className="mission-card">

            <div className="mission-text">

              <h2>Our Mission</h2>

              <p>
                To deliver exceptional
                products with
                transparency,
                sustainability, and an
                unmatched customer
                experience. Every product
                should reflect style,
                quality, and trust.
              </p>

            </div>

          </div>

        </section>

        {/* Values Section */}
        <section className="values-section">

          <div className="section-header">

            <h2>
              The Values That Drive Us
            </h2>

            <p>
              Our commitment to
              excellence is built on
              these four pillars.
            </p>

          </div>

          <div className="values-grid">

            <div className="value-card">
              <div className="icon-box">
                💎
              </div>
              <h3>Quality First</h3>
              <p>
                Only the finest materials
                and craftsmanship make it
                to our store.
              </p>
            </div>

            <div className="value-card">
              <div className="icon-box">
                🤝
              </div>
              <h3>
                Customer Obsessed
              </h3>
              <p>
                Your satisfaction is our
                top priority. Always.
              </p>
            </div>

            <div className="value-card">
              <div className="icon-box">
                🔍
              </div>
              <h3>Transparency</h3>
              <p>
                Honest pricing, clear
                policies, and ethical
                sourcing.
              </p>
            </div>

            <div className="value-card">
              <div className="icon-box">
                🌍
              </div>
              <h3>Sustainability</h3>
              <p>
                Supporting brands that
                care about our planet.
              </p>
            </div>

          </div>

        </section>

      </div>

    </div>
  );
};

export default AboutUs;