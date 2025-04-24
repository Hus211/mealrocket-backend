const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

// Configure Cloudinary with credentials from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true // Use HTTPS
});

/**
 * Upload a file to Cloudinary
 * @param {String} filePath - Local path to the file
 * @param {Object} options - Upload options
 * @returns {Promise} - Cloudinary upload result
 */
const uploadToCloudinary = async (filePath, options = {}) => {
  try {
    // Set default options
    const uploadOptions = {
      folder: 'mealrocket', // Store all uploads in a folder
      ...options
    };

    // Upload file to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, uploadOptions);
    return result;
  } catch (error) {
    logger.error('Cloudinary upload error', { error: error.message });
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

/**
 * Delete a file from Cloudinary
 * @param {String} publicId - Cloudinary public ID of the file
 * @returns {Promise} - Cloudinary deletion result
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    logger.error('Cloudinary delete error', { error: error.message });
    throw new Error(`Cloudinary delete failed: ${error.message}`);
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary
};