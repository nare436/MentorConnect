// MongoDB connection file
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Get MongoDB URI from environment variable or use default
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/obsidian_circle';
    
    await mongoose.connect(mongoURI);
    
    console.log(' MongoDB Connected Successfully');
    console.log(` Database: ${mongoose.connection.name}`);
    
  } catch (err) {
    console.error(' MongoDB Connection Error:', err.message);
    process.exit(1); // Exit process with failure
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log(' Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error(' Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log(' Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log(' MongoDB connection closed due to app termination');
  process.exit(0);
});

module.exports = connectDB;