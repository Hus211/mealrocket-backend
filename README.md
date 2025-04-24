# MealRocket Backend API

Backend API for the MealRocket restaurant website, providing functionality for menu management, online ordering, table reservations, and customer contact.

## Features

- **Menu Management**: Categories and menu items with images
- **Online Ordering**: Complete checkout process with multiple payment methods
- **Table Reservations**: System with availability checking
- **Contact Form**: Customer message handling
- **User Authentication**: JWT-based authentication
- **Admin Dashboard**: For managing orders, reservations, and content

## Tech Stack

- **Node.js & Express**: API framework
- **MongoDB**: Database with Mongoose ODM
- **JWT**: Authentication
- **Express Validator**: Input validation
- **Multer**: File uploads
- **Bcrypt**: Password hashing
- **Helmet**: Security headers
- **Morgan**: Request logging

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm (v6+)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
```bash
git clone https://github.com/your-username/mealrocket-backend.git
cd mealrocket-backend
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env` file in the root directory with the following variables:
```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/mealrocket
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRE=30d
```

4. Create required directories
```bash
mkdir -p uploads/images logs
```

5. Run the server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will run on http://localhost:5000 (or the port you specified in the .env file).

## API Documentation

### Authentication Endpoints

| Method | Endpoint                 | Description                   | Access      |
|--------|--------------------------|-------------------------------|-------------|
| POST   | /api/auth/register       | Register a new user           | Public      |
| POST   | /api/auth/login          | Login user and get token      | Public      |
| GET    | /api/auth/profile        | Get user profile              | Private     |
| PUT    | /api/auth/profile        | Update user profile           | Private     |

### Menu Endpoints

| Method | Endpoint                 | Description                   | Access      |
|--------|--------------------------|-------------------------------|-------------|
| GET    | /api/categories          | Get all categories            | Public      |
| GET    | /api/menu                | Get all menu items            | Public      |
| GET    | /api/menu/category/:id   | Get menu items by category    | Public      |
| GET    | /api/menu/featured       | Get featured menu items       | Public      |

### Order Endpoints

| Method | Endpoint                 | Description                   | Access      |
|--------|--------------------------|-------------------------------|-------------|
| POST   | /api/orders              | Create a new order            | Public      |
| GET    | /api/orders/myorders     | Get user's orders             | Private     |
| GET    | /api/orders/:id          | Get order by ID               | Private/Token |

### Reservation Endpoints

| Method | Endpoint                   | Description                   | Access      |
|--------|----------------------------|-------------------------------|-------------|
| POST   | /api/reservations          | Create a new reservation      | Public      |
| GET    | /api/reservations/code/:code | Get reservation by code     | Public      |
| GET    | /api/reservations/availability/:date | Check availability  | Public      |

### Contact Endpoints

| Method | Endpoint                 | Description                   | Access      |
|--------|--------------------------|-------------------------------|-------------|
| POST   | /api/contact             | Submit a contact form         | Public      |

For complete API documentation with request/response examples, refer to the [API Documentation](docs/api.md).

## Project Structure

```
mealrocket-backend/
├── config/                  # Configuration files
├── controllers/             # Route controllers
├── middleware/              # Express middleware
├── models/                  # MongoDB schemas
├── routes/                  # API routes
├── uploads/                 # File upload directory
├── utils/                   # Utility functions
├── logs/                    # Application logs
├── .env                     # Environment variables
├── .gitignore               # Git ignore file
├── package.json             # Project dependencies
├── README.md                # Project documentation
└── server.js                # Application entry point
```

## Security

- Passwords are hashed using bcrypt
- JWT for secure authentication
- Input validation and sanitization
- Protection against common web vulnerabilities
- Secure file upload handling

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Developed to support the MealRocket restaurant website
- Designed with scalability and security in mind