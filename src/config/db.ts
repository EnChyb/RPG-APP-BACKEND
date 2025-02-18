import "dotenv/config";
import mongoose from "mongoose";

const uri: string | undefined = process.env.MONGO_URI;

if (!uri) {
  throw new Error("MONGO_URI environment variable is not defined");
}

async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(uri as string);
    console.log("Database connection successful");
  } catch (error: any) {
    console.error("Database connection error:", error.message);
    process.exit(1);
  }
}

export default connectDB;
