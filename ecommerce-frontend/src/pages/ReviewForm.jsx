import { useState } from "react";
import { addReview } from "../api/reviewApi";
import { toast } from "react-hot-toast";
import "../styles/review-form.css";

const ReviewForm = ({ productId, onReviewAdded }) => {

  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!localStorage.getItem("token")) {
      toast.error("Please login to add a review");
      return;
    }

    if (review.trim().length === 0) {
      toast.error("Please write a review");
      return;
    }

    try {

      setLoading(true);

      await addReview(productId, {
        rating,
        review
      });

      toast.success("Review added successfully");

      setReview("");
      setRating(5);

      if (onReviewAdded) {
        onReviewAdded();
      }

    } catch (err) {

      toast.error(
        err.response?.data?.message || "Failed to submit review"
      );

    } finally {

      setLoading(false);

    }

  };

  return (

    <form className="review-form" onSubmit={handleSubmit}>

      <h3>Write a Review</h3>

      {/* Rating */}

      <div className="rating-select">

        <label>Rating</label>

        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
        >

          <option value={5}>⭐⭐⭐⭐⭐ (5)</option>
          <option value={4}>⭐⭐⭐⭐ (4)</option>
          <option value={3}>⭐⭐⭐ (3)</option>
          <option value={2}>⭐⭐ (2)</option>
          <option value={1}>⭐ (1)</option>

        </select>

      </div>

      {/* Review */}

      <textarea
        placeholder="Write your review about this product..."
        value={review}
        onChange={(e) => setReview(e.target.value)}
      />

      {/* Submit */}

      <button type="submit" disabled={loading}>

        {loading ? "Submitting..." : "Submit Review"}

      </button>

    </form>

  );
};

export default ReviewForm;