const asyncHandler = require('../middleware/asyncHandler');
const Reservation = require('../models/reservationModel');

/**
 * @desc    Create a new reservation
 * @route   POST /api/reservations
 * @access  Public
 */
const createReservation = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    phone,
    date,
    time,
    guests,
    tablePreference,
    specialRequests,
    occasion,
    dietaryRestrictions
  } = req.body;

  // Validate date is not in the past
  const reservationDate = new Date(`${date}T${time}`);
  const now = new Date();
  
  if (reservationDate < now) {
    res.status(400);
    throw new Error('Reservation date and time must be in the future');
  }

  // Validate date is not more than 30 days in advance
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  
  if (reservationDate > maxDate) {
    res.status(400);
    throw new Error('Reservations can only be made up to 30 days in advance');
  }

  // Check if there are too many reservations for the same time slot
  // Assuming max 10 tables per time slot (arbitrary limit)
  const conflictingReservations = await Reservation.countDocuments({
    date: { $eq: new Date(date) },
    time,
    status: { $nin: ['cancelled'] }
  });

  if (conflictingReservations >= 10) {
    res.status(400);
    throw new Error('No availability for the selected time slot. Please choose another time.');
  }

  // Create reservation
  const reservation = new Reservation({
    name,
    email,
    phone,
    date: reservationDate,
    time,
    guests,
    tablePreference: tablePreference || 'any',
    specialRequests,
    occasion,
    dietaryRestrictions,
    status: 'pending',
    user: req.user ? req.user._id : null // If user is logged in
  });

  const createdReservation = await reservation.save();

  res.status(201).json({
    success: true,
    data: createdReservation
  });
});

/**
 * @desc    Get a reservation by ID
 * @route   GET /api/reservations/:id
 * @access  Private/Public with reservation token
 */
const getReservationById = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);

  if (!reservation) {
    res.status(404);
    throw new Error('Reservation not found');
  }

  // Check if user is authorized to view this reservation
  // Admin can view any reservation, user can view their own reservations,
  // or anyone can view with the correct reservation code
  const isAdmin = req.user && req.user.isAdmin;
  const isOwner = req.user && reservation.user && req.user._id.equals(reservation.user);
  const hasValidCode = req.query.code && req.query.code === reservation.confirmationCode;

  if (!isAdmin && !isOwner && !hasValidCode) {
    res.status(403);
    throw new Error('Not authorized to access this reservation');
  }

  res.json({
    success: true,
    data: reservation
  });
});

/**
 * @desc    Get reservation by confirmation code
 * @route   GET /api/reservations/code/:code
 * @access  Public
 */
const getReservationByCode = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findOne({
    confirmationCode: req.params.code
  });

  if (!reservation) {
    res.status(404);
    throw new Error('Reservation not found');
  }

  res.json({
    success: true,
    data: reservation
  });
});

/**
 * @desc    Get all reservations for a user
 * @route   GET /api/reservations/myreservations
 * @access  Private
 */
const getMyReservations = asyncHandler(async (req, res) => {
  const reservations = await Reservation.find({ user: req.user._id })
    .sort({ date: 1, time: 1 });

  res.json({
    success: true,
    count: reservations.length,
    data: reservations
  });
});

/**
 * @desc    Get all reservations (admin)
 * @route   GET /api/reservations
 * @access  Private/Admin
 */
const getReservations = asyncHandler(async (req, res) => {
  // Parse query parameters
  const status = req.query.status || null;
  const date = req.query.date || null;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const startIndex = (page - 1) * limit;

  // Build query
  const query = {};
  if (status) {
    query.status = status;
  }
  if (date) {
    // Filter by specific date (ignoring time)
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    query.date = { $gte: startDate, $lte: endDate };
  }

  // Execute query with pagination
  const reservations = await Reservation.find(query)
    .populate('user', 'id name email')
    .sort({ date: 1, time: 1 })
    .skip(startIndex)
    .limit(limit);

  // Get total count for pagination
  const total = await Reservation.countDocuments(query);

  res.json({
    success: true,
    count: reservations.length,
    total,
    pagination: {
      page,
      limit,
      pages: Math.ceil(total / limit)
    },
    data: reservations
  });
});

