import type { Request, Response } from "express";
import { UserService } from "../services/userService.js";
import { config } from "../config/dotenvConfig.js";
import * as fs from "fs";

const userService = new UserService();

export const uploadCSV = async (req: Request, res: Response): Promise<void> => {
  try {
    const filePath = config.CSV_FILE_PATH;

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        success: false,
        message: `CSV file not found at path: ${filePath}`,
      });
      return;
    }


    // Process the CSV file and save JSON
    const result = await userService.processCSVFile(filePath, true);

    // Calculate and display age distribution
    await userService.displayAgeDistributionReport();

    res.status(200).json({
      success: true,
      message: "CSV file processed successfully",
      recordsProcessed: result.totalRecords,
      jsonOutputFile: result.jsonFilePath,
    });
  } catch (error) {
    console.error("Error uploading CSV:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process CSV file",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getAgeDistribution = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const distribution = await userService.calculateAgeDistribution();

    res.status(200).json({
      success: true,
      distribution,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
