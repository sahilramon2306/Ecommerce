import { useEffect, useState } from "react";
import {
  getAllProductsAdmin,
  deleteProduct,
  updateProductStatus,
} from "../../api/adminApi";
import "../../styles/admin-product.css";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = async () => {
    try {
      const res = await getAllProductsAdmin();
      setProducts(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load products", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await deleteProduct(id);
      loadProducts();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    try {
      await updateProductStatus(id, {
        status: currentStatus === "active" ? "inactive" : "active",
      });
      loadProducts();
    } catch (err) {
      console.error("Status update failed", err);
    }
  };

  if (loading) return <div className="admin-loading">Loading products...</div>;

  return (
    <div className="admin-products">
      <h1>Product Management</h1>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {products.map((product) => (
              <tr key={product._id}>
                <td>{product.name}</td>
                <td>₹{product.price}</td>
                <td>{product.stock}</td>
                <td>
                  <span
                    className={`status-badge ${
                      product.status === "active"
                        ? "active"
                        : "inactive"
                    }`}
                  >
                    {product.status}
                  </span>
                </td>
                <td className="actions">
                  <button
                    className="status-btn"
                    onClick={() =>
                      handleStatusToggle(product._id, product.status)
                    }
                  >
                    Toggle
                  </button>

                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(product._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!products.length && (
          <div className="empty-state">
            No products found.
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;