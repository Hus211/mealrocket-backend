const asyncHandler = require('../middleware/asyncHandler');
const Contact = require('../models/contactModel');

/**
 * @desc    Submit a contact form
 * @route   POST /api/contact
 * @access  Public
 */
const submitContactForm = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  // Create contact message
  const contact = new Contact({
    name,
    email,
    phone,
    subject,
    message,
    status: 'unread',
    ipAddress: req.ip,
    user: req.user ? req.user._id : null // If user is logged in
  });

  const createdContact = await contact.save();

  res.status(201).json({
    success: true,
    data: createdContact
  });
});

/**
 * @desc    Get all contact messages (admin)
 * @route   GET /api/contact
 * @access  Private/Admin
 */
const getContactMessages = asyncHandler(async (req, res) => {
  // Parse query parameters
  const status = req.query.status || null;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const startIndex = (page - 1) * limit;

  // Build query
  const query = {};
  if (status) {
    query.status = status;
  }

  // Execute query with pagination
  const messages = await Contact.find(query)
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  // Get total count for pagination
  const total = await Contact.countDocuments(query);

  res.json({
    success: true,
    count: messages.length,
    total,
    pagination: {
      page,
      limit,
      pages: Math.ceil(total / limit)
    },
    data: messages
  });
});

/**
 * @desc    Get contact message by ID
 * @route   GET /api/contact/:id
 * @access  Private/Admin
 */
const getContactMessageById = asyncHandler(async (req, res) => {
  const message = await Contact.findById(req.params.id);

  if (!message) {
    res.status(404);
    throw new Error('Message not found');
  }

  // If message is unread, mark as read
  if (message.status === 'unread') {
    message.status = 'read';
    await message.save();
  }

  res.json({
    success: true,
    data: message
  });
});

/**
 * @desc    Update contact message status
 * @route   PUT /api/contact/:id/status
 * @access  Private/Admin
 */
const updateContactStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!status) {
    res.status(400);
    throw new Error('Status is required');
  }

  const message = await Contact.findById(req.params.id);

  if (!message) {
    res.status(404);
    throw new Error('Message not found');
  }

  // Update message status
  message.status = status;

  const updatedMessage = await message.save();

  res.json({
    success: true,
    data: updatedMessage
  });
});

/**
 * @desc    Reply to a contact message
 * @route   POST /api/contact/:id/reply
 * @access  Private/Admin
 */
const replyToContactMessage = asyncHandler(async (req, res) => {
  const { responseMessage } = req.body;

  if (!responseMessage) {
    res.status(400);
    throw new Error('Response message is required');
  }

  const message = await Contact.findById(req.params.id);

  if (!message) {
    res.status(404);
    throw new Error('Message not found');
  }

  // Update message with response
  message.responseMessage = responseMessage;
  message.respondedAt = Date.now();
  message.respondedBy = req.user._id;
  message.status = 'replied';

  const updatedMessage = await message.save();

  res.json({
    success: true,
    data: updatedMessage
  });
});

/**
 * @desc    Delete a contact message
 * @route   DELETE /api/contact/:id
 * @access  Private/Admin
 */
const deleteContactMessage = asyncHandler(async (req, res) => {
  const message = await Contact.findById(req.params.id);

  if (!message) {
    res.status(404);
    throw new Error('Message not found');
  }

  await message.deleteOne();

  res.json({
    success: true,
    message: 'Contact message removed',
    data: {}
  });
});

module.exports = {
  submitContactForm,
  getContactMessages,
  getContactMessageById,
  updateContactStatus,
  replyToContactMessage,
  deleteContactMessage
};