const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017'; // Replace with your MongoDB connection string
const dbName = 'yourDatabaseName'; // Replace with your database name

const connectDB = async () => {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();
        console.log('Connected to MongoDB');
        const db = client.db(dbName);
        return db;
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw error;
    } finally {
        // Uncomment the following line if you want to close the connection after the operation
        // await client.close();
    }
};

module.exports = connectDB;