// =======================================================
// FINAL AND CORRECT config/db.js
// =======================================================

const mongoose = require('mongoose');

const connectDB = async () => {
    // This function will now be called AFTER the .env file is loaded.
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected Successfully.');
    } catch (err) {
        console.error('MongoDB Connection Failed:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;