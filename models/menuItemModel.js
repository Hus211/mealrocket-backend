const mongoose = require('mongoose');

const menuItemSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Please add a price'],
      min: [0, 'Price cannot be negative']
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Please select a category']
    },
    image: {
      type: String,
      default: 'https://res.cloudinary.com/dgdbxflan/image/upload/v1/mealrocket/default-food.jpg'
    },
    imagePublicId: {
      type: String,
      // Will store the Cloudinary public_id for image deletion
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 1,
      max: 5
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    options: {
      type: String,
      trim: true
    },
    nutritionalInfo: {
      calories: { type: Number },
      fat: { type: Number },
      protein: { type: Number },
      carbs: { type: Number }
    },
    allergens: [String],
    preparationTime: {
      type: Number, // in minutes
      default: 15
    },
    tags: [String]
  },
  {
    timestamps: true
  }
);

// Add indexes for better query performance
menuItemSchema.index({ name: 1 });
menuItemSchema.index({ category: 1 });
menuItemSchema.index({ price: 1 });
menuItemSchema.index({ isAvailable: 1 });
menuItemSchema.index({ isFeatured: 1 });

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

module.exports = MenuItem;