import { useEffect, useState } from "react";
import {
  getAllProductsAdmin,
  deleteProduct,
  updateProductStatus,
  updateProductStock,
  addProduct,
  updateProduct,
  uploadProductImages,
} from "../../api/adminApi";

import "../../styles/admin-product.css";

const Products = () => {
  /* ================= STATE ================= */

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedProducts, setSelectedProducts] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const initialForm = {
    name: "",
    description: "",
    price: "",
    salePrice: "",
    category: "",
    brand: "",
    stock: "",
  };

  const [formData, setFormData] = useState(initialForm);
  const [images, setImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [errors, setErrors] = useState({});

  // New states for premium modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const [showStockModal, setShowStockModal] = useState(false);
  const [productToUpdateStock, setProductToUpdateStock] = useState(null);
  const [newStock, setNewStock] = useState("");

  /* ================= DEBOUNCE SEARCH ================= */

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setCurrentPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  /* ================= LOAD PRODUCTS ================= */

  const loadProducts = async (page = 1) => {
    try {
      setLoading(true);

      const res = await getAllProductsAdmin({
        page,
        limit: 10,
        search: debouncedSearch,
        sortBy,
        order,
        status: statusFilter,
      });

      setProducts(res.data.data || []);
      setTotalPages(res.data.meta?.totalPages || 1);
      setCurrentPage(page);

    } catch (err) {
      console.error("Load Products Error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* Trigger when filters or search change */
  useEffect(() => {
    loadProducts(1);
  }, [debouncedSearch, sortBy, order, statusFilter]);

  /* Trigger when page changes */
  useEffect(() => {
    loadProducts(currentPage);
  }, [currentPage]);

  /* ================= FORM ================= */

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error on change
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleImageChange = (e) => {
    const files = [...e.target.files];
    setImages(files);
    setPreviewImages(files.map(file => URL.createObjectURL(file)));
    setErrors(prev => ({ ...prev, images: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.price || isNaN(formData.price) || Number(formData.price) <= 0) newErrors.price = 'Valid price is required';
    if (formData.salePrice && (isNaN(formData.salePrice) || Number(formData.salePrice) < 0)) newErrors.salePrice = 'Valid sale price is required';
    if (!formData.category.trim()) newErrors.category = 'Category is required';
    if (!formData.brand.trim()) newErrors.brand = 'Brand is required';
    if (!formData.stock || isNaN(formData.stock) || Number(formData.stock) < 0) newErrors.stock = 'Valid stock quantity is required';
    if (!editingProduct && images.length === 0) newErrors.images = 'At least one image is required for new products';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        salePrice: formData.salePrice ? Number(formData.salePrice) : undefined,
        stock: Number(formData.stock),
      };

      let productId;

      if (editingProduct) {
        const res = await updateProduct(editingProduct._id, payload);
        productId = res.data.data._id;
      } else {
        const res = await addProduct(payload);
        productId = res.data.data._id;
      }

      if (images.length > 0) {
        const form = new FormData();
        images.forEach(img => form.append("images", img));
        await uploadProductImages(productId, form);
      }

      resetForm();
      loadProducts(currentPage);

    } catch (err) {
      console.error("Submit Error:", err.response?.data || err.message);
      setErrors({ submit: 'An error occurred. Please try again.' });
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData(initialForm);
    setImages([]);
    setPreviewImages([]);
    setErrors({});
  };

  /* ================= ACTIONS ================= */

  const openDeleteModal = (productId) => {
    setProductToDelete(productId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (productToDelete) {
      await deleteProduct(productToDelete);
      loadProducts(currentPage);
      setShowDeleteModal(false);
      setProductToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
  };

  const openStockModal = (productId, currentStock) => {
    setProductToUpdateStock(productId);
    setNewStock(currentStock.toString());
    setShowStockModal(true);
  };

  const handleStockChange = (e) => {
    setNewStock(e.target.value);
  };

  const confirmStockUpdate = async () => {
    if (productToUpdateStock && newStock && !isNaN(newStock) && Number(newStock) >= 0) {
      await updateProductStock(productToUpdateStock, {
        stock: Number(newStock),
      });
      loadProducts(currentPage);
      setShowStockModal(false);
      setProductToUpdateStock(null);
      setNewStock("");
    } else {
      alert("Please enter a valid non-negative number for stock.");
    }
  };

  const cancelStockUpdate = () => {
    setShowStockModal(false);
    setProductToUpdateStock(null);
    setNewStock("");
  };

  const handleStatusToggle = async (productId, currentStatus) => {
    await updateProductStatus(productId, {
      isActive: !currentStatus,
    });
    loadProducts(currentPage);
  };

  const toggleSelect = (id) => {
    setSelectedProducts(prev =>
      prev.includes(id)
        ? prev.filter(p => p !== id)
        : [...prev, id]
    );
  };

  const bulkUpdateStatus = async (newStatus) => {
    for (const id of selectedProducts) {
      await updateProductStatus(id, { isActive: newStatus });
    }
    setSelectedProducts([]);
    loadProducts(currentPage);
  };

  /* ================= UI ================= */

  if (loading)
    return <div className="admin-loading">Loading...</div>;

  return (
    <div className="admin-products">
      <h1>Admin Product Management</h1>

      <div className="admin-controls">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="createdAt">Newest</option>
          <option value="price">Price</option>
          <option value="stock">Stock</option>
        </select>

        <select value={order} onChange={(e) => setOrder(e.target.value)}>
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>

        <button onClick={() => setShowModal(true)}>+ Add Product</button>
      </div>

      {selectedProducts.length > 0 && (
        <div className="bulk-actions">
          <button onClick={() => bulkUpdateStatus(true)}>Active Selected</button>
          <button onClick={() => bulkUpdateStatus(false)}>Inactive Selected</button>
        </div>
      )}

      <table className="admin-table">
        <thead>
          <tr>
            <th></th>
            <th>Name</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {products.map(product => (
            <tr key={product._id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedProducts.includes(product._id)}
                  onChange={() => toggleSelect(product._id)}
                />
              </td>

              <td>{product.name}</td>
              <td>₹{product.price}</td>
              <td className={product.stock < 10 ? 'low-stock' : ''}>{product.stock}</td>

              <td
                style={{
                  fontWeight: 600,
                  color: product.isActive ? "#10b981" : "#ef4444",
                }}
              >
                {product.isActive ? "Active" : "Inactive"}
              </td>

              <td>
                <button onClick={() => {
                  setEditingProduct(product);
                  setFormData({
                    name: product.name || "",
                    description: product.description || "",
                    price: product.price || "",
                    salePrice: product.salePrice || "",
                    category: product.category || "",
                    brand: product.brand || "",
                    stock: product.stock || "",
                  });
                  setPreviewImages(product.images || []); // Assuming product.images are URLs
                  setShowModal(true);
                }}>
                  Edit
                </button>

                <button onClick={() =>
                  handleStatusToggle(product._id, product.isActive)
                }>
                  Change Status
                </button>

                <button onClick={() =>
                  openStockModal(product._id, product.stock)
                }>
                  Stock
                </button>

                <button
                  className="delete-btn"
                  onClick={() =>
                    openDeleteModal(product._id)
                  }
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(prev => prev - 1)}
        >
          Prev
        </button>

        <span>{currentPage} / {totalPages}</span>

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(prev => prev + 1)}
        >
          Next
        </button>
      </div>

      {showModal && (
        <div className="admin-modal">
          <form className="admin-form" onSubmit={handleSubmit}>
            <button type="button" className="close-btn" onClick={resetForm}>&times;</button>
            <h3>{editingProduct ? "Edit Product" : "Add Product"}</h3>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name">Product Name</label>
                <input id="name" name="name" value={formData.name} onChange={handleChange} required />
                {errors.name && <div className="error">{errors.name}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <input id="category" name="category" value={formData.category} onChange={handleChange} required />
                {errors.category && <div className="error">{errors.category}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="brand">Brand</label>
                <input id="brand" name="brand" value={formData.brand} onChange={handleChange} required />
                {errors.brand && <div className="error">{errors.brand}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="price">Price (₹)</label>
                <input id="price" type="number" name="price" value={formData.price} onChange={handleChange} required min="0" step="0.01" />
                {errors.price && <div className="error">{errors.price}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="salePrice">Sale Price</label>
                <input id="salePrice" type="number" name="salePrice" value={formData.salePrice} onChange={handleChange} min="0" step="0.01" />
                {errors.salePrice && <div className="error">{errors.salePrice}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="stock">Stock Quantity</label>
                <input id="stock" type="number" name="stock" value={formData.stock} onChange={handleChange} required min="0" />
                {errors.stock && <div className="error">{errors.stock}</div>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows="4" required />
              {errors.description && <div className="error">{errors.description}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="images">Product Images {editingProduct ? '(optional)' : '(required)'}</label>
              <input id="images" className="file-input" type="file" multiple onChange={handleImageChange} accept="image/*" />
              {errors.images && <div className="error">{errors.images}</div>}
            </div>

            {previewImages.length > 0 && (
              <div className="image-preview">
                {previewImages.map((img, i) => (
                  <img key={i} src={img} alt={`preview ${i + 1}`} />
                ))}
              </div>
            )}

            {errors.submit && <div className="error" style={{ textAlign: 'center', marginBottom: '20px' }}>{errors.submit}</div>}

            <div className="modal-actions">
              <button type="button" onClick={resetForm}>Cancel</button>
              <button type="submit">Save</button>
            </div>
          </form>
        </div>
      )}

      {showDeleteModal && (
        <div className="admin-modal">
          <div className="confirm-modal">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete this product permanently?</p>
            <div className="modal-actions">
              <button className="cancel" onClick={cancelDelete}>Cancel</button>
              <button className="danger confirm" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {showStockModal && (
        <div className="admin-modal">
          <div className="stock-modal">
            <h3>Update Stock</h3>
            <input
              type="number"
              placeholder="Enter new stock quantity"
              value={newStock}
              onChange={handleStockChange}
              min="0"
              required
            />
            <div className="modal-actions">
              <button className="cancel" onClick={cancelStockUpdate}>Cancel</button>
              <button className="confirm" onClick={confirmStockUpdate}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;