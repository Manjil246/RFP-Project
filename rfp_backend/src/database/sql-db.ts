import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { DB_USER, DB_PASSWORD, DB_PORT, DB_NAME, DB_HOST } from "../config/env";
import * as schema from "../models";

// Determine database name based on host (Supabase uses "postgres" as database name)
const isSupabase = DB_HOST?.includes("supabase.com");
const databaseName = isSupabase ? "postgres" : DB_NAME;

// Create postgres client with production-ready connection options
const client = postgres({
  host: DB_HOST,
  port: DB_PORT,
  database: databaseName,
  username: DB_USER,
  password: DB_PASSWORD,
  ssl: isSupabase ? "require" : false,
  max: 10,
  idle_timeout: 20,
  connect_timeout: 60, // Increased for network latency
  onnotice: () => {}, // Suppress notices in production
});

// Create Drizzle database instance
export const db = drizzle(client, { schema });

// Export postgres client for raw SQL queries
export const postgresClient = client;

export const connectDB = async () => {
  try {
    await client`SELECT 1`;
    console.log("✅ Database connection established");
  } catch (err: any) {
    console.error("❌ Database connection failed:", err.message);
    console.error("❌ Connection details:", {
      host: DB_HOST,
      port: DB_PORT,
      database: databaseName,
      user: DB_USER?.substring(0, 10) + "...",
    });
    throw new Error(`Database connection failed: ${err.message}`);
  }
};

export const closeDB = async () => {
  await client.end();
};

export default db;
