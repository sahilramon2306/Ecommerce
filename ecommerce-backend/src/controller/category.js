const mongoose = require("mongoose");
const categoryModel = require("../model/category.js");


//------------------------------------------------------------------------------------------------------------------
// Create category (Admin)
const createCategory = async (req, res) => {
  try {
    const { name, slug, image, status = true, parent = null } = req.body;

    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: "Name and slug are required"
      });
    }

    if (parent && !mongoose.Types.ObjectId.isValid(parent)) {
      return res.status(400).json({
        success: false,
        message: "Invalid parent category ID"
      });
    }

    if (parent) {
      const parentCategory = await categoryModel.findById(parent);
      if (!parentCategory) {
        return res.status(404).json({
          success: false,
          message: "Parent category not found"
        });
      }
    }

    const existingSlug = await categoryModel.findOne({ slug });
    if (existingSlug) {
      return res.status(409).json({
        success: false,
        message: "Category slug already exists"
      });
    }

    const category = new categoryModel({
      name,
      slug,
      image: image || null,
      status,
      parent
    });

    await category.save();

    return res.status(201).json({
      success: true,
      message: parent
        ? "Subcategory created successfully"
        : "Category created successfully",
      data: category
    });

  } catch (error) {
    console.error("❌ createCategory error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//------------------------------------------------------------------------------------------------------------------
// Update Category (Admin)
const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, slug, image, status, parent } = req.body;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID"
      });
    }

    const category = await categoryModel.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    if (parent) {
      if (!mongoose.Types.ObjectId.isValid(parent)) {
        return res.status(400).json({
          success: false,
          message: "Invalid parent category ID"
        });
      }

      if (parent === categoryId) {
        return res.status(400).json({
          success: false,
          message: "Category cannot be its own parent"
        });
      }

      const parentCategory = await categoryModel.findById(parent);
      if (!parentCategory) {
        return res.status(404).json({
          success: false,
          message: "Parent category not found"
        });
      }
    }

    if (slug && slug !== category.slug) {
      const existingSlug = await categoryModel.findOne({ slug });
      if (existingSlug) {
        return res.status(409).json({
          success: false,
          message: "Category slug already exists"
        });
      }
    }

    if (name !== undefined) category.name = name;
    if (slug !== undefined) category.slug = slug;
    if (image !== undefined) category.image = image;
    if (status !== undefined) category.status = status;
    if (parent !== undefined) category.parent = parent;

    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category
    });

  } catch (error) {
    console.error("❌ updateCategory error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//------------------------------------------------------------------------------------------------------------------
// deleteCategory (Admin)
const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { type = "soft" } = req.query;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID"
      });
    }

    const category = await categoryModel.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    // SOFT DELETE (DEFAULT)
    if (type === "soft") {
      category.status = false;
      await category.save();

      return res.status(200).json({
        success: true,
        message: "Category soft-deleted successfully"
      });
    }

    // HARD DELETE
    if (type === "hard") {
      const subcategoryCount = await categoryModel.countDocuments({
        parent: categoryId
      });

      if (subcategoryCount > 0) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot hard delete category with existing subcategories"
        });
      }

      await categoryModel.findByIdAndDelete(categoryId);

      return res.status(200).json({
        success: true,
        message: "Category permanently deleted"
      });
    }

    return res.status(400).json({
      success: false,
      message: "Invalid delete type. Use 'soft' or 'hard'."
    });

  } catch (error) {
    console.error("❌ deleteCategory error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//------------------------------------------------------------------------------------------------------------------
// Upload Category Image
const uploadCategoryImage = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required"
      });
    }

    const category = await categoryModel.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    category.image = `/uploads/categories/${req.file.filename}`;
    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category image uploaded successfully",
      data: category
    });

  } catch (error) {
    console.error("❌ uploadCategoryImage error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//------------------------------------------------------------------------------------------------------------------
// Change Category Status (Admin)
const changeCategoryStatus = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID"
      });
    }

    if (typeof status !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Status must be true or false"
      });
    }

    const category = await categoryModel.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    category.status = status;
    await category.save();

    return res.status(200).json({
      success: true,
      message: status
        ? "Category activated successfully"
        : "Category deactivated successfully",
      data: {
        _id: category._id,
        status: category.status
      }
    });

  } catch (error) {
    console.error("❌ changeCategoryStatus error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//--------------------------------------------------------------------------------------------------------------
// Get All Categories (Admin)
const getAllCategories = async (req, res) => {
  try {
    const categories = await categoryModel
      .find() // fetch all (active + inactive)
      .populate("parent", "name slug")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      data: categories
    });

  } catch (error) {
    console.error("❌ getAllCategories error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//-----------------------------------------------------------------------------------------------
// Get All Active Categories (Public)
const getAllActiveCategoriesPublic = async (req, res) => {
  try {
    const categories = await categoryModel
      .find({ status: true }) // ONLY active categories
      .populate("parent", "name slug")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Active categories fetched successfully",
      data: categories
    });

  } catch (error) {
    console.error("❌ getAllActiveCategories error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//-----------------------------------------------------------------------------------------------------------------------
// Get Single Category (Public)
const getSingleCategoryPublic = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID"
      });
    }

    const category = await categoryModel
      .findOne({ _id: categoryId, status: true })
      .populate("parent", "name slug");

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found or inactive"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category fetched successfully",
      data: category
    });

  } catch (error) {
    console.error("❌ getSingleCategoryPublic error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//--------------------------------------------------------------------------------------------------------
const getSubcategoriesPublic = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID"
      });
    }

    const parentCategory = await categoryModel.findOne({
      _id: categoryId,
      status: true
    });

    if (!parentCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found or inactive"
      });
    }

    const subcategories = await categoryModel
      .find({ parent: categoryId, status: true })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Subcategories fetched successfully",
      parent: {
        _id: parentCategory._id,
        name: parentCategory.name,
        slug: parentCategory.slug
      },
      count: subcategories.length,
      data: subcategories
    });

  } catch (error) {
    console.error("❌ getSubcategoriesPublic error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};










//===================================================================================================
//===================================================================================================
//===================================================================================================
module.exports = { 
  createCategory: createCategory,
  updateCategory: updateCategory,
  deleteCategory: deleteCategory,
  uploadCategoryImage: uploadCategoryImage,
  changeCategoryStatus: changeCategoryStatus,
  getAllCategories: getAllCategories,
  getAllActiveCategoriesPublic: getAllActiveCategoriesPublic,
  getSingleCategoryPublic: getSingleCategoryPublic,
  getSubcategoriesPublic: getSubcategoriesPublic
};
