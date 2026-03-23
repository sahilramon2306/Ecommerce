import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllActiveCategories } from "../api/categoryApi";

import "../styles/categories.css";

const PublicCategories = () => {

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCategories = async () => {

    try {

      const res = await getAllActiveCategories();

      setCategories(res.data.data || []);

    } catch (err) {

      console.error("Categories load error", err);

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {
    loadCategories();
  }, []);

  if (loading) {
    return <div className="categories-loading">Loading categories...</div>;
  }

  return (

    <div className="categories-container">

      <h1>Shop by Categories</h1>

      <div className="categories-grid">

        {categories.map(cat => (

          <Link
            key={cat._id}
            to={`/category/${cat._id}`}
            className="category-card"
          >

            <img
              src={cat.image || "/category-placeholder.png"}
              alt={cat.name}
            />

            <h3>{cat.name}</h3>

          </Link>

        ))}

      </div>

    </div>

  );

};

export default PublicCategories;