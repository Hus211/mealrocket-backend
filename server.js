const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config();

// Parse Cloudinary URL from environment if available
if (process.env.CLOUDINARY_URL) {
  const cloudinaryUrlRegex = /cloudinary:\/\/(\d+):([^@]+)@([^/]+)/;
  const match = process.env.CLOUDINARY_URL.match(cloudinaryUrlRegex);
  
  if (match) {
    process.env.CLOUDINARY_API_KEY = match[1];
    process.env.CLOUDINARY_API_SECRET = match[2];
    process.env.CLOUDINARY_CLOUD_NAME = match[3];
    console.log(`Cloudinary configuration loaded for ${process.env.CLOUDINARY_CLOUD_NAME}`);
  }
}

// Connect to database
connectDB();

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());

// Enable CORS
app.use(cors());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static folder for temporary uploads (used before Cloudinary upload)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/menu', require('./routes/menuRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/reservations', require('./routes/reservationRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/uploads', require('./routes/uploadRoutes'));

// Base route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the MealRocket API',
    version: '1.0.0'
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Set port and start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});