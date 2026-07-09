import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Loader2,
  PackageSearch,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  getAllProductsAdmin,
  deleteProduct,
  updateProductStatus,
  updateProductStock,
  addProduct,
  updateProduct,
  uploadProductImages,
  getAllCategoriesAdmin,
  generateProductContentAdmin,
} from "../../api/adminApi";
import "../../styles/admin-product.css";

const PAGE_LIMIT = 10;

const initialForm = {
  name: "",
  description: "",
  price: "",
  salePrice: "",
  category: "",
  subCategory: "",
  childCategory: "",
  brand: "",
  stock: "",
};

const formatPrice = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const normalizeArray = (value) => (Array.isArray(value) ? value : []);

const getParentId = (category) => {
  if (!category?.parent) return "";
  return typeof category.parent === "object" ? category.parent._id : category.parent;
};

const isActiveCategory = (category) =>
  category?.status === true ||
  category?.isActive === true ||
  category?.status === "active" ||
  category?.isActive === undefined;

const getProductStatus = (product) => {
  if (typeof product?.isActive === "boolean") return product.isActive;
  if (typeof product?.status === "boolean") return product.status;
  if (typeof product?.status === "string") return product.status.toLowerCase() === "active";
  return true;
};

const getStockTone = (stock) => {
  const count = Number(stock);
  if (!Number.isFinite(count) || count <= 0) return "danger";
  if (count < 10) return "warning";
  return "success";
};

