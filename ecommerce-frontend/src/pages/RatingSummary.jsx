import { useEffect, useState } from "react";
import { getRatingSummary } from "../api/reviewApi";
import "../styles/rating-summary.css";

const RatingSummary = ({ productId, refresh }) => {

  const [summary, setSummary] = useState({
    averageRating: 0,
    ratingCount: 0
  });

  useEffect(() => {

    const fetchSummary = async () => {

      try {

        const res = await getRatingSummary(productId);

        setSummary(res.data.data);

      } catch (err) {

        console.error("Rating summary error", err);

      }

    };

    fetchSummary();

  }, [productId, refresh]);

  return (

    <div className="rating-summary">

      <div className="avg-rating">

        <h3>{summary.averageRating}</h3>
        <p>Average Rating</p>

      </div>

      <div className="rating-count">

        <p>{summary.ratingCount} Reviews</p>

      </div>

    </div>

  );
};

export default RatingSummary;