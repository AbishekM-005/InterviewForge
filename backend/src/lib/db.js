import mongoose from "mongoose";
import ENV from "./env.js";

const connectDB = async () => {
  try {
    const conn = mongoose.connect(ENV.DB_URL);
    console.log("Connected successfully: ", conn);
  } catch (error) {
    console.error("Error connecting to MongoDB ", error);
    process.exit(1);
  }
};

export default connectDB;
