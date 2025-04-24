const express = require('express');
const {
  submitContactForm,
  getContactMessages,
  getContactMessageById,
  updateContactStatus,
  replyToContactMessage,
  deleteContactMessage
} = require('../controllers/contactController');
const { protect, admin } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { check } = require('express-validator');

const router = express.Router();

// Validation rules
const contactFormValidation = [
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
  
  check('phone')
    .optional()
    .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
    .withMessage('Please enter a valid phone number'),
  
  check('subject')
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Subject must be between 2 and 100 characters'),
  
  check('message')
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Message must be between 10 and 1000 characters')
];

// Status update validation
const statusValidation = [
  check('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['unread', 'read', 'replied', 'archived'])
    .withMessage('Invalid status')
];

// Reply validation
const replyValidation = [
  check('responseMessage')
    .notEmpty()
    .withMessage('Response message is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Response message must be between 10 and 1000 characters')
];

// Routes
router.route('/')
  .post(validate(contactFormValidation), submitContactForm)
  .get(protect, admin, getContactMessages);

router.route('/:id')
  .get(protect, admin, getContactMessageById)
  .delete(protect, admin, deleteContactMessage);

router.route('/:id/status')
  .put(protect, admin, validate(statusValidation), updateContactStatus);

router.route('/:id/reply')
  .post(protect, admin, validate(replyValidation), replyToContactMessage);

module.exports = router;