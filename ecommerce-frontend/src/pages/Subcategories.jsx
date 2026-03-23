import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getSubcategories } from "../api/categoryApi";

import "../styles/categories.css";

const Subcategories = () => {

  const { categoryId } = useParams();

  const [subcategories, setSubcategories] = useState([]);
  const [parent, setParent] = useState(null);

  const loadSubcategories = async () => {

    try {

      const res = await getSubcategories(categoryId);

      setSubcategories(res.data.data || []);
      setParent(res.data.parent);

    } catch (err) {

      console.error("Subcategories load error", err);

    }

  };

  useEffect(() => {
    loadSubcategories();
  }, [categoryId]);

  return (

    <div className="categories-container">

      <h1>{parent?.name} Subcategories</h1>

      <div className="categories-grid">

        {subcategories.map(sub => (

          <Link
            key={sub._id}
            to={`/category/${sub._id}`}
            className="category-card"
          >

            <img
              src={sub.image || "/category-placeholder.png"}
              alt={sub.name}
            />

            <h3>{sub.name}</h3>

          </Link>

        ))}

      </div>

    </div>

  );

};

export default Subcategories;