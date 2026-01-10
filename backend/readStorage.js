const sqlite3 = require("sqlite3").verbose();
const path = require("path");

/**
 * Utility to read and display SQLite storage data in table format
 * Can be run standalone: node backend/readStorage.js
 */

const dbPath = path.join(__dirname, "../session_storage.db");
const db = new sqlite3.Database(dbPath);

// ANSI color codes for better output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
};

/**
 * Format data as ASCII table
 */
function formatAsTable(data, tableName) {
  if (!data || data.length === 0) {
    console.log(`${colors.yellow}No data in table${colors.reset}`);
    return;
  }

  // Get column names
  const columns = Object.keys(data[0]);
  const columnWidths = {};

  // Calculate column widths
  columns.forEach((col) => {
    columnWidths[col] = Math.max(
      col.length,
      ...data.map((row) => String(row[col] || "").length)
    );
    // Limit max width to 50 characters
    columnWidths[col] = Math.min(columnWidths[col], 50);
  });

  // Create separator line
  const separator =
    "+" +
    columns.map((col) => "-".repeat(columnWidths[col] + 2)).join("+") +
    "+";

  // Print table header
  console.log(
    `\n${colors.bright}${colors.cyan}Table: ${tableName}${colors.reset}`
  );
  console.log(separator);

  // Print column headers
  const headerRow =
    "|" +
    columns
      .map(
        (col) =>
          ` ${colors.bright}${col.padEnd(columnWidths[col])}${colors.reset} `
      )
      .join("|") +
    "|";
  console.log(headerRow);
  console.log(separator);

  // Print data rows
  data.forEach((row, index) => {
    const dataRow =
      "|" +
      columns
        .map((col) => {
          let value = String(
            row[col] !== null && row[col] !== undefined ? row[col] : ""
          );
          // Truncate long values
          if (value.length > 50) {
            value = value.substring(0, 47) + "...";
          }
          return ` ${value.padEnd(columnWidths[col])} `;
        })
        .join("|") +
      "|";
    console.log(dataRow);
  });

  console.log(separator);
  console.log(`${colors.green}Total rows: ${data.length}${colors.reset}\n`);
}

/**
 * Read all tables and display data
 */
function readAllTables() {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
      [],
      (err, tables) => {
        if (err) {
          console.error(
            `${colors.red}❌ Error reading tables:${colors.reset}`,
            err
          );
          reject(err);
          return;
        }

        if (tables.length === 0) {
          console.log(
            `${colors.yellow}No tables found in database${colors.reset}`
          );
          resolve();
          return;
        }

        console.log(
          `${colors.bright}${colors.blue}📊 Found ${tables.length} table(s) in database${colors.reset}`
        );
        console.log(
          `${colors.cyan}Tables: ${tables.map((t) => t.name).join(", ")}${
            colors.reset
          }\n`
        );

        let processed = 0;
        tables.forEach((table) => {
          db.all(`SELECT * FROM ${table.name}`, [], (err, rows) => {
            if (err) {
              console.error(
                `${colors.red}❌ Error reading ${table.name}:${colors.reset}`,
                err
              );
            } else {
              formatAsTable(rows, table.name);
            }

            processed++;
            if (processed === tables.length) {
              resolve();
            }
          });
        });
      }
    );
  });
}

/**
 * Read specific table
 */
function readTable(tableName) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
      if (err) {
        console.error(
          `${colors.red}❌ Error reading ${tableName}:${colors.reset}`,
          err
        );
        reject(err);
      } else {
        formatAsTable(rows, tableName);
        resolve(rows);
      }
    });
  });
}

/**
 * Get table statistics
 */
function getTableStats() {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
      [],
      (err, tables) => {
        if (err) {
          reject(err);
          return;
        }

        const stats = [];
        let processed = 0;

        tables.forEach((table) => {
          db.get(
            `SELECT COUNT(*) as count FROM ${table.name}`,
            [],
            (err, result) => {
              if (!err) {
                stats.push({
                  table: table.name,
                  rows: result.count,
                });
              }
              processed++;
              if (processed === tables.length) {
                console.log(
                  `\n${colors.bright}${colors.blue}📈 Database Statistics${colors.reset}`
                );
                formatAsTable(stats, "Statistics");
                resolve(stats);
              }
            }
          );
        });
      }
    );
  });
}

/**
 * Main execution
 */
async function main() {
  console.log(
    `${colors.bright}${colors.green}==============================================`
  );
  console.log(`   SQLite Storage Reader`);
  console.log(`   Database: ${dbPath}`);
  console.log(
    `==============================================${colors.reset}\n`
  );

  try {
    // Get statistics first
    await getTableStats();

    // Read all tables
    await readAllTables();

    console.log(`${colors.green}✅ Done!${colors.reset}`);
  } catch (err) {
    console.error(`${colors.red}❌ Error:${colors.reset}`, err);
  } finally {
    db.close((err) => {
      if (err) {
        console.error(
          `${colors.red}Error closing database:${colors.reset}`,
          err
        );
      }
    });
  }
}

// Export functions for use in other files
module.exports = {
  readAllTables,
  readTable,
  getTableStats,
  formatAsTable,
};

// Run if executed directly
if (require.main === module) {
  main();
}
