import { pool } from "../config/dbConfig.js";
import { CSVParser } from "../utils/csvParser.js";
import type { PoolClient } from "pg";

interface ProcessedUser {
  name: string;
  age: number;
  address: object | null;
  additional_info: object | null;
}

interface AgeDistribution {
  "< 20": number;
  "20-40": number;
  "40-60": number;
  "> 60": number;
}

export class UserService {
  private parser: CSVParser;
  private readonly BATCH_SIZE = 1000;

  constructor() {
    this.parser = new CSVParser();
  }

  /**
   * Transform parsed CSV record to database format
   */
  private transformRecord(record: any): ProcessedUser {
    const firstName = record.name?.firstName?.trim() || "";
    const lastName = record.name?.lastName?.trim() || "";
    const age = record.age;

    const fullName = `${firstName} ${lastName}`.trim();
    const parsedAge = typeof age === "string" ? parseInt(age, 10) : age;


    const addressData = record.address || null;
    const additionalInfo: any = {};

    for (const key in record) {
      if (key !== "name" && key !== "age" && key !== "address") {
        additionalInfo[key] = record[key];
      }
    }

    const finalAdditionalInfo =
      Object.keys(additionalInfo).length > 0 ? additionalInfo : null;

    return {
      name: fullName,
      age: parsedAge,
      address: addressData,
      additional_info: finalAdditionalInfo,
    };
  }


  private async insertBatch(
    records: ProcessedUser[],
    client: PoolClient
  ): Promise<void> {
    if (records.length === 0) return;

    const values: any[] = [];
    const placeholders: string[] = [];

    records.forEach((record, index) => {
      const offset = index * 4;
      placeholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`
      );
      values.push(
        record.name,
        record.age,
        record.address ? JSON.stringify(record.address) : null,
        record.additional_info ? JSON.stringify(record.additional_info) : null
      );
    });

    const query = `
      INSERT INTO users (name, age, address, additional_info)
      VALUES ${placeholders.join(", ")}
    `;

    await client.query(query, values);
  }

  async processCSVFile(
    filePath: string,
    saveJSON: boolean = true
  ): Promise<{
    totalRecords: number;
    jsonFilePath: string | null;
  }> {
    let batch: ProcessedUser[] = [];
    let totalRecords = 0;
    let jsonFilePath: string | null = null;

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      if (saveJSON) {
        jsonFilePath = await this.parser.parseAndSaveJSON(filePath, "output");
      }
      for await (const record of this.parser.streamParseFile(filePath)) {
        try {
          const transformed = this.transformRecord(record);
          batch.push(transformed);

          if (batch.length >= this.BATCH_SIZE) {
            await this.insertBatch(batch, client);
            totalRecords += batch.length;

           

            batch = [];
          }
        } catch (error) {
          console.error(`Skipping invalid record:`, error);
        }
      }

      if (batch.length > 0) {
        await this.insertBatch(batch, client);
        totalRecords += batch.length;
      }

      await client.query("COMMIT");

     

      return { totalRecords, jsonFilePath };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Processing failed:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  async calculateAgeDistribution(): Promise<AgeDistribution> {
    const query = `
      SELECT 
        COUNT(*) FILTER (WHERE age < 20) as under_20,
        COUNT(*) FILTER (WHERE age >= 20 AND age < 40) as age_20_40,
        COUNT(*) FILTER (WHERE age >= 40 AND age < 60) as age_40_60,
        COUNT(*) FILTER (WHERE age >= 60) as over_60
      FROM users
    `;

    const result = await pool.query(query);
    const row = result.rows[0];

    const distribution: AgeDistribution = {
      "< 20": parseInt(row?.under_20 || "0", 10),
      "20-40": parseInt(row?.age_20_40 || "0", 10),
      "40-60": parseInt(row?.age_40_60 || "0", 10),
      "> 60": parseInt(row?.over_60 || "0", 10),
    };

    return distribution;
  }

  async displayAgeDistributionReport(): Promise<void> {
    console.log("\n" + "=".repeat(50));
    console.log("AGE DISTRIBUTION REPORT");
    console.log("=".repeat(50));

    const distribution = await this.calculateAgeDistribution();
    const total = Object.values(distribution).reduce(
      (sum, count) => sum + count,
      0
    );

    if (total === 0) {
      console.log("No records found");
      console.log("=".repeat(50) + "\n");
      return;
    }

    console.log("\nAge Group       | Percentage");
    console.log("-".repeat(50));

    for (const [ageGroup, count] of Object.entries(distribution)) {
      const percentage = ((count / total) * 100).toFixed(2);
      console.log(`${ageGroup.padEnd(15)} | ${percentage.padStart(6)}%`);
    }

    console.log("-".repeat(50));
    console.log(`Total Users: ${total.toLocaleString()}`);
    console.log("=".repeat(50) + "\n");
  }


  async dropTable(): Promise<void> {
    try {
      await pool.query("DROP TABLE users");
    } catch (error) {
      console.error("Failed to drop table:", error);
      throw error;
    }
  }


  async clearAllRecords(): Promise<number> {
    const result = await pool.query("DELETE FROM users");
    const deletedCount = result.rowCount || 0;
    return deletedCount;
  }
}
