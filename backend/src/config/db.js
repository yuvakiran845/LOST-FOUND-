const mongoose = require('mongoose');

// connectDB establishes a connection to MongoDB using the URI in .env
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    console.warn('⚠️  Server will continue running without a database connection.');
    console.warn('    Update MONGO_URI in .env with real credentials to enable DB features.');
  }
};

module.exports = connectDB;
