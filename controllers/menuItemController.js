const asyncHandler = require('../middleware/asyncHandler');
const MenuItem = require('../models/menuItemModel');
const Category = require('../models/categoryModel');
const { deleteFromCloudinary } = require('../config/cloudinary');
const logger = require('../utils/logger');

/**
 * @desc    Get all menu items
 * @route   GET /api/menu
 * @access  Public
 */
const getMenuItems = asyncHandler(async (req, res) => {
  // Parse query parameters for filtering
  const { 
    category, 
    isAvailable, 
    isFeatured, 
    minPrice, 
    maxPrice, 
    search 
  } = req.query;
  
  // Build query
  const query = {};
  
  // Filter by category
  if (category) {
    // First check if it's a valid ObjectId or a category slug
    if (category.match(/^[0-9a-fA-F]{24}$/)) {
      query.category = category;
    } else {
      // Find category by slug
      const categoryDoc = await Category.findOne({ slug: category });
      if (categoryDoc) {
        query.category = categoryDoc._id;
      }
    }
  }
  
  // Filter by availability
  if (isAvailable !== undefined) {
    query.isAvailable = isAvailable === 'true';
  }
  
  // Filter by featured status
  if (isFeatured !== undefined) {
    query.isFeatured = isFeatured === 'true';
  }
  
  // Filter by price range
  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {};
    if (minPrice !== undefined) {
      query.price.$gte = Number(minPrice);
    }
    if (maxPrice !== undefined) {
      query.price.$lte = Number(maxPrice);
    }
  }
  
  // Search by name or description
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 100;
  const startIndex = (page - 1) * limit;
  
  // Execute query with pagination and populate category
  const items = await MenuItem.find(query)
    .populate('category', 'name slug')
    .sort({ category: 1, name: 1 })
    .skip(startIndex)
    .limit(limit);
  
  // Get total count for pagination
  const total = await MenuItem.countDocuments(query);
  
  res.json({
    success: true,
    count: items.length,
    total,
    pagination: {
      page,
      limit,
      pages: Math.ceil(total / limit)
    },
    data: items
  });
});

/**
 * @desc    Get menu item by ID
 * @route   GET /api/menu/:id
 * @access  Public
 */
const getMenuItemById = asyncHandler(async (req, res) => {
  const item = await MenuItem.findById(req.params.id).populate('category', 'name slug');
  
  if (!item) {
    res.status(404);
    throw new Error('Menu item not found');
  }
  
  res.json({
    success: true,
    data: item
  });
});

/**
 * @desc    Get menu items by category
 * @route   GET /api/menu/category/:categoryId
 * @access  Public
 */
const getMenuItemsByCategory = asyncHandler(async (req, res) => {
  const categoryId = req.params.categoryId;
  
  // Verify that the category exists
  const category = await Category.findById(categoryId);
  
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  
  // Get menu items for the category
  const items = await MenuItem.find({ category: categoryId, isAvailable: true })
    .populate('category', 'name slug');
  
  res.json({
    success: true,
    count: items.length,
    categoryName: category.name,
    data: items
  });
});

/**
 * @desc    Create a new menu item
 * @route   POST /api/menu
 * @access  Private/Admin
 */
const createMenuItem = asyncHandler(async (req, res) => {
  const { 
    name, 
    description, 
    price, 
    category: categoryId, 
    image,
    imagePublicId,
    rating,
    isAvailable,
    isFeatured,
    options,
    nutritionalInfo,
    allergens,
    preparationTime,
    tags
  } = req.body;
  
  // Verify that the category exists
  const category = await Category.findById(categoryId);
  
  if (!category) {
    res.status(400);
    throw new Error('Invalid category');
  }
  
  // Create menu item
  const menuItem = await MenuItem.create({
    name,
    description,
    price,
    category: categoryId,
    image: image || 'https://res.cloudinary.com/dgdbxflan/image/upload/v1/mealrocket/default-food.jpg',
    imagePublicId: imagePublicId || '', // Store Cloudinary public ID if provided
    rating: rating || 4.5,
    isAvailable: isAvailable !== undefined ? isAvailable : true,
    isFeatured: isFeatured || false,
    options,
    nutritionalInfo: nutritionalInfo || {},
    allergens: allergens || [],
    preparationTime: preparationTime || 15,
    tags: tags || []
  });
  
  if (menuItem) {
    res.status(201).json({
      success: true,
      data: menuItem
    });
  } else {
    res.status(400);
    throw new Error('Invalid menu item data');
  }
});

