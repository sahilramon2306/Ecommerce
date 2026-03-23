import { useEffect, useState } from "react";
import { getProductReviews } from "../api/reviewApi";
import "../styles/reviews-list.css";

const ReviewsList = ({ productId, refresh }) => {

  const [reviews, setReviews] = useState([]);

  useEffect(() => {

    const fetchReviews = async () => {

      try {

        const res = await getProductReviews(productId);

        setReviews(res.data.data);

      } catch (err) {

        console.error("Review fetch error", err);

      }

    };

    fetchReviews();

  }, [productId, refresh]);

  return (

    <div className="reviews-list">

      {reviews.length === 0 && <p>No reviews yet</p>}

      {reviews.map((review) => (

        <div key={review._id} className="review-card">

          <h4>{review.userId?.name}</h4>

          <p>⭐ {review.rating} / 5</p>

          <p>{review.review}</p>

        </div>

      ))}

    </div>

  );
};

export default ReviewsList;