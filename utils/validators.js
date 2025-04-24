const { check } = require('express-validator');

/**
 * Common validation functions to be reused across the application
 */

// User validation rules
const userValidationRules = {
  name: check('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .trim(),
  
  email: check('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  
  password: check('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  optionalPassword: check('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  phone: check('phone')
    .optional()
    .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
    .withMessage('Please enter a valid phone number')
    .trim()
};

// Menu validation rules
const menuValidationRules = {
  name: check('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .trim(),
  
  description: check('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters')
    .trim(),
  
  price: check('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  categoryId: check('category')
    .notEmpty()
    .withMessage('Category is required')
    .isMongoId()
    .withMessage('Category must be a valid ID')
};

// Reservation validation rules
const reservationValidationRules = {
  name: check('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .trim(),
  
  email: check('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  
  phone: check('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
    .withMessage('Please enter a valid phone number')
    .trim(),
  
  date: check('date')
    .notEmpty()
    .withMessage('Date is required')
    .isDate()
    .withMessage('Please enter a valid date'),
  
  time: check('time')
    .notEmpty()
    .withMessage('Time is required')
    .matches(/^(1[0-2]|0?[1-9]):[0-5][0-9] (AM|PM)$/)
    .withMessage('Please enter a valid time (e.g. 7:30 PM)'),
  
  guests: check('guests')
    .notEmpty()
    .withMessage('Number of guests is required')
    .isInt({ min: 1, max: 20 })
    .withMessage('Number of guests must be between 1 and 20')
};

// Order validation rules
const orderValidationRules = {
  orderItems: check('orderItems')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  
  menuItemId: check('orderItems.*.menuItem')
    .notEmpty()
    .withMessage('Menu item ID is required')
    .isMongoId()
    .withMessage('Menu item ID must be valid'),
  
  quantity: check('orderItems.*.quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  
  fullName: check('shippingAddress.fullName')
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  
  phoneNumber: check('shippingAddress.phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
    .withMessage('Please enter a valid phone number'),
  
  emailAddress: check('shippingAddress.email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address'),
  
  deliveryAddress: check('shippingAddress.address')
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),
  
  paymentMethod: check('paymentMethod')
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['cash', 'visa', 'airtel', 'mtn', 'zamtel'])
    .withMessage('Invalid payment method'),
  
  mobileMoneyNumber: check('mobileMoneyNumber')
    .if((value, { req }) => ['airtel', 'mtn', 'zamtel'].includes(req.body.paymentMethod))
    .notEmpty()
    .withMessage('Mobile money number is required for this payment method')
    .matches(/^[0-9]{9,12}$/)
    .withMessage('Please enter a valid mobile money number')
};

// Contact form validation rules
const contactValidationRules = {
  name: check('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .trim(),
  
  email: check('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  
  phone: check('phone')
    .optional()
    .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
    .withMessage('Please enter a valid phone number')
    .trim(),
  
  subject: check('subject')
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Subject must be between 2 and 100 characters')
    .trim(),
  
  message: check('message')
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Message must be between 10 and 1000 characters')
    .trim()
};

// Utility function to create validation chains for different scenarios
const createValidationFor = (type) => {
  switch (type) {
    case 'register':
      return [
        userValidationRules.name,
        userValidationRules.email,
        userValidationRules.password,
        userValidationRules.phone
      ];
    
    case 'login':
      return [
        userValidationRules.email,
        userValidationRules.password
      ];
    
    case 'updateUser':
      return [
        userValidationRules.name.optional(),
        userValidationRules.email.optional(),
        userValidationRules.optionalPassword,
        userValidationRules.phone
      ];
    
    case 'createMenuItem':
      return [
        menuValidationRules.name,
        menuValidationRules.description,
        menuValidationRules.price,
        menuValidationRules.categoryId
      ];
    
    case 'createReservation':
      return [
        reservationValidationRules.name,
        reservationValidationRules.email,
        reservationValidationRules.phone,
        reservationValidationRules.date,
        reservationValidationRules.time,
        reservationValidationRules.guests
      ];
    
    case 'createOrder':
      return [
        orderValidationRules.orderItems,
        orderValidationRules.menuItemId,
        orderValidationRules.quantity,
        orderValidationRules.fullName,
        orderValidationRules.phoneNumber,
        orderValidationRules.emailAddress,
        orderValidationRules.deliveryAddress,
        orderValidationRules.paymentMethod,
        orderValidationRules.mobileMoneyNumber
      ];
    
    case 'contactForm':
      return [
        contactValidationRules.name,
        contactValidationRules.email,
        contactValidationRules.phone,
        contactValidationRules.subject,
        contactValidationRules.message
      ];
    
    default:
      return [];
  }
};

module.exports = {
  userValidationRules,
  menuValidationRules,
  reservationValidationRules,
  orderValidationRules,
  contactValidationRules,
  createValidationFor
};