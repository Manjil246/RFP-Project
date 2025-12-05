// To use this run below commands in terminal
// npm install mongoose OR bun add mongoose
// npm install --save-dev @types/mongoose OR bun add -d @types/mongoose



import mongoose from "mongoose";
import { MONGO_URI } from "./imports";

export class MongoDB {
  private static instance: MongoDB;

  private constructor() {}

  public static getInstance(): MongoDB {
    if (!MongoDB.instance) {
      MongoDB.instance = new MongoDB();
    }
    return MongoDB.instance;
  }

  public async connect(): Promise<void> {
    try {
      await mongoose.connect(MONGO_URI);
      console.log("✅ Connected to MongoDB");

      mongoose.connection.on("error", (error) => {
        console.error("❌ MongoDB connection error:", error);
      });

      mongoose.connection.on("disconnected", () => {
        console.log("🔌 MongoDB disconnected");
      });
    } catch (error) {
      console.error("❌ Failed to connect to MongoDB:", error);
      process.exit(1);
    }
  }

  public async disconnect(): Promise<void> {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}