const getInitials = (value = "") => {
  const words = String(value).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "PR";

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedProducts, setSelectedProducts] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [allCategories, setAllCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [childCategories, setChildCategories] = useState([]);

  const [searchCategory, setSearchCategory] = useState("");
  const [searchSubCategory, setSearchSubCategory] = useState("");
  const [searchChildCategory, setSearchChildCategory] = useState("");

  const [formData, setFormData] = useState(initialForm);
  const [aiFeatures, setAiFeatures] = useState("");
  const [aiContent, setAiContent] = useState(null);
  const [images, setImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [errors, setErrors] = useState({});

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const [showStockModal, setShowStockModal] = useState(false);
  const [productToUpdateStock, setProductToUpdateStock] = useState(null);
  const [newStock, setNewStock] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setCurrentPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    return () => {
      previewImages.forEach((src) => {
        if (src.startsWith("blob:")) URL.revokeObjectURL(src);
      });
    };
  }, [previewImages]);

  const mainCategories = useMemo(
    () => allCategories.filter((category) => !getParentId(category)),
    [allCategories]
  );

  const filteredMainCategories = useMemo(
    () =>
      mainCategories.filter((category) =>
        category.name?.toLowerCase().includes(searchCategory.toLowerCase())
      ),
    [mainCategories, searchCategory]
  );

  const filteredSubCategories = useMemo(
    () =>
      subCategories.filter((category) =>
        category.name?.toLowerCase().includes(searchSubCategory.toLowerCase())
      ),
    [subCategories, searchSubCategory]
  );

  const filteredChildCategories = useMemo(
    () =>
      childCategories.filter((category) =>
        category.name?.toLowerCase().includes(searchChildCategory.toLowerCase())
      ),
    [childCategories, searchChildCategory]
  );

  const stats = useMemo(() => {
    const active = products.filter(getProductStatus).length;
    const lowStock = products.filter((product) => Number(product.stock) < 10).length;

    return {
      visible: products.length,
      active,
      lowStock,
      selected: selectedProducts.length,
    };
  }, [products, selectedProducts.length]);

  const fetchCategories = async () => {
    try {
      const res = await getAllCategoriesAdmin({ all: "true" });
      const data = normalizeArray(res.data?.data || res.data);
      setAllCategories(data.filter(isActiveCategory));
    } catch (err) {
      console.error("Category fetch error:", err);
      setAllCategories([]);
    }
  };

  const loadProducts = async (page = currentPage, { quiet = false } = {}) => {
    try {
      if (quiet) setTableLoading(true);
      else setLoading(true);

      setErrorMessage("");

      const res = await getAllProductsAdmin({
        page,
        limit: PAGE_LIMIT,
        search: debouncedSearch,
        sortBy,
        order,
        status: statusFilter,
      });

      setProducts(normalizeArray(res.data?.data));
      setTotalPages(res.data?.meta?.totalPages || 1);
      setTotalProducts(res.data?.meta?.totalProducts || res.data?.meta?.total || 0);
      setSelectedProducts([]);
    } catch (err) {
      console.error("Load Products Error:", err);
      setProducts([]);
      setErrorMessage("Failed to load products.");
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    loadProducts(currentPage, { quiet: !loading });
  }, [currentPage, debouncedSearch, sortBy, order, statusFilter]);

  const getCategoryNameById = (id) => {
    return allCategories.find((category) => String(category._id) === String(id))?.name || "";
  };

  const handleGenerateProductContent = async () => {
    if (!formData.name.trim() || !formData.brand.trim()) {
      toast.error("Enter product name and brand first");
      return;
    }

    try {
      setActionLoading("ai-content");

      const res = await generateProductContentAdmin({
        name: formData.name,
        brand: formData.brand,
        price: formData.price,
        salePrice: formData.salePrice,
        categoryName: getCategoryNameById(formData.category),
        subCategoryName: getCategoryNameById(formData.subCategory),
        childCategoryName: getCategoryNameById(formData.childCategory),
        features: aiFeatures,
      });

      const data = res.data?.data;

      if (res.data.success && data) {
        setAiContent(data);

        setFormData((current) => ({
          ...current,
          description: data.description || current.description,
        }));

        toast.success("AI content generated");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "AI generation failed");
    } finally {
      setActionLoading("");
    }
  };

  const syncCategoryOptions = (categoryId, subCategoryId = "") => {
    const subs = allCategories.filter((category) => String(getParentId(category)) === String(categoryId));
    setSubCategories(subs);

    const children = allCategories.filter((category) => String(getParentId(category)) === String(subCategoryId));
    setChildCategories(children);
  };

  const handleCategoryChange = (event) => {
    const id = event.target.value;

    setFormData((current) => ({
      ...current,
      category: id,
      subCategory: "",
      childCategory: "",
    }));

    syncCategoryOptions(id);
    setSearchSubCategory("");
    setSearchChildCategory("");
  };

  const handleSubCategoryChange = (event) => {
    const id = event.target.value;

    setFormData((current) => ({
      ...current,
      subCategory: id,
      childCategory: "",
    }));

    const children = allCategories.filter((category) => String(getParentId(category)) === String(id));
    setChildCategories(children);
    setSearchChildCategory("");
  };

  const handleChildCategoryChange = (event) => {
    setFormData((current) => ({ ...current, childCategory: event.target.value }));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "", submit: "" }));
  };

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files || []);

    previewImages.forEach((src) => {
      if (src.startsWith("blob:")) URL.revokeObjectURL(src);
    });

    setImages(files);
    setPreviewImages(files.map((file) => URL.createObjectURL(file)));
    setErrors((current) => ({ ...current, images: "" }));
  };

  const validateForm = () => {
    const nextErrors = {};
    const price = Number(formData.price);
    const salePrice = Number(formData.salePrice);
    const stock = Number(formData.stock);

    if (!formData.name.trim()) nextErrors.name = "Product name is required.";
    if (!formData.description.trim()) nextErrors.description = "Description is required.";
    if (!price || Number.isNaN(price) || price <= 0) nextErrors.price = "Enter a valid price.";
    if (formData.salePrice && (Number.isNaN(salePrice) || salePrice < 0)) {
      nextErrors.salePrice = "Enter a valid sale price.";
    }
    if (formData.salePrice && salePrice >= price) {
      nextErrors.salePrice = "Sale price must be lower than price.";
    }
    if (!formData.category) nextErrors.category = "Category is required.";
    if (!formData.subCategory) nextErrors.subCategory = "Sub category is required.";
    if (!formData.childCategory) nextErrors.childCategory = "Child category is required.";
    if (!formData.brand.trim()) nextErrors.brand = "Brand is required.";
    if (formData.stock === "" || Number.isNaN(stock) || stock < 0) nextErrors.stock = "Enter valid stock.";
    if (!editingProduct && images.length === 0) nextErrors.images = "Add at least one product image.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData(initialForm);
    setAiFeatures("");
    setAiContent(null);
    setImages([]);
    setPreviewImages([]);
    setErrors({});
    setSubCategories([]);
    setChildCategories([]);
    setSearchCategory("");
    setSearchSubCategory("");
    setSearchChildCategory("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setActionLoading("save");

      const payload = {
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim(),
        brand: formData.brand.trim(),
        price: Number(formData.price),
        salePrice: formData.salePrice ? Number(formData.salePrice) : undefined,
        stock: Number(formData.stock),
      };

      const res = editingProduct
        ? await updateProduct(editingProduct._id, payload)
        : await addProduct(payload);

      const productId = res.data?.data?._id || editingProduct?._id;

      if (images.length > 0 && productId) {
        const formDataImg = new FormData();
        images.forEach((image) => formDataImg.append("images", image));
        await uploadProductImages(productId, formDataImg);
      }

      toast.success(editingProduct ? "Product updated" : "Product added");
      resetForm();
      loadProducts(currentPage, { quiet: true });
    } catch (err) {
      console.error("Submit Error:", err);
      setErrors({ submit: err.response?.data?.message || "Failed to save product." });
    } finally {
      setActionLoading("");
    }
  };

  const openEditModal = (product) => {
    const categoryId = product.category?._id || product.category || "";
    const subCategoryId = product.subCategory?._id || product.subCategory || "";
    const childCategoryId = product.childCategory?._id || product.childCategory || "";

    setEditingProduct(product);
    setAiFeatures("");
    setAiContent(null);
    setFormData({
      name: product.name || "",
      description: product.description || "",
      price: product.price || "",
      salePrice: product.salePrice || "",
      category: categoryId,
      subCategory: subCategoryId,
      childCategory: childCategoryId,
      brand: product.brand || "",
      stock: product.stock ?? "",
    });

    syncCategoryOptions(categoryId, subCategoryId);
    setPreviewImages(product.images || []);
    setImages([]);
    setShowModal(true);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openDeleteModal = (id) => {
    setProductToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    try {
      setActionLoading("delete");
      await deleteProduct(productToDelete);
      toast.success("Product deleted");
      setShowDeleteModal(false);
      setProductToDelete(null);
      loadProducts(currentPage, { quiet: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete product");
    } finally {
      setActionLoading("");
    }
  };

  const openStockModal = (id, currentStock) => {
    setProductToUpdateStock(id);
    setNewStock(String(currentStock ?? 0));
    setShowStockModal(true);
  };

  const confirmStockUpdate = async () => {
    const stock = Number(newStock);

    if (!productToUpdateStock || Number.isNaN(stock) || stock < 0) {
      toast.error("Enter valid stock");
      return;
    }

    try {
      setActionLoading("stock");
      await updateProductStock(productToUpdateStock, { stock });
      toast.success("Stock updated");
      setShowStockModal(false);
      setNewStock("");
      loadProducts(currentPage, { quiet: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update stock");
    } finally {
      setActionLoading("");
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    try {
      setActionLoading(`status-${id}`);
      await updateProductStatus(id, { isActive: !currentStatus });
      toast.success("Status updated");
      loadProducts(currentPage, { quiet: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setActionLoading("");
    }
  };

  const handleBulkStatus = async (isActive) => {
    if (selectedProducts.length === 0) return;

    try {
      setActionLoading("bulk");
      await Promise.all(selectedProducts.map((id) => updateProductStatus(id, { isActive })));
      toast.success("Selected products updated");
      loadProducts(currentPage, { quiet: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Bulk update failed");
    } finally {
      setActionLoading("");
    }
  };

  const toggleSelect = (id) => {
    setSelectedProducts((current) =>
      current.includes(id) ? current.filter((productId) => productId !== id) : [...current, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedProducts((current) =>
      current.length === products.length ? [] : products.map((product) => product._id)
    );
  };

  if (loading) {
    return (
      <main className="admin-products">
        <StateCard
          icon={Loader2}
          title="Loading products"
          message="Fetching product catalog, stock, and category data."
          loading
        />
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="admin-products">
        <StateCard
          icon={PackageSearch}
          title="Products unavailable"
          message={errorMessage}
          actionLabel="Try again"
          onAction={() => loadProducts(currentPage)}
        />
      </main>
    );
  }

  return (
    <main className="admin-products">
      <header className="admin-products-header">
        <div>
          <span className="admin-products-kicker">
            <Boxes size={16} aria-hidden="true" />
            Catalog operations
          </span>
          <h1>Product Management</h1>
          <p>Create, edit, sort, and monitor every product in your storefront.</p>
        </div>

        <div className="admin-products-actions">
          <button type="button" className="admin-secondary-btn" onClick={() => loadProducts(currentPage, { quiet: true })}>
            {tableLoading ? <Loader2 size={16} aria-hidden="true" /> : <RefreshCw size={16} aria-hidden="true" />}
            Refresh
          </button>

          <button type="button" className="admin-primary-btn" onClick={openCreateModal}>
            <Plus size={17} aria-hidden="true" />
            Add product
          </button>
        </div>
      </header>

      <section className="admin-product-stats" aria-label="Product summary">
        <div>
          <span>Visible rows</span>
          <strong>{stats.visible}</strong>
        </div>
        <div>
          <span>Total products</span>
          <strong>{totalProducts || stats.visible}</strong>
        </div>
        <div>
          <span>Active</span>
          <strong>{stats.active}</strong>
        </div>
        <div>
          <span>Low stock</span>
          <strong>{stats.lowStock}</strong>
        </div>
      </section>

      <section className="admin-controls" aria-label="Product filters">
        <div className="admin-search-box">
          <Search size={19} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search products..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} aria-label="Clear search">
              <X size={17} aria-hidden="true" />
            </button>
          )}
        </div>

        <label>
          <SlidersHorizontal size={16} aria-hidden="true" />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>

        <label>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="createdAt">Newest</option>
            <option value="price">Price</option>
            <option value="stock">Stock</option>
            <option value="name">Name</option>
          </select>
        </label>

        <label>
          <select value={order} onChange={(event) => setOrder(event.target.value)}>
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </label>
      </section>

      {selectedProducts.length > 0 && (
        <section className="bulk-actions" aria-label="Bulk actions">
          <span>{selectedProducts.length} selected</span>
          <button type="button" onClick={() => handleBulkStatus(true)} disabled={actionLoading === "bulk"}>
            Mark active
          </button>
          <button type="button" onClick={() => handleBulkStatus(false)} disabled={actionLoading === "bulk"}>
            Mark inactive
          </button>
        </section>
      )}

      <section className="admin-table-card">
        {tableLoading && (
          <div className="admin-table-overlay">
            <Loader2 size={24} aria-hidden="true" />
          </div>
        )}

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={products.length > 0 && selectedProducts.length === products.length}
                    onChange={toggleSelectAll}
                    aria-label="Select all products"
                  />
                </th>
                <th>Product</th>
                <th>Brand</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <div className="admin-empty-row">
                      <PackageSearch size={30} aria-hidden="true" />
                      <strong>No products found</strong>
                      <span>Try adjusting search or filters.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const active = getProductStatus(product);
                  const stockTone = getStockTone(product.stock);
                  const statusLoading = actionLoading === `status-${product._id}`;

                  return (
                    <tr key={product._id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product._id)}
                          onChange={() => toggleSelect(product._id)}
                          aria-label={`Select ${product.name}`}
                        />
                      </td>

                      <td>
                        <div className="product-cell">
                          <div className="product-thumb">
                            {product.images?.[0] ? (
                              <img src={product.images[0]} alt={product.name} loading="lazy" />
                            ) : (
                              <span>{getInitials(product.name)}</span>
                            )}
                          </div>
                          <div>
                            <strong>{product.name}</strong>
                            <span>{product.category?.name || "Uncategorized"}</span>
                          </div>
                        </div>
                      </td>

                      <td>{product.brand || "NA"}</td>
                      <td>
                        <div className="price-cell">
                          <strong>{formatPrice(product.salePrice || product.price)}</strong>
                          {product.salePrice && Number(product.salePrice) < Number(product.price) && (
                            <span>{formatPrice(product.price)}</span>
                          )}
                        </div>
                      </td>

                      <td>
                        <span className={`stock-pill stock-pill--${stockTone}`}>
                          {product.stock ?? 0}
                        </span>
                      </td>

                      <td>
                        <span className={`status-pill ${active ? "is-active" : "is-inactive"}`}>
                          {active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td>
                        <div className="row-actions">
                          <button type="button" onClick={() => openEditModal(product)}>
                            <Edit3 size={15} aria-hidden="true" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusToggle(product._id, active)}
                            disabled={statusLoading}
                          >
                            {statusLoading ? <Loader2 size={15} aria-hidden="true" /> : <CheckCircle2 size={15} aria-hidden="true" />}
                            Status
                          </button>
                          <button type="button" onClick={() => openStockModal(product._id, product.stock)}>
                            Stock
                          </button>
                          <button type="button" className="danger-action" onClick={() => openDeleteModal(product._id)}>
                            <Trash2 size={15} aria-hidden="true" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <nav className="pagination" aria-label="Product pages">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          aria-label="Previous page"
        >
          <ChevronLeft size={17} aria-hidden="true" />
          Prev
        </button>

        <span>
          Page {currentPage} of {totalPages}
        </span>

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
          aria-label="Next page"
        >
          Next
          <ChevronRight size={17} aria-hidden="true" />
        </button>
      </nav>

      {showModal && (
        <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
          <div className="modal-content product-modal">
            <button className="close-btn" type="button" onClick={resetForm} aria-label="Close product form">
              <X size={18} aria-hidden="true" />
            </button>

            <div className="modal-heading">
              <span>
                <Boxes size={16} aria-hidden="true" />
                {editingProduct ? "Edit catalog item" : "New catalog item"}
              </span>
              <h2 id="product-modal-title">{editingProduct ? "Edit Product" : "Add Product"}</h2>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <FormField label="Product Name" error={errors.name}>
                  <input name="name" value={formData.name} onChange={handleChange} required />
                </FormField>

                <FormField label="Category" error={errors.category}>
                  <SearchableSelect
                    searchValue={searchCategory}
                    onSearchChange={setSearchCategory}
                    selectValue={formData.category}
                    onSelectChange={handleCategoryChange}
                    options={filteredMainCategories}
                    placeholder="Search category..."
                    selectPlaceholder="Select category"
                  />
                </FormField>

                <FormField label="Sub Category" error={errors.subCategory}>
                  <SearchableSelect
                    searchValue={searchSubCategory}
                    onSearchChange={setSearchSubCategory}
                    selectValue={formData.subCategory}
                    onSelectChange={handleSubCategoryChange}
                    options={filteredSubCategories}
                    placeholder="Search sub category..."
                    selectPlaceholder="Select sub category"
                    disabled={!formData.category}
                  />
                </FormField>

                <FormField label="Child Category" error={errors.childCategory}>
                  <SearchableSelect
                    searchValue={searchChildCategory}
                    onSearchChange={setSearchChildCategory}
                    selectValue={formData.childCategory}
                    onSelectChange={handleChildCategoryChange}
                    options={filteredChildCategories}
                    placeholder="Search child category..."
                    selectPlaceholder="Select child category"
                    disabled={!formData.subCategory}
                  />
                </FormField>

                <FormField label="Brand" error={errors.brand}>
                  <input name="brand" value={formData.brand} onChange={handleChange} required />
                </FormField>

                <FormField label="Price" error={errors.price}>
                  <input type="number" name="price" value={formData.price} onChange={handleChange} required min="0" step="0.01" />
                </FormField>

                <FormField label="Sale Price" error={errors.salePrice}>
                  <input type="number" name="salePrice" value={formData.salePrice} onChange={handleChange} min="0" step="0.01" />
                </FormField>

                <FormField label="Stock Quantity" error={errors.stock}>
                  <input type="number" name="stock" value={formData.stock} onChange={handleChange} required min="0" />
                </FormField>
              </div>

              <div className="ai-product-generator">
                <div className="ai-product-generator-header">
                  <span>AI Content Generator</span>
                  <p>Generate description, highlights, SEO title, and meta description.</p>
                </div>

                <textarea
                  value={aiFeatures}
                  onChange={(event) => setAiFeatures(event.target.value)}
                  placeholder="Example: genuine leather, RFID blocking, slim design, multiple card slots"
                  rows="3"
                />

                <button
                  type="button"
                  onClick={handleGenerateProductContent}
                  disabled={actionLoading === "ai-content"}
                >
                  {actionLoading === "ai-content" ? (
                    <>
                      <Loader2 size={16} aria-hidden="true" />
                      Generating
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} aria-hidden="true" />
                      Generate with AI
                    </>
                  )}
                </button>

                {aiContent && (
                  <div className="ai-generated-preview">
                    <div>
                      <strong>Short Highlights</strong>
                      <ul>
                        {(aiContent.shortHighlights || []).map((highlight, index) => (
                          <li key={`${highlight}-${index}`}>{highlight}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <strong>SEO Title</strong>
                      <p>{aiContent.seoTitle}</p>
                    </div>

                    <div>
                      <strong>Meta Description</strong>
                      <p>{aiContent.metaDescription}</p>
                    </div>
                  </div>
                )}
              </div>

              <FormField label="Description" error={errors.description}>
                <textarea name="description" value={formData.description} onChange={handleChange} rows="4" required />
              </FormField>

              <FormField label={`Product Images ${editingProduct ? "(optional)" : "(required)"}`} error={errors.images}>
                <label className="image-upload-box">
                  <Upload size={20} aria-hidden="true" />
                  <span>Upload product images</span>
                  <input type="file" multiple accept="image/*" onChange={handleImageChange} />
                </label>
              </FormField>

              {previewImages.length > 0 && (
                <div className="image-preview">
                  {previewImages.map((src, index) => (
                    <img key={`${src}-${index}`} src={src} alt={`Product preview ${index + 1}`} />
                  ))}
                </div>
              )}

              {errors.submit && <div className="form-error">{errors.submit}</div>}

              <div className="modal-actions">
                <button type="button" className="admin-secondary-btn" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="admin-primary-btn" disabled={actionLoading === "save"}>
                  {actionLoading === "save" ? (
                    <>
                      <Loader2 size={17} aria-hidden="true" />
                      Saving
                    </>
                  ) : (
                    "Save product"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <ConfirmModal
          title="Delete product"
          message="This action removes the product from your catalog. Are you sure?"
          loading={actionLoading === "delete"}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
          danger
        />
      )}

      {showStockModal && (
        <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="stock-modal-title">
          <div className="stock-modal">
            <div className="modal-heading">
              <span>Inventory</span>
              <h2 id="stock-modal-title">Update Stock</h2>
            </div>

            <input
              type="number"
              value={newStock}
              onChange={(event) => setNewStock(event.target.value)}
              min="0"
              autoFocus
            />

            <div className="modal-actions">
              <button type="button" className="admin-secondary-btn" onClick={() => setShowStockModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="admin-primary-btn"
                onClick={confirmStockUpdate}
                disabled={actionLoading === "stock"}
              >
                {actionLoading === "stock" ? (
                  <>
                    <Loader2 size={17} aria-hidden="true" />
                    Saving
                  </>
                ) : (
                  "Save stock"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

const FormField = ({ label, error, children }) => (
  <div className="form-group">
    <label>{label}</label>
    {children}
    {error && <div className="form-error">{error}</div>}
  </div>
);

const SearchableSelect = ({
  searchValue,
  onSearchChange,
  selectValue,
  onSelectChange,
  options,
  placeholder,
  selectPlaceholder,
  disabled = false,
}) => (
  <div className="searchable-select">
    <input
      type="text"
      placeholder={placeholder}
      value={searchValue}
      onChange={(event) => onSearchChange(event.target.value)}
      disabled={disabled}
      className="select-search-input"
    />
    <select
      value={selectValue}
      onChange={onSelectChange}
      disabled={disabled}
      required
      className="searchable-dropdown"
    >
      <option value="">{selectPlaceholder}</option>
      {options.map((option) => (
        <option key={option._id} value={option._id}>
          {option.name}
        </option>
      ))}
    </select>
  </div>
);

const ConfirmModal = ({ title, message, loading, onCancel, onConfirm, danger }) => (
  <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
    <div className="confirm-modal">
      <AlertTriangle size={34} aria-hidden="true" />
      <h2 id="confirm-modal-title">{title}</h2>
      <p>{message}</p>

      <div className="modal-actions">
        <button type="button" className="admin-secondary-btn" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className={danger ? "danger-confirm" : "admin-primary-btn"}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 size={17} aria-hidden="true" />
              Working
            </>
          ) : (
            "Confirm"
          )}
        </button>
      </div>
    </div>
  </div>
);

const StateCard = ({ icon: Icon, title, message, actionLabel, onAction, loading }) => (
  <div className="admin-state-card">
    <Icon className={loading ? "admin-spinner" : ""} size={34} aria-hidden="true" />
    <h2>{title}</h2>
    <p>{message}</p>
    {actionLabel && (
      <button type="button" className="admin-primary-btn" onClick={onAction}>
        {actionLabel}
      </button>
    )}
  </div>
);

export default Products;