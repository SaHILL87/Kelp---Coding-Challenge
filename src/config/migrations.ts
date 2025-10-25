import { pool } from "./dbConfig.js";

export async function runMigrations(): Promise<void> {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS public.users (
      id SERIAL PRIMARY KEY,
      name VARCHAR NOT NULL,
      age INT NOT NULL,
      address JSONB NULL,
      additional_info JSONB NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(createTableQuery);
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}
