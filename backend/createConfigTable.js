const sqlite3 = require("sqlite3").verbose();
const path = require("path");

/**
 * Create Configurations table in SQLite database
 * Run: node backend/createConfigTable.js
 */

const dbPath = path.join(__dirname, "../session_storage.db");
const db = new sqlite3.Database(dbPath);

const createTableSQL = `
  CREATE TABLE IF NOT EXISTS Configurations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fynd_company_id VARCHAR(255) NOT NULL UNIQUE,
    company_name VARCHAR(255),
    street_address TEXT,
    local_area VARCHAR(255),
    city VARCHAR(255),
    zone VARCHAR(100),
    country VARCHAR(255),
    country_code VARCHAR(10),
    delivery_partner_URL TEXT,
    delivery_partner_API_token TEXT,
    shipment_declared_value DECIMAL(10, 2) DEFAULT 0,
    shipment_handling_time INTEGER DEFAULT 2,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

// Create indexes for faster queries
const createIndexes = [
  `CREATE INDEX IF NOT EXISTS idx_fynd_company_id ON Configurations(fynd_company_id)`,
  `CREATE INDEX IF NOT EXISTS idx_company_name ON Configurations(company_name)`,
];

console.log("🗄️  Creating Configurations table...\n");

db.serialize(() => {
  // Create table
  db.run(createTableSQL, (err) => {
    if (err) {
      console.error("❌ Error creating table:", err.message);
      return;
    }
    console.log("✅ Configurations table created successfully");

    // Create indexes
    createIndexes.forEach((indexSQL) => {
      db.run(indexSQL, (err) => {
        if (err) {
          console.error("❌ Error creating index:", err.message);
        }
      });
    });
    console.log("✅ Indexes created successfully\n");

    // Show table structure
    db.all("PRAGMA table_info(Configurations)", [], (err, rows) => {
      if (err) {
        console.error("❌ Error reading table info:", err.message);
        return;
      }

      console.log("📋 Table Structure:\n");
      console.log(
        "+---------+---------------------------+----------+-----------+"
      );
      console.log(
        "| Column  | Type                      | Not Null | Default   |"
      );
      console.log(
        "+---------+---------------------------+----------+-----------+"
      );
      rows.forEach((row) => {
        const name = row.name.padEnd(25);
        const type = row.type.padEnd(23);
        const notNull = row.notnull ? "YES" : "NO";
        const dflt = row.dflt_value || "-";
        console.log(
          `| ${name} | ${type} | ${notNull.padEnd(8)} | ${dflt.padEnd(9)} |`
        );
      });
      console.log(
        "+---------+---------------------------+----------+-----------+\n"
      );

      // Insert sample data (optional)
      insertSampleData();
    });
  });
});

function insertSampleData() {
  console.log("💡 Do you want to insert sample data? (Uncomment to enable)\n");

  // Uncomment below to insert sample data
  /*
  const sampleData = {
    fynd_company_id: "11874",
    company_name: "Sample Company",
    street_address: "125 Dallas Avenue",
    local_area: "Newlands",
    city: "Pretoria",
    zone: "GP",
    country: "South Africa",
    country_code: "ZA",
    delivery_partner_URL: "https://api.sandbox.bobgo.co.za",
    delivery_partner_API_token: "your_api_token_here",
    shipment_declared_value: 200.00,
    shipment_handling_time: 2
  };

  const insertSQL = `
    INSERT OR IGNORE INTO Configurations (
      fynd_company_id, company_name, street_address, local_area,
      city, zone, country, country_code, delivery_partner_URL,
      delivery_partner_API_token, shipment_declared_value, shipment_handling_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    insertSQL,
    [
      sampleData.fynd_company_id,
      sampleData.company_name,
      sampleData.street_address,
      sampleData.local_area,
      sampleData.city,
      sampleData.zone,
      sampleData.country,
      sampleData.country_code,
      sampleData.delivery_partner_URL,
      sampleData.delivery_partner_API_token,
      sampleData.shipment_declared_value,
      sampleData.shipment_handling_time,
    ],
    function (err) {
      if (err) {
        console.error("❌ Error inserting sample data:", err.message);
      } else {
        console.log("✅ Sample data inserted (ID:", this.lastID, ")\n");
      }
      db.close();
    }
  );
  */

  db.close((err) => {
    if (err) {
      console.error("❌ Error closing database:", err.message);
    } else {
      console.log("✅ Database connection closed");
      console.log("\n🎉 Done! You can now use the Configurations table.");
    }
  });
}

module.exports = { createTableSQL, createIndexes };
