import React, { useState, useEffect } from 'react';
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
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [editingCategory, setEditingCategory] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    status: true,
    parent: '',
    file: null
  });

  const [uploadCategoryId, setUploadCategoryId] = useState(null);
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  /* SEARCH */

  useEffect(() => {

    const delay = setTimeout(() => {

      const filtered = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cat.parent?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
      );

      setFilteredCategories(filtered);

    }, 250);

    return () => clearTimeout(delay);

  }, [searchTerm, categories]);

  /* FETCH */

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await getAllCategoriesAdmin();
      const data = response.data.data || [];
      setCategories(data);
      setFilteredCategories(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {

    const { name, value, type, checked } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

  };

  const handleFileChange = (e) => {

    setFormData(prev => ({
      ...prev,
      file: e.target.files[0]
    }));

  };

  /* CREATE */

  const handleCreate = async (e) => {

    e.preventDefault();

    try {

      const createResponse = await createCategoryAdmin({
        name: formData.name,
        slug: formData.slug,
        status: formData.status,
        parent: formData.parent || null
      });

      const newCategoryId = createResponse.data.data._id;

      if (formData.file) {

        const upload = new FormData();
        upload.append("image", formData.file);

        await uploadCategoryImageAdmin(newCategoryId, upload);

      }

      alert(createResponse.data.message);

      setShowCreateModal(false);

      setFormData({
        name: '',
        slug: '',
        status: true,
        parent: '',
        file: null
      });

      fetchCategories();

    } catch (err) {

      alert(err.response?.data?.message || 'Failed to create category');

    }

  };

  /* EDIT */

  const handleEdit = (category) => {

    setEditingCategory(category);

    setFormData({
      name: category.name,
      slug: category.slug,
      status: category.status,
      parent: category.parent?._id || '',
      file: null
    });

    setShowEditModal(true);

  };

  const handleUpdate = async (e) => {

    e.preventDefault();

    try {

      const id = editingCategory._id;

      if (formData.file) {

        const upload = new FormData();
        upload.append("image", formData.file);

        await uploadCategoryImageAdmin(id, upload);

      }

      const updateResponse = await updateCategoryAdmin(id, {
        name: formData.name,
        slug: formData.slug,
        status: formData.status,
        parent: formData.parent || null
      });

      alert(updateResponse.data.message);

      setShowEditModal(false);

      fetchCategories();

    } catch (err) {

      alert(err.response?.data?.message || 'Update failed');

    }

  };

  /* DELETE */

  const handleDelete = async (id, type = "soft") => {

    if (!window.confirm("Are you sure?")) return;

    try {

      const response = await deleteCategoryAdmin(id, type);

      alert(response.data.message);

      fetchCategories();

    } catch (err) {

      alert("Delete failed");

    }

  };

  /* STATUS */

  const handleStatusChange = async (id) => {

    const category = categories.find(c => c._id === id);

    try {

      const response = await changeCategoryStatusAdmin(id, !category.status);

      alert(response.data.message);

      fetchCategories();

    } catch {

      alert("Status update failed");

    }

  };

  const handleUploadImage = (id) => {

    setUploadCategoryId(id);
    setShowUploadModal(true);

  };

  const handleImageUpload = async (e) => {

    e.preventDefault();

    const form = new FormData();
    form.append("image", file);

    try {

      const response = await uploadCategoryImageAdmin(uploadCategoryId, form);

      alert(response.data.message);

      setShowUploadModal(false);

      fetchCategories();

    } catch {

      alert("Upload failed");

    }

  };

  if (loading) return <div className="loading">Loading categories...</div>;
  if (error) return <div className="error">{error}</div>;

  return (

    <div className="category-admin">

      <div className="header">

        <h1>Category Management</h1>

        <div className="header-actions">

          <input
            type="text"
            placeholder="Search category..."
            className="search-input"
            value={searchTerm}
            onChange={(e)=>setSearchTerm(e.target.value)}
          />

          <button
            onClick={()=>setShowCreateModal(true)}
            className="btn btn-primary"
          >
            Create New Category
          </button>

        </div>

      </div>

      <table className="categories-table">

        <thead>
          <tr>
            <th>Name</th>
            <th>Slug</th>
            <th>Image</th>
            <th>Status</th>
            <th>Parent</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>

          {filteredCategories.map(category => (

            <tr key={category._id}>

              <td data-label="Name">{category.name}</td>
              <td data-label="Slug">{category.slug}</td>

              <td data-label="Image">
                {category.image && (
                  <img
                    src={category.image}
                    alt={category.name}
                    className="category-image"
                  />
                )}
              </td>

              <td data-label="Status">
                <button
                  onClick={()=>handleStatusChange(category._id)}
                  className={`status-btn ${category.status ? 'active' : 'inactive'}`}
                >
                  {category.status ? 'Active' : 'Inactive'}
                </button>
              </td>

              <td data-label="Parent">{category.parent?.name || 'None'}</td>

              <td className="actions-cell">

                <button
                  onClick={()=>handleEdit(category)}
                  className="btn btn-secondary"
                >
                  Edit
                </button>

                <button
                  onClick={()=>handleDelete(category._id,'soft')}
                  className="btn btn-warning"
                >
                  Soft Delete
                </button>

                <button
                  onClick={()=>handleDelete(category._id,'hard')}
                  className="btn btn-danger"
                >
                  Hard Delete
                </button>

                {!category.image && (
                  <button
                    onClick={()=>handleUploadImage(category._id)}
                    className="btn btn-info"
                  >
                    Upload Image
                  </button>
                )}

              </td>

            </tr>

          ))}

        </tbody>

      </table>

      {/* CREATE MODAL */}

      <Modal isOpen={showCreateModal} onClose={()=>setShowCreateModal(false)}>

        <h2>Create Category</h2>

        <form onSubmit={handleCreate}>

          <input name="name" placeholder="Name" value={formData.name} onChange={handleInputChange} required />

          <input name="slug" placeholder="Slug" value={formData.slug} onChange={handleInputChange} required />

          <input type="file" accept="image/*" onChange={handleFileChange} />

          <label className="checkbox-label">
            Status
            <input type="checkbox" name="status" checked={formData.status} onChange={handleInputChange}/>
          </label>

          <select name="parent" value={formData.parent} onChange={handleInputChange}>

            <option value="">No Parent</option>

            {categories.filter(c => !c.parent).map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}

          </select>

          <button className="btn btn-primary full-width">Create</button>

        </form>

      </Modal>

      {/* EDIT MODAL */}

      <Modal isOpen={showEditModal} onClose={()=>setShowEditModal(false)}>

        <h2>Edit Category</h2>

        {editingCategory && (
          <div className="current-image">
            <strong>Current Image</strong>
            {editingCategory.image
              ? <img src={editingCategory.image} alt="" className="category-image small"/>
              : <span>No image</span>}
          </div>
        )}

        <form onSubmit={handleUpdate}>

          <input name="name" value={formData.name} onChange={handleInputChange} required />

          <input name="slug" value={formData.slug} onChange={handleInputChange} required />

          <input type="file" accept="image/*" onChange={handleFileChange} />

          <label className="checkbox-label">
            Status
            <input type="checkbox" name="status" checked={formData.status} onChange={handleInputChange}/>
          </label>

          <select name="parent" value={formData.parent} onChange={handleInputChange}>

            <option value="">No Parent</option>

            {categories
              .filter(c => !c.parent && c._id !== editingCategory?._id)
              .map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}

          </select>

          <button className="btn btn-primary full-width">Update</button>

        </form>

      </Modal>

      {/* IMAGE MODAL */}

      <Modal isOpen={showUploadModal} onClose={()=>setShowUploadModal(false)}>

        <h2>Upload Image</h2>

        <form onSubmit={handleImageUpload}>

          <input type="file" accept="image/*" onChange={(e)=>setFile(e.target.files[0])} required />

          <button className="btn btn-primary full-width">Upload</button>

        </form>

      </Modal>

    </div>
  );
};

const Modal = ({isOpen,onClose,children}) => {

  if(!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e)=>e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        {children}
      </div>
    </div>
  );
};

export default CategoryAdmin;   