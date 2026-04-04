const mongoose = require("mongoose");

const connectDB = async () => {
    const uri = process.env.MONGO_URL || process.env.MONGODB_URI;
    if (!uri) {
        throw new Error("Missing MONGO_URL (or MONGODB_URI) in environment variables.");
    }

    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 15000,
        });
        console.log("MongoDB connected");
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        throw error;
    }
};

module.exports = connectDB;
