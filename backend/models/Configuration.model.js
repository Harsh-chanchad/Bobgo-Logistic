const sqlite3 = require("sqlite3").verbose();
const path = require("path");

/**
 * Configuration Model - CRUD operations for Configurations table
 */

const dbPath = path.join(__dirname, "../../database/session_storage.db");

class ConfigurationModel {
  constructor() {
    this.db = new sqlite3.Database(dbPath);
  }

  /**
   * Create a new configuration
   */
  create(config) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO Configurations (
          fynd_company_id, company_name, street_address, local_area,
          city, zone, country, country_code, delivery_partner_URL,
          delivery_partner_API_token, shipment_declared_value, shipment_handling_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(
        sql,
        [
          config.fynd_company_id,
          config.company_name,
          config.street_address,
          config.local_area,
          config.city,
          config.zone,
          config.country,
          config.country_code,
          config.delivery_partner_URL,
          config.delivery_partner_API_token,
          config.shipment_declared_value || 0,
          config.shipment_handling_time || 2,
        ],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, ...config });
          }
        }
      );
    });
  }

  /**
   * Get configuration by company ID
   */
  getByCompanyId(fynd_company_id) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM Configurations WHERE fynd_company_id = ?`;

      this.db.get(sql, [fynd_company_id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * Get all configurations
   */
  getAll() {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM Configurations ORDER BY created_at DESC`;

      this.db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Update configuration by company ID
   */
  update(fynd_company_id, updates) {
    return new Promise((resolve, reject) => {
      const fields = Object.keys(updates);
      const values = Object.values(updates);

      const setClause = fields.map((field) => `${field} = ?`).join(", ");
      const sql = `
        UPDATE Configurations 
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
        WHERE fynd_company_id = ?
      `;

      this.db.run(sql, [...values, fynd_company_id], function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  /**
   * Delete configuration by company ID
   */
  delete(fynd_company_id) {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM Configurations WHERE fynd_company_id = ?`;

      this.db.run(sql, [fynd_company_id], function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ deleted: this.changes });
        }
      });
    });
  }

  /**
   * Upsert - Insert or Update if exists
   */
  upsert(config) {
    return new Promise(async (resolve, reject) => {
      try {
        const existing = await this.getByCompanyId(config.fynd_company_id);

        if (existing) {
          // Update existing
          const { fynd_company_id, ...updates } = config;
          await this.update(fynd_company_id, updates);
          resolve({ action: "updated", ...config });
        } else {
          // Create new
          const result = await this.create(config);
          resolve({ action: "created", ...result });
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Close database connection
   */
  close() {
    this.db.close();
  }
}

module.exports = ConfigurationModel;
