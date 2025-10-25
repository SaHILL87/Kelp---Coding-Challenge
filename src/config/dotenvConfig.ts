import dotenv from "dotenv";

dotenv.config();

interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  CSV_FILE_PATH: string;
}

function validateEnv(): EnvConfig {
  const requiredEnvVars = [
    "PORT",
    "NODE_ENV",
    "DB_HOST",
    "DB_PORT",
    "DB_NAME",
    "DB_USER",
    "DB_PASSWORD",
    "CSV_FILE_PATH",
  ];

  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar]
  );

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingEnvVars.join(", ")}\n` +
        `Please check your .env file.`
    );
  }

  return {
    PORT: parseInt(process.env.PORT!, 10),
    NODE_ENV: process.env.NODE_ENV!,
    DB_HOST: process.env.DB_HOST!,
    DB_PORT: parseInt(process.env.DB_PORT!, 10),
    DB_NAME: process.env.DB_NAME!,
    DB_USER: process.env.DB_USER!,
    DB_PASSWORD: process.env.DB_PASSWORD!,
    CSV_FILE_PATH: process.env.CSV_FILE_PATH!,
  };
}

export const config = validateEnv();
