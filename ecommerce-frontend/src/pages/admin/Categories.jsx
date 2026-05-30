import React, { useState, useEffect, useRef } from 'react';
import {
  createCategoryAdmin,
  updateCategoryAdmin,
  deleteCategoryAdmin,
  uploadCategoryImageAdmin,
  changeCategoryStatusAdmin,
  getAllCategoriesAdmin
} from '../../api/adminApi';

import "../../styles/admin-categories.css";

const CategoryAdmin = () => {
  const [categories, setCategories] = useState([]);
  const [allCategoriesForDropdown, setAllCategoriesForDropdown] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = 10;

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [editingCategory, setEditingCategory] = useState(null);
  const [uploadCategoryId, setUploadCategoryId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    status: true,
    parent: '',
    file: null
  });

  const [uploadFile, setUploadFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Professional Parent Category Selector
  const [parentSearchTerm, setParentSearchTerm] = useState("");
  const [showParentDropdown, setShowParentDropdown] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const parentSearchRef = useRef(null);
  const parentDropdownRef = useRef(null);

  /* ================= FETCH FUNCTIONS ================= */
  const fetchCategories = async (page = 1, search = "") => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllCategoriesAdmin({
        page,
        limit: ITEMS_PER_PAGE,
        search: search.trim()
      });

      const data = response.data?.data || [];
      const pagination = response.data?.pagination || response.data?.meta || {};

      setCategories(data);
      setCurrentPage(pagination.page || page);
      setTotalPages(pagination.totalPages || 1);
      setTotalItems(pagination.total || 0);
    } catch (err) {
      console.error("Fetch categories error:", err);
      setError(err.response?.data?.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCategoriesForDropdown = async () => {
    try {
      const response = await getAllCategoriesAdmin({ all: "true" });
      setAllCategoriesForDropdown(response.data?.data || []);
    } catch (err) {
      console.error("Dropdown fetch failed", err);
    }
  };

  /* ================= EFFECTS ================= */
  useEffect(() => {
    fetchCategories(1, searchTerm);
    fetchAllCategoriesForDropdown();
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      setCurrentPage(1);
      fetchCategories(1, searchTerm);
    }, 400);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  useEffect(() => {
    fetchCategories(currentPage, searchTerm);
  }, [currentPage]);

  // Close parent dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        parentSearchRef.current && !parentSearchRef.current.contains(event.target) &&
        parentDropdownRef.current && !parentDropdownRef.current.contains(event.target)
      ) {
        setShowParentDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ================= HELPERS ================= */
  const getLevel = (cat, allCategories) => {
    let level = 0;
    let current = cat;
    while (current?.parent) {
      level++;
      const parentId = current.parent?._id || current.parent;
      current = allCategories.find(c => c._id === parentId);
      if (!current) break;
    }
    return level;
  };

  const filteredParents = allCategoriesForDropdown
    .filter(cat => {
      const matchesSearch = cat.name.toLowerCase().includes(parentSearchTerm.toLowerCase());
      const isNotSelf = !editingCategory || cat._id !== editingCategory._id;
      return matchesSearch && isNotSelf;
    })
    .sort((a, b) => getLevel(a, allCategoriesForDropdown) - getLevel(b, allCategoriesForDropdown));

  /* ================= FORM HANDLERS ================= */
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }

    setFormData(prev => ({ ...prev, file }));
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setFormData({ name: '', slug: '', status: true, parent: '', file: null });
    setImagePreview(null);
    setEditingCategory(null);
    setParentSearchTerm("");
    setSelectedParent(null);
    setShowParentDropdown(false);
    setHighlightedIndex(-1);
    setUploadFile(null);
  };

  const selectParent = (category) => {
    setSelectedParent(category);
    setFormData(prev => ({ ...prev, parent: category._id }));
    setParentSearchTerm(category.name);
    setShowParentDropdown(false);
    setHighlightedIndex(-1);
  };

  const clearParent = () => {
    setSelectedParent(null);
    setFormData(prev => ({ ...prev, parent: '' }));
    setParentSearchTerm("");
  };

  /* ================= CRUD OPERATIONS ================= */
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await createCategoryAdmin({
        name: formData.name,
        slug: formData.slug,
        status: formData.status,
        parent: formData.parent || null
      });

      const newId = res.data.data?._id;
      if (formData.file && newId) {
        const form = new FormData();
        form.append("image", formData.file);
        await uploadCategoryImageAdmin(newId, form);
      }

      alert("Category created successfully!");
      setShowCreateModal(false);
      resetForm();
      fetchCategories(1, searchTerm);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create category");
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    const parentCat = category.parent?._id 
      ? allCategoriesForDropdown.find(c => c._id === (category.parent._id || category.parent))
      : null;

    setFormData({
      name: category.name,
      slug: category.slug,
      status: category.status,
      parent: category.parent?._id || '',
      file: null
    });

    setSelectedParent(parentCat);
    setParentSearchTerm(parentCat ? parentCat.name : "");
    setImagePreview(category.image || null);
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const id = editingCategory._id;
      if (formData.file) {
        const form = new FormData();
        form.append("image", formData.file);
        await uploadCategoryImageAdmin(id, form);
      }

      await updateCategoryAdmin(id, {
        name: formData.name,
        slug: formData.slug,
        status: formData.status,
        parent: formData.parent || null
      });

      alert("Category updated successfully!");
      setShowEditModal(false);
      resetForm();
      fetchCategories(currentPage, searchTerm);
    } catch (err) {
      alert(err.response?.data?.message || "Update failed");
    }
  };

  const handleDelete = async (id, type = "soft") => {
    if (!window.confirm(`Are you sure you want to ${type} delete this category?`)) return;
    try {
      await deleteCategoryAdmin(id, type);
      alert(`${type} delete successful!`);
      fetchCategories(currentPage, searchTerm);
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  const handleStatusChange = async (id) => {
    try {
      const category = categories.find(c => c._id === id);
      await changeCategoryStatusAdmin(id, !category.status);
      fetchCategories(currentPage, searchTerm);
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleUploadImageClick = (id) => {
    setUploadCategoryId(id);
    setUploadFile(null);
    setShowUploadModal(true);
  };

  const handleImageUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    const form = new FormData();
    form.append("image", uploadFile);
    try {
      await uploadCategoryImageAdmin(uploadCategoryId, form);
      alert("Image uploaded successfully!");
      setShowUploadModal(false);
      fetchCategories(currentPage, searchTerm);
    } catch (err) {
      alert("Image upload failed");
    }
  };

  // Keyboard navigation for parent dropdown
  const handleParentKeyDown = (e) => {
    if (!showParentDropdown) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setShowParentDropdown(true);
        setHighlightedIndex(0);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      setHighlightedIndex(prev => prev < filteredParents.length - 1 ? prev + 1 : 0);
    } else if (e.key === 'ArrowUp') {
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : filteredParents.length - 1);
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && filteredParents[highlightedIndex]) {
        selectParent(filteredParents[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowParentDropdown(false);
    }
  };

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  if (loading && categories.length === 0) {
    return <div className="loader-container"><div className="loader"></div></div>;
  }

  return (
    <div className="category-admin">
      <div className="admin-header-flex">
        <h1>Category Management</h1>
        <div className="header-controls">
          <input
            className="search-input"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn-add" onClick={() => setShowCreateModal(true)}>
            + Add Category
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="table-container">
        <div className="table-wrapper">
          <table className="categories-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Image</th>
                <th>Status</th>
                <th>Parent</th>
                <th className="actions-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length > 0 ? (
                categories.map(category => {
                  const level = getLevel(category, allCategoriesForDropdown);
                  return (
                    <tr key={category._id}>
                      <td>
                        <span className="indent-prefix">{"— ".repeat(level)}</span>
                        <span className="category-name">{category.name}</span>
                      </td>
                      <td className="slug-cell">{category.slug}</td>
                      <td>
                        {category.image ? (
                          <img src={category.image} alt={category.name} className="category-image" />
                        ) : (
                          <span className="no-image">No Image</span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => handleStatusChange(category._id)}
                          className={`status-pill ${category.status ? 'active' : 'inactive'}`}
                        >
                          {category.status ? 'Active' : 'Hidden'}
                        </button>
                      </td>
                      <td className="parent-cell">{category.parent?.name || '—'}</td>
                      <td className="actions-cell">
                        <div className="action-buttons">
                          <button className="btn-edit" onClick={() => handleEdit(category)}>Edit</button>
                          <button className="btn-info" onClick={() => handleUploadImageClick(category._id)}>Image</button>
                          <button className="btn-delete" onClick={() => handleDelete(category._id, 'soft')}>Soft Delete</button>
                          <button className="btn-delete hard" onClick={() => handleDelete(category._id, 'hard')}>Hard Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="empty-state">
                    <div className="empty-state-content">
                      <div className="empty-icon">📂</div>
                      <h3>No Categories Found</h3>
                      <p>
                        {searchTerm 
                          ? `No results found for "${searchTerm}"` 
                          : "Get started by creating your first category."}
                      </p>
                      <button className="btn-add" onClick={() => setShowCreateModal(true)}>
                        + Create First Category
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && categories.length > 0 && (
          <div className="pagination">
            <button onClick={prevPage} disabled={currentPage === 1} className="page-btn">← Prev</button>
            <span className="page-info">Page {currentPage} of {totalPages}</span>
            <button onClick={nextPage} disabled={currentPage === totalPages} className="page-btn">Next →</button>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      <Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); resetForm(); }}>
        <h3>Create New Category</h3>
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Category Name</label>
            <input name="name" value={formData.name} onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label>Slug</label>
            <input name="slug" value={formData.slug} onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label>Image (optional)</label>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            {imagePreview && <img src={imagePreview} alt="preview" className="image-preview" />}
          </div>

          {/* Professional Parent Selector */}
          <div className="form-group">
            <label>Parent Category</label>
            <div className="custom-parent-selector" ref={parentSearchRef}>
              <div className="parent-search-input-wrapper">
                <input
                  type="text"
                  placeholder="Search parent category..."
                  value={parentSearchTerm}
                  onChange={(e) => { setParentSearchTerm(e.target.value); setShowParentDropdown(true); }}
                  onFocus={() => setShowParentDropdown(true)}
                  onKeyDown={handleParentKeyDown}
                  className="parent-search-input"
                />
                {parentSearchTerm && (
                  <button type="button" className="clear-parent-btn" onClick={clearParent}>×</button>
                )}
              </div>

              {showParentDropdown && (
                <div className="parent-dropdown" ref={parentDropdownRef}>
                  {filteredParents.length > 0 ? (
                    filteredParents.map((cat, index) => (
                      <div
                        key={cat._id}
                        className={`parent-option ${index === highlightedIndex ? 'highlighted' : ''} ${selectedParent?._id === cat._id ? 'selected' : ''}`}
                        onClick={() => selectParent(cat)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                      >
                        <span className="indent-prefix">{"— ".repeat(getLevel(cat, allCategoriesForDropdown))}</span>
                        <span className="parent-name">{cat.name}</span>
                        {selectedParent?._id === cat._id && <span className="selected-check">✓</span>}
                      </div>
                    ))
                  ) : (
                    <div className="no-parent-found">No matching categories found</div>
                  )}
                </div>
              )}
            </div>
            <small className="helper-text">Leave empty for root category</small>
          </div>

          <div className="form-check">
            <input type="checkbox" name="status" checked={formData.status} onChange={handleInputChange} />
            <label>Visible on Storefront</label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancel</button>
            <button type="submit" className="btn-submit">Create Category</button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); resetForm(); }}>
        <h3>Edit Category</h3>
        {editingCategory?.image && (
          <div className="current-image">
            <label>Current Image</label>
            <img src={editingCategory.image} alt="current" className="category-image large" />
          </div>
        )}
        <form onSubmit={handleUpdate}>
          <div className="form-group">
            <label>Category Name</label>
            <input name="name" value={formData.name} onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label>Slug</label>
            <input name="slug" value={formData.slug} onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label>Replace Image (optional)</label>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            {imagePreview && <img src={imagePreview} alt="preview" className="image-preview" />}
          </div>

          {/* Same Professional Parent Selector for Edit */}
          <div className="form-group">
            <label>Parent Category</label>
            <div className="custom-parent-selector" ref={parentSearchRef}>
              <div className="parent-search-input-wrapper">
                <input
                  type="text"
                  placeholder="Search parent category..."
                  value={parentSearchTerm}
                  onChange={(e) => { setParentSearchTerm(e.target.value); setShowParentDropdown(true); }}
                  onFocus={() => setShowParentDropdown(true)}
                  onKeyDown={handleParentKeyDown}
                  className="parent-search-input"
                />
                {parentSearchTerm && (
                  <button type="button" className="clear-parent-btn" onClick={clearParent}>×</button>
                )}
              </div>

              {showParentDropdown && (
                <div className="parent-dropdown" ref={parentDropdownRef}>
                  {filteredParents.length > 0 ? (
                    filteredParents.map((cat, index) => (
                      <div
                        key={cat._id}
                        className={`parent-option ${index === highlightedIndex ? 'highlighted' : ''} ${selectedParent?._id === cat._id ? 'selected' : ''}`}
                        onClick={() => selectParent(cat)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                      >
                        <span className="indent-prefix">{"— ".repeat(getLevel(cat, allCategoriesForDropdown))}</span>
                        <span className="parent-name">{cat.name}</span>
                        {selectedParent?._id === cat._id && <span className="selected-check">✓</span>}
                      </div>
                    ))
                  ) : (
                    <div className="no-parent-found">No matching categories found</div>
                  )}
                </div>
              )}
            </div>
            <small className="helper-text">Leave empty for root category</small>
          </div>

          <div className="form-check">
            <input type="checkbox" name="status" checked={formData.status} onChange={handleInputChange} />
            <label>Visible on Storefront</label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={() => { setShowEditModal(false); resetForm(); }}>Cancel</button>
            <button type="submit" className="btn-submit">Save Changes</button>
          </div>
        </form>
      </Modal>

      {/* UPLOAD IMAGE MODAL */}
      <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)}>
        <h3>Upload Category Image</h3>
        <form onSubmit={handleImageUpload}>
          <div className="form-group">
            <label>Select Image</label>
            <input type="file" accept="image/*" onChange={(e) => setUploadFile(e.target.files[0])} required />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={() => setShowUploadModal(false)}>Cancel</button>
            <button type="submit" className="btn-submit">Upload Image</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

/* Modal Component */
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-form" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        {children}
      </div>
    </div>
  );
};

export default CategoryAdmin;