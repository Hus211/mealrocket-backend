const path = require('path');
const fs = require('fs');
const asyncHandler = require('../middleware/asyncHandler');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const logger = require('../utils/logger');

/**
 * @desc    Upload image to Cloudinary
 * @route   POST /api/uploads
 * @access  Private/Admin
 */
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  try {
    // Upload file to Cloudinary
    const result = await uploadToCloudinary(req.file.path, {
      resource_type: 'image',
      // Optional: Add transformations or other Cloudinary options here
    });

    // Remove temporary file from local storage after upload
    fs.unlinkSync(req.file.path);

    // Return Cloudinary URL and details
    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        filename: path.basename(result.secure_url),
        path: result.secure_url,
        publicId: result.public_id,
        mimetype: req.file.mimetype,
        size: result.bytes
      }
    });
  } catch (error) {
    // If Cloudinary upload fails, ensure temporary file is removed
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    logger.error('Image upload failed', { error: error.message });
    res.status(500);
    throw new Error(`Image upload failed: ${error.message}`);
  }
});

/**
 * @desc    Delete image from Cloudinary
 * @route   DELETE /api/uploads/:publicId
 * @access  Private/Admin
 */
const deleteImage = asyncHandler(async (req, res) => {
  const { publicId } = req.params;

  if (!publicId) {
    res.status(400);
    throw new Error('Public ID is required');
  }

  try {
    // Delete file from Cloudinary
    const result = await deleteFromCloudinary(publicId);

    if (result.result !== 'ok') {
      res.status(404);
      throw new Error('File not found or could not be deleted');
    }

    res.json({
      success: true,
      message: 'File deleted successfully',
      data: {}
    });
  } catch (error) {
    logger.error('Image deletion failed', { error: error.message });
    res.status(error.statusCode || 500);
    throw new Error(`Image deletion failed: ${error.message}`);
  }
});

module.exports = {
  uploadImage,
  deleteImage
};