const express = require('express');
const { 
  getCategories, 
  getCategoryById, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} = require('../controllers/categoryController');
const { protect, admin } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { check } = require('express-validator');

const router = express.Router();

// Validation rules
const categoryValidation = [
  check('name')
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),
  
  check('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  check('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
  
  check('displayOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Display order must be a positive integer')
];

// Routes
router.route('/')
  .get(getCategories)
  .post(protect, admin, validate(categoryValidation), createCategory);

router.route('/:id')
  .get(getCategoryById)
  .put(protect, admin, validate(categoryValidation), updateCategory)
  .delete(protect, admin, deleteCategory);

module.exports = router;