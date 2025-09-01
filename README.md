# Pet Adoption Website - MERN Stack

A full-stack pet adoption platform built with MongoDB, Express.js, React.js, and Node.js.

## Features (Planned)

### Sprint 1
- Add new pet listing with image upload
- Show latest available pets with automatic updates
- Pet details: name, age, breed, vaccination info, health status

### Sprint 2
- Set adoption status with one-click updates
- Search for pets with advanced filters
- Wishlist functionality

### Sprint 3
- Apply for adoption with detailed forms
- Real-time communication via chatbox
- Review and rating system (1-5 stars)

### Sprint 4
- Average rating display on user profiles
- AI chatbot integration

## Tech Stack

- **Frontend**: React.js, Material-UI, Socket.io-client
- **Backend**: Node.js, Express.js, Socket.io
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcryptjs
- **File Upload**: Multer with Cloudinary
- **Real-time**: Socket.io

## Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB (local or Atlas)

### Backend Setup
```bash
cd server
npm install
npm run dev
```

### Frontend Setup
```bash
cd client
npm install
npm start
```

## Environment Variables

Create `.env` files in both `server` and `client` directories:

### Server (.env)
```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

### Client (.env)
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
```

## Project Structure

```
pet-adoption-website/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── utils/         # Utility functions
│   │   └── App.js
│   └── package.json
├── server/                 # Node.js backend
│   ├── controllers/       # Route controllers
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── config/          # Configuration files
│   ├── server.js        # Main server file
│   └── package.json
└── README.md
```

## Cross-Platform Compatibility

This project is designed to run on both macOS and Windows without any modifications. All dependencies and configurations are cross-platform compatible.

## Development

- Backend runs on: http://localhost:5000
- Frontend runs on: http://localhost:3000
- MongoDB connection (configure in .env)

## License

MIT License 