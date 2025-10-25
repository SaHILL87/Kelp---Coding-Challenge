import * as fs from "fs";
import * as readline from "readline";
import * as path from "path";

interface ParsedRecord {
  name: {
    firstName?: string;
    lastName?: string;
  };
  age?: number;
  [key: string]: any;
}

export class CSVParser {
  private headers: string[] = [];

  private parseLine(line: string): string[] {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values;
  }

  private setNestedProperty(obj: any, propertyPath: string, value: any): void {
    const keys = propertyPath.split(".");
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]!;

      if (!(key in current) || typeof current[key] !== "object") {
        current[key] = {};
      }
      current = current[key];
    }

    const lastKey = keys[keys.length - 1]!;
    current[lastKey] = value;
  }

  private rowToObject(values: string[]): ParsedRecord {
    const obj: ParsedRecord = { name: {} };

    for (let i = 0; i < this.headers.length; i++) {
      const header = this.headers[i];
      const value = values[i];

      if (header && value !== undefined && value !== "") {
        this.setNestedProperty(obj, header, value);
      }
    }

    return obj;
  }
  async parseFile(filePath: string): Promise<ParsedRecord[]> {
    return new Promise((resolve, reject) => {
      const records: ParsedRecord[] = [];
      let isFirstLine = true;

      const fileStream = fs.createReadStream(filePath, {
        encoding: "utf-8",
        highWaterMark: 64 * 1024,
      });

      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      rl.on("line", (line: string) => {
        if (!line.trim()) return;

        if (isFirstLine) {
          this.headers = this.parseLine(line);
          isFirstLine = false;
        } else {
          const values = this.parseLine(line);
          const record = this.rowToObject(values);
          records.push(record);
        }
      });

      rl.on("close", () => {
        resolve(records);
      });

      rl.on("error", (error) => {
        reject(error);
      });
    });
  }
  async *streamParseFile(filePath: string): AsyncGenerator<ParsedRecord> {
    const fileStream = fs.createReadStream(filePath, {
      encoding: "utf-8",
      highWaterMark: 64 * 1024,
    });

    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let isFirstLine = true;

    for await (const line of rl) {
      if (!line.trim()) continue;

      if (isFirstLine) {
        this.headers = this.parseLine(line);
        isFirstLine = false;
      } else {
        const values = this.parseLine(line);
        const record = this.rowToObject(values);
        yield record;
      }
    }
  }

  async parseAndSaveJSON(
    csvFilePath: string,
    outputDir: string = "output"
  ): Promise<string> {
    const records = await this.parseFile(csvFilePath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, "users.json");

    fs.writeFileSync(outputPath, JSON.stringify(records, null, 2), "utf-8");

    return outputPath;
  }
}
