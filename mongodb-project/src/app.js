const express = require('express');
const { connectDB } = require('./db/connection');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Database connection
connectDB();

// Sample route
app.get('/', (req, res) => {
    res.send('Welcome to the MongoDB Project!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});