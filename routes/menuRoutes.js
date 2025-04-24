const express = require('express');
const { 
  getMenuItems, 
  getMenuItemById, 
  getMenuItemsByCategory, 
  createMenuItem, 
  updateMenuItem, 
  deleteMenuItem,
  getFeaturedMenuItems
} = require('../controllers/menuItemController');
const { protect, admin } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { check } = require('express-validator');

const router = express.Router();

// Validation rules
const menuItemValidation = [
  check('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  check('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  
  check('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  check('category')
    .notEmpty()
    .withMessage('Category is required')
    .isMongoId()
    .withMessage('Category must be a valid ID'),
  
  check('image')
    .optional()
    .isString()
    .withMessage('Image must be a string'),
  
  check('rating')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  check('isAvailable')
    .optional()
    .isBoolean()
    .withMessage('isAvailable must be a boolean value'),
  
  check('isFeatured')
    .optional()
    .isBoolean()
    .withMessage('isFeatured must be a boolean value'),
  
  check('options')
    .optional()
    .isString()
    .withMessage('Options must be a string'),
  
  check('nutritionalInfo')
    .optional()
    .isObject()
    .withMessage('Nutritional info must be an object'),
  
  check('allergens')
    .optional()
    .isArray()
    .withMessage('Allergens must be an array'),
  
  check('preparationTime')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Preparation time must be a positive integer'),
  
  check('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
];

// Routes
router.route('/')
  .get(getMenuItems)
  .post(protect, admin, validate(menuItemValidation), createMenuItem);

router.route('/featured')
  .get(getFeaturedMenuItems);

router.route('/category/:categoryId')
  .get(getMenuItemsByCategory);

router.route('/:id')
  .get(getMenuItemById)
  .put(protect, admin, validate(menuItemValidation), updateMenuItem)
  .delete(protect, admin, deleteMenuItem);

module.exports = router;