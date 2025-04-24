const asyncHandler = require('../middleware/asyncHandler');
const Order = require('../models/orderModel');
const MenuItem = require('../models/menuItemModel');

/**
 * @desc    Create a new order
 * @route   POST /api/orders
 * @access  Public
 */
const createOrder = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    taxAmount,
    shippingAmount,
    totalAmount,
    mobileMoneyNumber,
    specialInstructions,
    orderType
  } = req.body;

  // Validate required fields
  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items provided');
  }

  if (!shippingAddress) {
    res.status(400);
    throw new Error('No shipping address provided');
  }

  if (!paymentMethod) {
    res.status(400);
    throw new Error('No payment method provided');
  }

  // For mobile money payment methods, require mobile number
  if (['airtel', 'mtn', 'zamtel'].includes(paymentMethod) && !mobileMoneyNumber) {
    res.status(400);
    throw new Error('Mobile money number is required for this payment method');
  }

  // Validate and calculate prices for each item
  const itemsFromDB = await Promise.all(
    orderItems.map(async (item) => {
      const menuItem = await MenuItem.findById(item.menuItem);
      
      if (!menuItem) {
        res.status(404);
        throw new Error(`Menu item with ID ${item.menuItem} not found`);
      }
      
      if (!menuItem.isAvailable) {
        res.status(400);
        throw new Error(`${menuItem.name} is currently unavailable`);
      }
      
      return {
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
        image: menuItem.image,
        options: item.options || ''
      };
    })
  );

  // Calculate order amounts
  const itemsTotal = itemsFromDB.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Create order in database
  const order = new Order({
    user: req.user ? req.user._id : null,  // If user is logged in
    orderItems: itemsFromDB,
    shippingAddress,
    paymentMethod,
    taxAmount: taxAmount || 0,
    shippingAmount: shippingAmount || 0,
    totalAmount: totalAmount || itemsTotal + (taxAmount || 0) + (shippingAmount || 0),
    mobileMoneyNumber,
    specialInstructions,
    orderType: orderType || 'delivery'
  });

  // Set order status based on payment method
  if (paymentMethod === 'cash') {
    // For cash orders, no payment status needed
    order.status = 'processing';
  } else {
    // Online payments need verification
    order.status = 'pending';
  }

  // Set estimated delivery time (30 mins from now)
  const estimatedTime = new Date();
  estimatedTime.setMinutes(estimatedTime.getMinutes() + 30);
  order.estimatedDeliveryTime = estimatedTime;

  const createdOrder = await order.save();

  res.status(201).json({
    success: true,
    data: createdOrder
  });
});

/**
 * @desc    Get order by ID
 * @route   GET /api/orders/:id
 * @access  Private/Public with order token
 */
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if user is authorized to view this order
  // Admin can view any order, user can view their own orders,
  // or anyone can view with the correct orderToken
  const isAdmin = req.user && req.user.isAdmin;
  const isOwner = req.user && order.user && req.user._id.equals(order.user);
  const hasValidToken = req.query.token && req.query.token === order._id.toString().substring(0, 10);

  if (!isAdmin && !isOwner && !hasValidToken) {
    res.status(403);
    throw new Error('Not authorized to access this order');
  }

  res.json({
    success: true,
    data: order
  });
});

/**
 * @desc    Get all orders for a user
 * @route   GET /api/orders/myorders
 * @access  Private
 */
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: orders.length,
    data: orders
  });
});

/**
 * @desc    Get all orders (admin)
 * @route   GET /api/orders
 * @access  Private/Admin
 */
const getOrders = asyncHandler(async (req, res) => {
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
  const orders = await Order.find(query)
    .populate('user', 'id name email')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  // Get total count for pagination
  const total = await Order.countDocuments(query);

  res.json({
    success: true,
    count: orders.length,
    total,
    pagination: {
      page,
      limit,
      pages: Math.ceil(total / limit)
    },
    data: orders
  });
});

/**
 * @desc    Update order status
 * @route   PUT /api/orders/:id/status
 * @access  Private/Admin
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!status) {
    res.status(400);
    throw new Error('Status is required');
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Update order status
  order.status = status;

  // Update related fields based on status
  if (status === 'completed') {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
  }

  const updatedOrder = await order.save();

  res.json({
    success: true,
    data: updatedOrder
  });
});

/**
 * @desc    Update order payment status
 * @route   PUT /api/orders/:id/pay
 * @access  Private/Admin
 */
const updateOrderPayment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Update payment details
  order.isPaid = true;
  order.paidAt = Date.now();
  order.paymentResult = {
    id: req.body.id,
    status: req.body.status,
    updateTime: req.body.updateTime,
    emailAddress: req.body.emailAddress
  };

  // If order was pending because of payment, update to processing
  if (order.status === 'pending') {
    order.status = 'processing';
  }

  const updatedOrder = await order.save();

  res.json({
    success: true,
    data: updatedOrder
  });
});

/**
 * @desc    Update order to delivered
 * @route   PUT /api/orders/:id/deliver
 * @access  Private/Admin
 */
const updateOrderToDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  order.isDelivered = true;
  order.deliveredAt = Date.now();
  order.status = 'completed';

  const updatedOrder = await order.save();

  res.json({
    success: true,
    data: updatedOrder
  });
});

/**
 * @desc    Cancel an order
 * @route   PUT /api/orders/:id/cancel
 * @access  Private
 */
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Only allow cancellation of pending or processing orders
  if (!['pending', 'processing'].includes(order.status)) {
    res.status(400);
    throw new Error('This order cannot be cancelled');
  }

  // Check if user is authorized to cancel this order
  const isAdmin = req.user && req.user.isAdmin;
  const isOwner = req.user && order.user && req.user._id.equals(order.user);

  if (!isAdmin && !isOwner) {
    res.status(403);
    throw new Error('Not authorized to cancel this order');
  }

  // Update order status
  order.status = 'cancelled';

  const updatedOrder = await order.save();

  res.json({
    success: true,
    data: updatedOrder
  });
});

module.exports = {
  createOrder,
  getOrderById,
  getMyOrders,
  getOrders,
  updateOrderStatus,
  updateOrderPayment,
  updateOrderToDelivered,
  cancelOrder
};