const express = require('express');
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser
} = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { check } = require('express-validator');

const router = express.Router();

// Validation rules
const registerValidation = [
  check('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  check('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address'),
  
  check('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  check('phone')
    .optional()
    .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
    .withMessage('Please enter a valid phone number')
];

const loginValidation = [
  check('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address'),
  
  check('password')
    .notEmpty()
    .withMessage('Password is required')
];

const userUpdateValidation = [
  check('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  check('email')
    .optional()
    .isEmail()
    .withMessage('Please enter a valid email address'),
  
  check('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  check('phone')
    .optional()
    .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
    .withMessage('Please enter a valid phone number')
];

const adminUserUpdateValidation = [
  ...userUpdateValidation,
  check('isAdmin')
    .optional()
    .isBoolean()
    .withMessage('isAdmin must be a boolean value')
];

// Routes
router.route('/register')
  .post(validate(registerValidation), registerUser);

router.route('/login')
  .post(validate(loginValidation), loginUser);

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, validate(userUpdateValidation), updateUserProfile);

// Admin routes to manage users
router.route('/users')
  .get(protect, admin, getUsers);

router.route('/users/:id')
  .get(protect, admin, getUserById)
  .put(protect, admin, validate(adminUserUpdateValidation), updateUser)
  .delete(protect, admin, deleteUser);

module.exports = router;
