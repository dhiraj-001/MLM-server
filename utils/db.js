import mongoose from "mongoose";
import { config } from "../config.js";

const connectDB = async () => {
  if (!config.mongoUri) {
    console.error("MongoDB URI is not defined");
  }

  try {
    const dbName = "mlm";
    // Remove trailing slash if present
    const uri = config.mongoUri.endsWith("/")
      ? config.mongoUri.slice(0, -1)
      : config.mongoUri;

    await mongoose.connect(uri, {
      dbName: dbName,
    });

    console.log("MongoDB Database Connected Successfully");
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
};

export default connectDB;
