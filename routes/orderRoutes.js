const express = require('express');
const {
  createOrder,
  getOrderById,
  getMyOrders,
  getOrders,
  updateOrderStatus,
  updateOrderPayment,
  updateOrderToDelivered,
  cancelOrder
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { check } = require('express-validator');

const router = express.Router();

// Validation rules
const orderValidation = [
  check('orderItems')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  
  check('orderItems.*.menuItem')
    .notEmpty()
    .withMessage('Menu item ID is required')
    .isMongoId()
    .withMessage('Menu item ID must be valid'),
  
  check('orderItems.*.quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  
  check('shippingAddress.fullName')
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  
  check('shippingAddress.phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
    .withMessage('Please enter a valid phone number'),
  
  check('shippingAddress.email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address'),
  
  check('shippingAddress.address')
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),
  
  check('paymentMethod')
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['cash', 'visa', 'airtel', 'mtn', 'zamtel'])
    .withMessage('Invalid payment method'),
  
  check('mobileMoneyNumber')
    .if((value, { req }) => ['airtel', 'mtn', 'zamtel'].includes(req.body.paymentMethod))
    .notEmpty()
    .withMessage('Mobile money number is required for this payment method')
    .matches(/^[0-9]{9,12}$/)
    .withMessage('Please enter a valid mobile money number'),
  
  check('totalAmount')
    .notEmpty()
    .withMessage('Total amount is required')
    .isFloat({ min: 0 })
    .withMessage('Total amount must be a positive number'),
  
  check('orderType')
    .optional()
    .isIn(['delivery', 'pickup'])
    .withMessage('Order type must be either delivery or pickup')
];

// Status update validation
const statusValidation = [
  check('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['pending', 'processing', 'completed', 'cancelled'])
    .withMessage('Invalid status')
];

// Payment result validation
const paymentValidation = [
  check('id').notEmpty().withMessage('Payment ID is required'),
  check('status').notEmpty().withMessage('Payment status is required'),
  check('updateTime').notEmpty().withMessage('Update time is required')
];

// Routes
router.route('/')
  .post(validate(orderValidation), createOrder)
  .get(protect, admin, getOrders);

router.route('/myorders')
  .get(protect, getMyOrders);

router.route('/:id')
  .get(getOrderById);

router.route('/:id/status')
  .put(protect, admin, validate(statusValidation), updateOrderStatus);

router.route('/:id/pay')
  .put(protect, admin, validate(paymentValidation), updateOrderPayment);

router.route('/:id/deliver')
  .put(protect, admin, updateOrderToDelivered);

router.route('/:id/cancel')
  .put(protect, cancelOrder);

module.exports = router;