/**
 * @desc    Update a menu item
 * @route   PUT /api/menu/:id
 * @access  Private/Admin
 */
const updateMenuItem = asyncHandler(async (req, res) => {
  const { 
    name, 
    description, 
    price, 
    category: categoryId, 
    image,
    imagePublicId,
    rating,
    isAvailable,
    isFeatured,
    options,
    nutritionalInfo,
    allergens,
    preparationTime,
    tags
  } = req.body;
  
  // Find menu item
  const menuItem = await MenuItem.findById(req.params.id);
  
  if (!menuItem) {
    res.status(404);
    throw new Error('Menu item not found');
  }
  
  // If category ID is provided, verify it exists
  if (categoryId) {
    const category = await Category.findById(categoryId);
    
    if (!category) {
      res.status(400);
      throw new Error('Invalid category');
    }
  }
  
  // If a new image is being uploaded, delete the old one from Cloudinary
  if (image && image !== menuItem.image && menuItem.imagePublicId) {
    try {
      await deleteFromCloudinary(menuItem.imagePublicId);
      logger.info(`Deleted previous image ${menuItem.imagePublicId} from Cloudinary`);
    } catch (error) {
      logger.warn(`Failed to delete previous image ${menuItem.imagePublicId} from Cloudinary`, { error: error.message });
      // Continue with update even if deletion fails
    }
  }
  
  // Update menu item
  menuItem.name = name || menuItem.name;
  menuItem.description = description || menuItem.description;
  menuItem.price = price !== undefined ? price : menuItem.price;
  menuItem.category = categoryId || menuItem.category;
  
  // Update image and public ID if provided
  if (image) menuItem.image = image;
  if (imagePublicId) menuItem.imagePublicId = imagePublicId;
  
  menuItem.rating = rating !== undefined ? rating : menuItem.rating;
  menuItem.isAvailable = isAvailable !== undefined ? isAvailable : menuItem.isAvailable;
  menuItem.isFeatured = isFeatured !== undefined ? isFeatured : menuItem.isFeatured;
  menuItem.options = options !== undefined ? options : menuItem.options;
  
  // Update nested objects/arrays if provided
  if (nutritionalInfo) {
    menuItem.nutritionalInfo = {
      ...menuItem.nutritionalInfo,
      ...nutritionalInfo
    };
  }
  
  if (allergens) {
    menuItem.allergens = allergens;
  }
  
  if (preparationTime !== undefined) {
    menuItem.preparationTime = preparationTime;
  }
  
  if (tags) {
    menuItem.tags = tags;
  }
  
  const updatedMenuItem = await menuItem.save();
  
  res.json({
    success: true,
    data: updatedMenuItem
  });
});

/**
 * @desc    Delete a menu item
 * @route   DELETE /api/menu/:id
 * @access  Private/Admin
 */
const deleteMenuItem = asyncHandler(async (req, res) => {
  const menuItem = await MenuItem.findById(req.params.id);
  
  if (!menuItem) {
    res.status(404);
    throw new Error('Menu item not found');
  }
  
  // Delete image from Cloudinary if it exists
  if (menuItem.imagePublicId) {
    try {
      await deleteFromCloudinary(menuItem.imagePublicId);
      logger.info(`Deleted image ${menuItem.imagePublicId} from Cloudinary`);
    } catch (error) {
      logger.warn(`Failed to delete image ${menuItem.imagePublicId} from Cloudinary`, { error: error.message });
      // Continue with deletion even if image removal fails
    }
  }
  
  await menuItem.deleteOne();
  
  res.json({
    success: true,
    message: 'Menu item removed',
    data: {}
  });
});

/**
 * @desc    Get featured menu items
 * @route   GET /api/menu/featured
 * @access  Public
 */
const getFeaturedMenuItems = asyncHandler(async (req, res) => {
  const items = await MenuItem.find({ isFeatured: true, isAvailable: true })
    .populate('category', 'name slug')
    .limit(8);
  
  res.json({
    success: true,
    count: items.length,
    data: items
  });
});

module.exports = {
  getMenuItems,
  getMenuItemById,
  getMenuItemsByCategory,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getFeaturedMenuItems
};