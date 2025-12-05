import dotenv from "dotenv";
dotenv.config();

export const NODE_ENV = process.env.NODE_ENV || "development";
export const PORT = process.env.PORT!;
export const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL!;
export const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL!;
export const LOCAL_DEVELOPMENT_URL = process.env.LOCAL_DEVELOPMENT_URL!;

// For mongo DB
export const MONGO_URI = process.env.MONGO_URI!;

// For SQL Database
export const DB_HOSTNAME = process.env.DB_HOSTNAME!;
export const DB_PORT = process.env.DB_PORT!;
export const DB_USER = process.env.DB_USER!;
export const DB_PASSWORD = process.env.DB_PASSWORD!;
export const DB_NAME = process.env.DB_NAME!;
