import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load .env file for local development (won't override existing env vars)
dotenv.config({ path: ".env", override: false });

// Use environment variables (from .env or system env)
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_USER = process.env.DB_USER || "postgres";
const DB_PASSWORD = process.env.DB_PASSWORD || "postgres";
const DB_NAME = process.env.DB_NAME || "postgres";
const DB_PORT = parseInt(process.env.DB_PORT || "5432", 10);
const isSupabase = DB_HOST.includes("supabase.com");

// Use pooler connection only (as specified in DB_HOST and DB_PORT)
// For Supabase, database name should be "postgres", not DB_NAME
const databaseName = isSupabase ? "postgres" : DB_NAME;

export default defineConfig({
  schema: "./src/models/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: databaseName,
    ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
  },
  migrations: {
    table: "__drizzle_migrations",
    schema: "drizzle", // Use existing drizzle schema for migrations tracking
  },
});

