const mongoose = require('mongoose');

const orderItemSchema = mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  image: {
    type: String
  },
  options: {
    type: String,
    trim: true
  }
});

const orderSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // Not required, as guests can place orders too
    },
    orderItems: [orderItemSchema],
    shippingAddress: {
      fullName: {
        type: String,
        required: [true, 'Please provide full name']
      },
      phone: {
        type: String,
        required: [true, 'Please provide phone number']
      },
      email: {
        type: String,
        required: [true, 'Please provide email']
      },
      address: {
        type: String,
        required: [true, 'Please provide address']
      },
      city: {
        type: String
      },
      postalCode: {
        type: String
      },
      landmark: {
        type: String
      },
      deliveryInstructions: {
        type: String
      }
    },
    paymentMethod: {
      type: String,
      required: [true, 'Please select a payment method'],
      enum: ['cash', 'visa', 'airtel', 'mtn', 'zamtel']
    },
    paymentResult: {
      id: { type: String },
      status: { type: String },
      updateTime: { type: String },
      emailAddress: { type: String }
    },
    taxAmount: {
      type: Number,
      required: true,
      default: 0.0
    },
    shippingAmount: {
      type: Number,
      required: true,
      default: 0.0
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0.0
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false
    },
    paidAt: {
      type: Date
    },
    isDelivered: {
      type: Boolean,
      required: true,
      default: false
    },
    deliveredAt: {
      type: Date
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'processing', 'completed', 'cancelled'],
      default: 'pending'
    },
    estimatedDeliveryTime: {
      type: Date
    },
    specialInstructions: {
      type: String
    },
    mobileMoneyNumber: {
      type: String
    },
    orderType: {
      type: String,
      enum: ['delivery', 'pickup'],
      default: 'delivery'
    }
  },
  {
    timestamps: true
  }
);

// Add indexes for better query performance
orderSchema.index({ user: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ isPaid: 1 });
orderSchema.index({ isDelivered: 1 });
orderSchema.index({ 'shippingAddress.email': 1 });
orderSchema.index({ 'shippingAddress.phone': 1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;