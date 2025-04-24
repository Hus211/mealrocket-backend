const mongoose = require('mongoose');
const categorySchema = mongoose.Schema(
{
  name: {
    type: String,
    required: [true, 'Please add a category name'],
    trim: true,
    unique: true  // This already creates an index
  },
  slug: {
    type: String,
    required: true,
    unique: true,  // This already creates an index
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  }
},
{
  timestamps: true
}
);

// Remove these duplicate index declarations
// categorySchema.index({ name: 1 });
// categorySchema.index({ slug: 1 });

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;