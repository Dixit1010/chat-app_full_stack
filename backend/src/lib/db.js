import mongoose from "mongoose";
import dns from "node:dns";

// Node's default resolver (127.0.0.1) refuses raw DNS queries on this network/VPN,
// which breaks the mongodb+srv:// lookup even though the OS resolver works fine.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.log("MongoDB connection error:", error);
  }
};
