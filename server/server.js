const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const { loadDummyDataMongo, loadDummyDataMemory } = require('./dummyData');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pet-adoption', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('Connected to MongoDB');
  await loadDummyDataMongo();
})
.catch(async err => {
  console.error('MongoDB connection error:', err.message);
  console.log('⚠️  MongoDB is not running. Some features will be limited.');
  console.log('📝 To install MongoDB:');
  console.log('   1. Download from: https://www.mongodb.com/try/download/community');
  console.log('   2. Or use Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest');
  loadDummyDataMemory();
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Pet Adoption API is running!' });
});

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/pets', require('./routes/pets'));
app.use('/api/adoptions', require('./routes/adoptions'));
app.use('/api/discounts', require('./routes/discounts'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/adoption-messages', require('./routes/adoptionMessages'));
// app.use('/api/users', require('./routes/users'));

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  // Allow client to identify as user for direct messages
  socket.on('auth:identify', (userId) => {
    try {
      socket.join(String(userId));
    } catch (e) {}
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5050;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API URL: http://localhost:${PORT}`);
  console.log(`Socket.io is running on: http://localhost:${PORT}`);
});

module.exports = { app, io }; 