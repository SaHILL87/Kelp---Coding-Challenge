# Kelp - Coding challenge solution

## Features

- **Custom CSV Parser**: Handles nested properties with infinite depth (e.g., `a.b.c.d...z`)
- **Batch Inserts**: Optimized database operations with 1000-record batches
- **JSON Export**: Generates formatted JSON output from CSV
- **Age Analytics**: Automatic age distribution calculation and reporting
---

Run and the application will automatically:
1. Connect to PostgreSQL database
2. Create the `users` table
3. Parse the CSV file from configured path
4. Generate `output/users.json`
5. Insert records into database
6. Display age distribution report
7. Clean up (drop table for next run)

## Output Example

### Console Output
```
==================================================
AGE DISTRIBUTION REPORT
==================================================

Age Group       | Percentage
--------------------------------------------------
< 20            |  20.00%
20-40           |  40.00%
40-60           |  30.00%
> 60            |  10.00%
--------------------------------------------------
Total Users: 5,000
==================================================
```

## Installation

1. **Clone the repository**
```bash
git clone https://github.com/SaHILL87/Kelp---Coding-Challenge.git
cd kelp
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password

# CSV File Path
CSV_FILE_PATH=C:\path\to\your\csv\file.csv
```

4. **Prepare your CSV file**

Ensure your CSV file has the following mandatory fields at the beginning:
- `name.firstName`
- `name.lastName`
- `age`

Example CSV format:
```csv
name.firstName,name.lastName,age,address.line1,address.city,contact.email
John,Doe,30,123 Main St,New York,john@email.com
```

---

## Usage

**Run the application**
```bash
npm run dev
```

---

## Database Schema

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,              -- Combined firstName + lastName
  age INT NOT NULL,                   -- Mandatory field
  address JSONB NULL,                 -- Address object
  additional_info JSONB NULL,         -- All other nested properties
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Field Mapping:**
- `name.firstName` + `name.lastName` → `name` (VARCHAR)
- `age` → `age` (INT)
- `address.*` → `address` (JSONB)
- All other properties → `additional_info` (JSONB)

---

## CSV Parser Capabilities

The custom parser supports Nested properties with huge depth  

**Example of deep nesting:**
```csv
name.firstName,address.postal.code,employment.department.team.lead.name
John,12345,Sarah Johnson
```

Converts to:
```json
{
  "name": { "firstName": "John" },
  "address": { "postal": { "code": "12345" } },
  "employment": { "department": { "team": { "lead": { "name": "Sarah Johnson" } } } }
}
```

---

## Output Example

### Console Output

**Processing Status:**
```
[Insert your console output screenshot/text here]
```

**Age Distribution Report:**
```
[Insert age distribution report output here]
```

---

## Assumptions

1. **CSV Format**
   - First line contains property labels
   - Mandatory fields (`name.firstName`, `name.lastName`, `age`) are present at the beginning
   - Sub-properties of complex objects are placed consecutively in the file

2. **Data Processing**
   - Invalid records are skipped with error logging
   - Age values must be numeric
   - Empty values are treated as null

3. **Database Behavior**
   - Table is **dropped after each run** to ensure fresh data processing
   - Each CSV processing session starts with a clean slate
   - No data persistence between runs - suitable for ETL workflows

4. **Output Files**
   - `users.json` is regenerated on each run (overwrites previous file)
   - Current `output/users.json` exists purely to **demonstrate parser functionality**
   - Not intended for production data storage - used for validation and debugging

5. **Performance Optimizations**
   - Batch size of 1000 records balances memory usage and database performance
   - Single transaction per CSV file ensures data consistency
   - Streaming architecture prevents memory overflow on large files

---

## Error Handling

The application handles:

- Missing or invalid CSV file paths
- Database connection failures
- Invalid data types (non-numeric age values)
- Transaction rollback on processing errors
- Partial record processing (continues on individual record errors)
- Graceful shutdown on critical failures

---

## Configuration

### Environment Variables

All configuration is managed through the `.env` file. The application validates required variables on startup and exits with clear error messages if any are missing.

### Nodemon Settings

File: `nodemon.json`
```json
{
  "watch": ["src"],
  "ext": "ts,json",
  "ignore": ["output/**", "dist/**", "node_modules/**"],
  "exec": "tsx src/app.ts",
  "delay": 1000
}
```

This configuration prevents infinite restart loops when the `users.json` file is generated in the `output/` directory.

---

## Build Commands

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Build for production:**
```bash
npm run build
```

**Run production build:**
```bash
npm start
```

---
