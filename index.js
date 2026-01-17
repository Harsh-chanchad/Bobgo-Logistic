"use strict";

require("dotenv").config();
const app = require("./server");
const port = process.env.BACKEND_PORT || 8080;
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Auto-create Configurations table on startup
const dbPath = path.join(__dirname, "session_storage.db");
console.log("📂 Database path for table creation:", dbPath);
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
    default_tat TEXT,
    shipment_declared_value DECIMAL(10, 2) DEFAULT 0,
    shipment_handling_time INTEGER DEFAULT 2,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

db.run(createTableSQL, (err) => {
  if (err) {
    console.error("❌ Error ensuring Configurations table:", err.message);
  } else {
    console.log("✅ Configurations table ready");
  }
  db.close();
});

app.listen(port, () => {
  console.log(`🚀 Backend server listening at http://localhost:${port}`);
  console.log(`📡 IMPORTANT: Make sure ngrok is forwarding to port ${port}`);
  console.log(`   Current ngrok should be: ngrok http ${port}`);
  console.log(`   NOT the frontend port!`);
});
