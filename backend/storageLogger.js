const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");

/**
 * SQLite Storage Logger - Writes database changes to a file
 * Monitors database changes and appends to storage.log
 */

const dbPath = path.join(__dirname, "../session_storage.db");
const logFilePath = path.join(__dirname, "../storage.log");

// Open database connection
const db = new sqlite3.Database(dbPath);

/**
 * Format data as readable text table for file
 */
function formatDataForFile(data, tableName, timestamp) {
  let output = "";

  output += "\n" + "=".repeat(80) + "\n";
  output += `TIMESTAMP: ${timestamp}\n`;
  output += `TABLE: ${tableName}\n`;
  output += `ROWS: ${data.length}\n`;
  output += "=".repeat(80) + "\n\n";

  if (!data || data.length === 0) {
    output += "No data in table\n";
    return output;
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
    columnWidths[col] = Math.min(columnWidths[col], 100); // Max 100 chars
  });

  // Create separator line
  const separator =
    "+" +
    columns.map((col) => "-".repeat(columnWidths[col] + 2)).join("+") +
    "+";

  // Add table header
  output += separator + "\n";
  output +=
    "|" +
    columns.map((col) => ` ${col.padEnd(columnWidths[col])} `).join("|") +
    "|\n";
  output += separator + "\n";

  // Add data rows
  data.forEach((row) => {
    output +=
      "|" +
      columns
        .map((col) => {
          let value = String(
            row[col] !== null && row[col] !== undefined ? row[col] : ""
          );
          if (value.length > 100) {
            value = value.substring(0, 97) + "...";
          }
          return ` ${value.padEnd(columnWidths[col])} `;
        })
        .join("|") +
      "|\n";
  });

  output += separator + "\n";
  output += `Total rows: ${data.length}\n\n`;

  return output;
}

/**
 * Write data to log file
 */
function writeToLogFile(content) {
  try {
    fs.appendFileSync(logFilePath, content, "utf8");
  } catch (err) {
    console.error("Error writing to log file:", err);
  }
}

/**
 * Log all tables to file
 */
function logAllTables() {
  const timestamp = new Date().toISOString();
  let output = "\n" + "█".repeat(80) + "\n";
  output += `NEW DATABASE SNAPSHOT - ${timestamp}\n`;
  output += "█".repeat(80) + "\n";

  writeToLogFile(output);

  db.all(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    [],
    (err, tables) => {
      if (err) {
        writeToLogFile(`ERROR: ${err.message}\n`);
        return;
      }

      let output = `Found ${tables.length} table(s): ${tables
        .map((t) => t.name)
        .join(", ")}\n`;
      writeToLogFile(output);

      tables.forEach((table) => {
        db.all(`SELECT * FROM ${table.name}`, [], (err, rows) => {
          if (err) {
            writeToLogFile(`ERROR reading ${table.name}: ${err.message}\n`);
          } else {
            const tableData = formatDataForFile(rows, table.name, timestamp);
            writeToLogFile(tableData);
          }
        });
      });
    }
  );
}

/**
 * Watch for database changes and log them
 */
function startWatching() {
  // Initial log
  logAllTables();

  // Watch for file changes
  let lastMtime = fs.statSync(dbPath).mtime;

  setInterval(() => {
    const stats = fs.statSync(dbPath);
    if (stats.mtime > lastMtime) {
      lastMtime = stats.mtime;
      console.log("📝 Database changed, logging to storage.log...");
      logAllTables();
    }
  }, 2000); // Check every 2 seconds
}

/**
 * Clear log file
 */
function clearLogFile() {
  try {
    fs.writeFileSync(logFilePath, "", "utf8");
    const header = "═".repeat(80) + "\n";
    const title = "SQLite Storage Log File\n";
    const created = `Created: ${new Date().toISOString()}\n`;
    fs.writeFileSync(logFilePath, header + title + created + header, "utf8");
    console.log("✅ Log file cleared: storage.log");
  } catch (err) {
    console.error("Error clearing log file:", err);
  }
}

/**
 * Initialize logger
 */
function initLogger(options = {}) {
  const { clearOnStart = false, watchChanges = true } = options;

  console.log("🗄️  Initializing Storage Logger...");
  console.log(`   Log file: ${logFilePath}`);
  console.log(`   Database: ${dbPath}`);

  if (clearOnStart) {
    clearLogFile();
  }

  if (watchChanges) {
    startWatching();
    console.log("✅ Storage Logger started (watching for changes)");
  } else {
    logAllTables();
    console.log("✅ Storage logged once to file");
    db.close();
  }
}

// Export functions
module.exports = {
  initLogger,
  logAllTables,
  clearLogFile,
  writeToLogFile,
  formatDataForFile,
};

// Run if executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const clearFlag = args.includes("--clear");
  const watchFlag = !args.includes("--no-watch");

  initLogger({ clearOnStart: clearFlag, watchChanges: watchFlag });
}
