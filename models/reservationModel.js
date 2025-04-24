const mongoose = require('mongoose');

const reservationSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email'
      ]
    },
    phone: {
      type: String,
      required: [true, 'Please provide your phone number'],
      trim: true
    },
    date: {
      type: Date,
      required: [true, 'Please select a date']
    },
    time: {
      type: String,
      required: [true, 'Please select a time']
    },
    guests: {
      type: Number,
      required: [true, 'Please specify number of guests'],
      min: [1, 'Number of guests must be at least 1'],
      max: [20, 'For parties larger than 20, please contact us directly']
    },
    tablePreference: {
      type: String,
      enum: ['indoor', 'outdoor', 'any'],
      default: 'any'
    },
    specialRequests: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending'
    },
    confirmationCode: {
      type: String,
      unique: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // Not required as guests can make reservations
    },
    occasion: {
      type: String,
      trim: true
    },
    dietaryRestrictions: {
      type: String,
      trim: true
    },
    reminderSent: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Add indexes for better query performance
reservationSchema.index({ date: 1, time: 1 });
reservationSchema.index({ status: 1 });
reservationSchema.index({ email: 1 });
reservationSchema.index({ phone: 1 });

// Add a pre-save hook to generate confirmation code if not provided
reservationSchema.pre('save', function(next) {
  // Only generate a new code if one doesn't exist
  if (!this.confirmationCode) {
    // Generate a random confirmation code: RES-XXXXX (where X is a digit)
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    this.confirmationCode = `RES-${randomNum}`;
  }
  next();
});

const Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = Reservation;