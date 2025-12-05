import dotenv from "dotenv";

// Only load .env file if it exists (for local development)
// Don't override existing environment variables (from system env)
dotenv.config({ override: false });

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

// Server Configuration
export const PORT = parseInt(process.env.PORT || "3001", 10);
export const NODE_ENV = process.env.NODE_ENV || "development";

// Database Configuration
export const DB_USER = requireEnv("DB_USER");
export const DB_PASSWORD = requireEnv("DB_PASSWORD");
export const DB_PORT = parseInt(requireEnv("DB_PORT"), 10);
export const DB_NAME = requireEnv("DB_NAME");
export const DB_HOST = requireEnv("DB_HOST");

// Frontend URL
export const FRONTEND_BASE_URL =
  process.env.FRONTEND_BASE_URL || "http://localhost:5173";
export const BACKEND_BASE_URL =
  process.env.BACKEND_BASE_URL || "http://localhost:3001";

// OpenAI Configuration
export const OPENAI_API_KEY = requireEnv("OPENAI_API_KEY");

// Gmail SMTP Configuration
export const GMAIL_USER = requireEnv("GMAIL_USER");
export const GMAIL_APP_PASSWORD = requireEnv("GMAIL_APP_PASSWORD");

// Gmail API Configuration (for receiving emails)
export const GMAIL_CLIENT_ID = requireEnv("GMAIL_CLIENT_ID");
export const GMAIL_CLIENT_SECRET = requireEnv("GMAIL_CLIENT_SECRET");
export const GMAIL_REFRESH_TOKEN = requireEnv("GMAIL_REFRESH_TOKEN");

// Gmail Pub/Sub Configuration
export const GMAIL_TOPIC_NAME = requireEnv("GMAIL_TOPIC_NAME");
export const GMAIL_SUBSCRIPTION_NAME = requireEnv("GMAIL_SUBSCRIPTION_NAME");

// ngrok Configuration
export const NGROK_AUTHTOKEN = process.env.NGROK_AUTHTOKEN;
export const ENABLE_NGROK = process.env.ENABLE_NGROK === "true"; // Set to "true" to enable ngrok