/**
 * @desc    Update reservation status
 * @route   PUT /api/reservations/:id/status
 * @access  Private/Admin
 */
const updateReservationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!status) {
    res.status(400);
    throw new Error('Status is required');
  }

  const reservation = await Reservation.findById(req.params.id);

  if (!reservation) {
    res.status(404);
    throw new Error('Reservation not found');
  }

  // Update reservation status
  reservation.status = status;

  const updatedReservation = await reservation.save();

  res.json({
    success: true,
    data: updatedReservation
  });
});

/**
 * @desc    Update a reservation (user)
 * @route   PUT /api/reservations/:id
 * @access  Private
 */
const updateReservation = asyncHandler(async (req, res) => {
  const {
    guests,
    date,
    time,
    tablePreference,
    specialRequests,
    occasion,
    dietaryRestrictions
  } = req.body;

  const reservation = await Reservation.findById(req.params.id);

  if (!reservation) {
    res.status(404);
    throw new Error('Reservation not found');
  }

  // Check if user is authorized to update this reservation
  const isAdmin = req.user && req.user.isAdmin;
  const isOwner = req.user && reservation.user && req.user._id.equals(reservation.user);
  const hasValidCode = req.query.code && req.query.code === reservation.confirmationCode;

  if (!isAdmin && !isOwner && !hasValidCode) {
    res.status(403);
    throw new Error('Not authorized to update this reservation');
  }

  // Only allow updates for pending and confirmed reservations
  if (!['pending', 'confirmed'].includes(reservation.status)) {
    res.status(400);
    throw new Error('This reservation cannot be updated');
  }

  // If updating date/time, validate they're not in the past
  if (date && time) {
    const reservationDate = new Date(`${date}T${time}`);
    const now = new Date();
    
    if (reservationDate < now) {
      res.status(400);
      throw new Error('Reservation date and time must be in the future');
    }
    
    // Validate date is not more than 30 days in advance
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    
    if (reservationDate > maxDate) {
      res.status(400);
      throw new Error('Reservations can only be made up to 30 days in advance');
    }

    reservation.date = reservationDate;
  } else if (date) {
    const reservationDate = new Date(date);
    reservationDate.setHours(
      reservation.date.getHours(),
      reservation.date.getMinutes()
    );
    
    const now = new Date();
    
    if (reservationDate < now) {
      res.status(400);
      throw new Error('Reservation date must be in the future');
    }
    
    // Validate date is not more than 30 days in advance
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    
    if (reservationDate > maxDate) {
      res.status(400);
      throw new Error('Reservations can only be made up to 30 days in advance');
    }

    reservation.date = reservationDate;
  }

  // Update other fields
  if (time) {
    reservation.time = time;
  }
  
  if (guests) {
    reservation.guests = guests;
  }

  if (tablePreference) {
    reservation.tablePreference = tablePreference;
  }

  if (specialRequests !== undefined) {
    reservation.specialRequests = specialRequests;
  }

  if (occasion !== undefined) {
    reservation.occasion = occasion;
  }

  if (dietaryRestrictions !== undefined) {
    reservation.dietaryRestrictions = dietaryRestrictions;
  }

  // Reset status to pending if date or time has changed
  if (date || time) {
    reservation.status = 'pending';
  }

  const updatedReservation = await reservation.save();

  res.json({
    success: true,
    data: updatedReservation
  });
});

/**
 * @desc    Cancel a reservation
 * @route   PUT /api/reservations/:id/cancel
 * @access  Private
 */
const cancelReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);

  if (!reservation) {
    res.status(404);
    throw new Error('Reservation not found');
  }

  // Check if user is authorized to cancel this reservation
  const isAdmin = req.user && req.user.isAdmin;
  const isOwner = req.user && reservation.user && req.user._id.equals(reservation.user);
  const hasValidCode = req.query.code && req.query.code === reservation.confirmationCode;

  if (!isAdmin && !isOwner && !hasValidCode) {
    res.status(403);
    throw new Error('Not authorized to cancel this reservation');
  }

  // Only allow cancellation of pending and confirmed reservations
  if (!['pending', 'confirmed'].includes(reservation.status)) {
    res.status(400);
    throw new Error('This reservation cannot be cancelled');
  }

  // Update reservation status
  reservation.status = 'cancelled';

  const updatedReservation = await reservation.save();

  res.json({
    success: true,
    data: updatedReservation
  });
});

/**
 * @desc    Get available time slots for a date
 * @route   GET /api/reservations/availability/:date
 * @access  Public
 */
const getAvailability = asyncHandler(async (req, res) => {
  const { date } = req.params;
  
  // Validate the date format
  if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    res.status(400);
    throw new Error('Please provide a valid date in YYYY-MM-DD format');
  }

  // Define all available time slots
  const allTimeSlots = [
    '12:00 PM', '12:30 PM', 
    '1:00 PM', '1:30 PM', 
    '2:00 PM', '2:30 PM',
    '6:00 PM', '6:30 PM', 
    '7:00 PM', '7:30 PM', 
    '8:00 PM', '8:30 PM',
    '9:00 PM'
  ];

  // Get the selected date and current date for comparison
  const selectedDate = new Date(date);
  selectedDate.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // If date is in the past, return no availability
  if (selectedDate < today) {
    return res.json({
      success: true,
      date,
      availableTimeSlots: [],
      message: 'Selected date is in the past'
    });
  }

  // If date is more than 30 days in the future, return no availability
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  maxDate.setHours(0, 0, 0, 0);
  
  if (selectedDate > maxDate) {
    return res.json({
      success: true,
      date,
      availableTimeSlots: [],
      message: 'Reservations can only be made up to 30 days in advance'
    });
  }

  // Get existing reservations for the date
  const reservations = await Reservation.find({
    date: {
      $gte: new Date(`${date}T00:00:00.000Z`),
      $lt: new Date(`${date}T23:59:59.999Z`)
    },
    status: { $ne: 'cancelled' }
  });

  // Count reservations for each time slot
  const reservationCounts = reservations.reduce((counts, reservation) => {
    const timeSlot = reservation.time;
    counts[timeSlot] = (counts[timeSlot] || 0) + 1;
    return counts;
  }, {});

  // Define maximum capacity per time slot (10 tables)
  const MAX_CAPACITY = 10;

  // Check availability for each time slot
  const availableTimeSlots = allTimeSlots.filter(timeSlot => {
    // If it's today, filter out past time slots
    if (selectedDate.getTime() === today.getTime()) {
      const [hour, minute] = timeSlot.includes('PM') 
        ? [parseInt(timeSlot.split(':')[0]) + 12, parseInt(timeSlot.split(':')[1])]
        : [parseInt(timeSlot.split(':')[0]), parseInt(timeSlot.split(':')[1])];
      
      const slotTime = new Date();
      slotTime.setHours(hour, minute, 0, 0);
      
      // Add 1 hour buffer for same-day reservations
      const currentTimePlusBuffer = new Date();
      currentTimePlusBuffer.setHours(currentTimePlusBuffer.getHours() + 1);
      
      if (slotTime < currentTimePlusBuffer) {
        return false;
      }
    }
    
    // Check if slot is at capacity
    return (reservationCounts[timeSlot] || 0) < MAX_CAPACITY;
  });

  res.json({
    success: true,
    date,
    availableTimeSlots
  });
});

module.exports = {
  createReservation,
  getReservationById,
  getReservationByCode,
  getMyReservations,
  getReservations,
  updateReservationStatus,
  updateReservation,
  cancelReservation,
  getAvailability
};