import { useEffect, useState, useMemo } from "react";
import { moderateReview } from "../../api/reviewApi";
import axiosInstance from "../../api/axiosInstance";
import { toast } from "react-hot-toast";

import "../../styles/admin-reviews.css";

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchReviews = async () => {
    try {
      const res = await axiosInstance.get("/get-All-Reviews-Admin");
      setReviews(res.data.data);
    } catch (error) {
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleModerate = async (reviewId, status) => {
    try {
      await moderateReview(reviewId, status);
      toast.success("Review status updated");
      fetchReviews();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update"
      );
    }
  };

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const matchesSearch = 
        review.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.productId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.review?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || review.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [reviews, searchTerm, statusFilter]);

  const paginatedReviews = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredReviews.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredReviews, currentPage]);

  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <span
        key={index}
        className={`star ${index < rating ? "full" : "empty"}`}
      >
        ★
      </span>
    ));
  };

  if (loading) {
    return <div className="admin-loading">Loading reviews...</div>;
  }

  return (
    <div className="admin-reviews-container">
      <h1>Admin Customer Reviews Management</h1>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="left-filters">
          <div className="search-input">
            <input
              type="text"
              placeholder="Search by user, product, or review..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="status-filter">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>
        </div>
        <div className="results-info">
          Showing {filteredReviews.length} of {reviews.length} reviews
        </div>
      </div>

      <div className="reviews-table">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Product</th>
              <th>Rating</th>
              <th>Review</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedReviews.length > 0 ? (
              paginatedReviews.map((review) => (
                <tr key={review._id}>
                  <td>{review.userId?.name}</td>
                  <td>{review.productId?.name}</td>
                  <td className="rating-cell">
                    <div className="stars-container">
                      {renderStars(review.rating)}
                    </div>
                  </td>
                  <td className="review-cell">{review.review}</td>
                  <td>
                    <span className={`status ${review.status}`}>
                      {review.status}
                    </span>
                  </td>
                  <td>
                    <select
                      className="moderation-toggle"
                      value={review.status}
                      onChange={(e) => handleModerate(review._id, e.target.value)}
                    >
                      <option value="active">Active</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="no-results">
                  No reviews found matching the criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="page-btn"
          >
            Previous
          </button>
          <div className="page-numbers">
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => handlePageChange(index + 1)}
                className={`page-btn ${currentPage === index + 1 ? "active" : ""}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="page-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Reviews;