import mongoose from "mongoose";
import ENV from "./env.js";

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState >= 1) {
      return mongoose.connection;
    }

    if (!ENV.DB_URL) {
      throw new Error("DB_URL is not defined in env ");
    }

    const conn = await mongoose.connect(ENV.DB_URL);
    console.log(`Connected to MongoDB: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error("Error connecting to MongoDB ", error);
    throw error;
  }
};

export default connectDB;
