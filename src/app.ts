import express from "express";
import cors from "cors";
import { testDatabaseConnection } from "./config/dbConfig.js";
import { config } from "./config/dotenvConfig.js";
import { runMigrations } from "./config/migrations.js";
import { UserService } from "./services/userService.js";
import * as fs from "fs";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Start server
async function startServer() {
  try {

    // Test database connection
    await testDatabaseConnection();

    // Run database migrations
    await runMigrations();

    // Check if CSV file exists
    const csvFilePath = config.CSV_FILE_PATH;

    if (fs.existsSync(csvFilePath)) {

      const userService = new UserService();

      // Process CSV and insert into database
      const result = await userService.processCSVFile(csvFilePath, true);

      // Display age distribution report
      await userService.displayAgeDistributionReport();

      // Drop table after displaying report
      await userService.dropTable();

    } else {
      console.log(`\nWarning: CSV file not found at ${csvFilePath}`);
      console.log("Skipping CSV processing\n");
    }

    // Start HTTP server
    app.listen(config.PORT, () => {
      
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
}

startServer();
