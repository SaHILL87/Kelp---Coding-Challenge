import { Pool } from "pg";
import { config } from "./dotenvConfig.js";

export const pool = new Pool({
  host: config.DB_HOST,
  port: config.DB_PORT,
  database: config.DB_NAME,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("error", (err) => {
  console.error("Database error:", err);
  process.exit(-1);
});

export async function testDatabaseConnection(): Promise<void> {
  try {
    const client = await pool.connect();
    console.log("Database connected");
    client.release();
  } catch (error) {
    console.error("Database connection failed:", error);
    throw error;
  }
}
