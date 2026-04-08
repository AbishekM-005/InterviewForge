import dns from "dns";
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

    if (ENV.DB_URL.startsWith("mongodb+srv://")) {
      const dnsServers = (process.env.MONGO_DNS_SERVERS || "1.1.1.1,8.8.8.8")
        .split(",")
        .map((server) => server.trim())
        .filter(Boolean);

      if (dnsServers.length > 0) {
        dns.setServers(dnsServers);
        console.log(`Using DNS servers for MongoDB SRV lookup: ${dnsServers.join(", ")}`);
      }
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
