const express = require('express');
const {
  createReservation,
  getReservationById,
  getReservationByCode,
  getMyReservations,
  getReservations,
  updateReservationStatus,
  updateReservation,
  cancelReservation,
  getAvailability
} = require('../controllers/reservationController');
const { protect, admin } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { check } = require('express-validator');

const router = express.Router();

// Validation rules
const reservationValidation = [
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
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
    .withMessage('Please enter a valid phone number'),
  
  check('date')
    .notEmpty()
    .withMessage('Date is required')
    .isDate()
    .withMessage('Please enter a valid date'),
  
  check('time')
    .notEmpty()
    .withMessage('Time is required')
    .matches(/^(1[0-2]|0?[1-9]):[0-5][0-9] (AM|PM)$/)
    .withMessage('Please enter a valid time (e.g. 7:30 PM)'),
  
  check('guests')
    .notEmpty()
    .withMessage('Number of guests is required')
    .isInt({ min: 1, max: 20 })
    .withMessage('Number of guests must be between 1 and 20'),
  
  check('tablePreference')
    .optional()
    .isIn(['indoor', 'outdoor', 'any'])
    .withMessage('Table preference must be indoor, outdoor, or any'),
  
  check('specialRequests')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Special requests cannot exceed 500 characters'),
  
  check('occasion')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Occasion cannot exceed 100 characters'),
  
  check('dietaryRestrictions')
    .optional()
    .isLength({ max: 300 })
    .withMessage('Dietary restrictions cannot exceed 300 characters')
];

// Status update validation
const statusValidation = [
  check('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['pending', 'confirmed', 'cancelled', 'completed'])
    .withMessage('Invalid status')
];

// Reservation update validation (less strict than creation)
const reservationUpdateValidation = [
  check('guests')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Number of guests must be between 1 and 20'),
  
  check('date')
    .optional()
    .isDate()
    .withMessage('Please enter a valid date'),
  
  check('time')
    .optional()
    .matches(/^(1[0-2]|0?[1-9]):[0-5][0-9] (AM|PM)$/)
    .withMessage('Please enter a valid time (e.g. 7:30 PM)'),
  
  check('tablePreference')
    .optional()
    .isIn(['indoor', 'outdoor', 'any'])
    .withMessage('Table preference must be indoor, outdoor, or any'),
  
  check('specialRequests')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Special requests cannot exceed 500 characters'),
  
  check('occasion')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Occasion cannot exceed 100 characters'),
  
  check('dietaryRestrictions')
    .optional()
    .isLength({ max: 300 })
    .withMessage('Dietary restrictions cannot exceed 300 characters')
];

// Routes
router.route('/')
  .post(validate(reservationValidation), createReservation)
  .get(protect, admin, getReservations);

router.route('/availability/:date')
  .get(getAvailability);

router.route('/myreservations')
  .get(protect, getMyReservations);

router.route('/code/:code')
  .get(getReservationByCode);

router.route('/:id')
  .get(getReservationById)
  .put(validate(reservationUpdateValidation), updateReservation);

router.route('/:id/status')
  .put(protect, admin, validate(statusValidation), updateReservationStatus);

router.route('/:id/cancel')
  .put(cancelReservation);

module.exports = router;