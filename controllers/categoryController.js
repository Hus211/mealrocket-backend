const asyncHandler = require('../middleware/asyncHandler');
const Category = require('../models/categoryModel');

/**
 * @desc    Get all categories
 * @route   GET /api/categories
 * @access  Public
 */
const getCategories = asyncHandler(async (req, res) => {
  // Parse query parameters
  const isActive = req.query.active === 'true' ? true : undefined;
  
  // Build query
  const query = {};
  if (isActive !== undefined) {
    query.isActive = isActive;
  }

  // Apply sorting (default to displaying active categories first, then by display order)
  const sortOrder = { isActive: -1, displayOrder: 1, name: 1 };
  
  // Execute query
  const categories = await Category.find(query).sort(sortOrder);
  
  res.json({
    success: true,
    count: categories.length,
    data: categories
  });
});

/**
 * @desc    Get category by ID
 * @route   GET /api/categories/:id
 * @access  Public
 */
const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  
  res.json({
    success: true,
    data: category
  });
});

/**
 * @desc    Create a new category
 * @route   POST /api/categories
 * @access  Private/Admin
 */
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, isActive, displayOrder } = req.body;
  
  // Create slug from name
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  // Check if category exists by slug
  const categoryExists = await Category.findOne({ slug });
  
  if (categoryExists) {
    res.status(400);
    throw new Error('Category with this name already exists');
  }
  
  // Create category
  const category = await Category.create({
    name,
    slug,
    description,
    isActive: isActive !== undefined ? isActive : true,
    displayOrder: displayOrder || 0
  });
  
  if (category) {
    res.status(201).json({
      success: true,
      data: category
    });
  } else {
    res.status(400);
    throw new Error('Invalid category data');
  }
});

/**
 * @desc    Update a category
 * @route   PUT /api/categories/:id
 * @access  Private/Admin
 */
const updateCategory = asyncHandler(async (req, res) => {
  const { name, description, isActive, displayOrder } = req.body;
  
  // Find category
  const category = await Category.findById(req.params.id);
  
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  
  // If name is being updated, update slug as well
  let slug = category.slug;
  if (name && name !== category.name) {
    slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    // Check if new slug already exists (but not for this category)
    const slugExists = await Category.findOne({ slug, _id: { $ne: category._id } });
    
    if (slugExists) {
      res.status(400);
      throw new Error('Category with this name already exists');
    }
  }
  
  // Update category
  category.name = name || category.name;
  category.slug = slug;
  category.description = description !== undefined ? description : category.description;
  category.isActive = isActive !== undefined ? isActive : category.isActive;
  category.displayOrder = displayOrder !== undefined ? displayOrder : category.displayOrder;
  
  const updatedCategory = await category.save();
  
  res.json({
    success: true,
    data: updatedCategory
  });
});

/**
 * @desc    Delete a category
 * @route   DELETE /api/categories/:id
 * @access  Private/Admin
 */
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  
  await category.deleteOne();
  
  res.json({
    success: true,
    message: 'Category removed',
    data: {}
  });
});

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};