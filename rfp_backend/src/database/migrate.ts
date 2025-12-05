import { migrate } from "drizzle-orm/postgres-js/migrator";
import { connectDB, closeDB } from "./sql-db";

async function runMigrations() {
  try {
    console.log("🔄 Starting database migrations...");
    await connectDB();
    
    // Import db after connection
    const { db } = await import("./sql-db");
    
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("✅ Migrations completed successfully");
    
    await closeDB();
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    await closeDB();
    process.exit(1);
  }
}

runMigrations();

