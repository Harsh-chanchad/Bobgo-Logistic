const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const { setupFdk } = require("@gofynd/fdk-extension-javascript/express");
const {
  SQLiteStorage,
} = require("@gofynd/fdk-extension-javascript/express/storage");

// Use absolute path to ensure database is found regardless of working directory
const dbPath = path.join(__dirname, "..", "session_storage.db");
console.log("📂 Database path:", dbPath);
const sqliteInstance = new sqlite3.Database(dbPath);
const webhookHandler = require("./controllers/webhook/courierPartnerWebhooks");
const handleShipmentCreateEvent = require("./controllers/webhook/handleShipmentCreateEvent");
const handleShipmentUpdateEvent = require("./controllers/webhook/handleShipmentUpdateEvent");
const handleExtensionInstall = require("./controllers/webhook/handleExtensionInstall");
/**
 * This module sets up an FDK (Fynd Development Kit) extension using the `setupFdk` function from the
 * `@gofynd/fdk-extension-javascript/express` package. It configures the extension with necessary
 * credentials, storage, and webhook handlers.
 *
 * Parameters:
 * - `api_key` (string): The API key for the extension, retrieved from environment variables.
 * - `api_secret` (string): The API secret for the extension, retrieved from environment variables.
 * - `base_url` (string): The base URL for the extension, retrieved from environment variables.
 * - `cluster` (string): The domain for the Fynd Platform API, retrieved from environment variables.
 * - `callbacks` (object): Contains callback functions for `auth` and `uninstall` events.
 *   - `auth` (function): Asynchronous function that returns the initial launch URL after the authentication process.
 *     - `req` (object): The request object containing query parameters.
 *   - `uninstall` (function): Asynchronous function to clean up data related to the extension.
 *     - `req` (object): The request object.
 * - `storage` (SQLiteStorage): An instance of `SQLiteStorage` for session storage, initialized with a SQLite database.
 * - `access_mode` (string): The access mode for the extension, set to "offline".
 * - `webhook_config` (object): Configuration for handling webhooks.
 *   - `api_path` (string): The API path for webhook events.
 *   - `notification_email` (string): Email for notifications.
 *   - `event_map` (object): Maps events to their respective handlers and versions.
 *     - `application/courier-partner/assign` (object): Handler and version for the assign event.
 *     - `application/courier-partner/cancel` (object): Handler and version for the cancel event.
 *
 * Returns:
 * - `fdkExtension` (object): The configured FDK extension instance.
 *
 * Exceptions:
 * - Any errors related to database connection or invalid configuration will be raised during setup.
 */
const fdkExtension = setupFdk({
  api_key: process.env.EXTENSION_API_KEY,
  api_secret: process.env.EXTENSION_API_SECRET,
  base_url: process.env.EXTENSION_BASE_URL,
  cluster: process.env.FP_API_DOMAIN,
  callbacks: {
    auth: async (req) => {
      // Write you code here to return initial launch url after auth process complete
      // console.log("request query", JSON.stringify(req.query));
      if (req.query.application_id)
        return `${req.extension.base_url}/company/${req.query["company_id"]}/application/${req.query.application_id}`;
      else
        return `${req.extension.base_url}/company/${req.query["company_id"]}`;
    },
    // install: async (req) => {
    //   console.log("Extension install event received", req);
    // },
    uninstall: async (req) => {
      // Write your code here to cleanup data related to extension
      // If task is time taking then process it async on other process.
      console.log("Extension uninstall event received", req);
    },
  },
  storage: (() => {
    console.log(
      "🗄️ Initializing SQLiteStorage with prefix: exapmple-fynd-platform-extension"
    );
    const storage = new SQLiteStorage(
      sqliteInstance,
      "exapmple-fynd-platform-extension"
    );
    console.log("✅ SQLiteStorage initialized successfully");
    return storage;
  })(), // add your prefix
  access_mode: "offline",
  webhook_config: {
    api_path: "/api/webhook-events",
    notification_email: "parasjain@gofynd.com",
    event_map: {
      "application/courier-partner/assign": {
        handler: webhookHandler.courierPartnerAsign,
        version: "1",
      },
      "application/courier-partner/cancel": {
        handler: webhookHandler.courierPartnerCancel,
        version: "1",
      },
      "application/shipment/create": {
        handler: handleShipmentCreateEvent,
        version: "1",
      },
      "application/shipment/update": {
        handler: handleShipmentUpdateEvent,
        version: "1",
      },
    },
  },
});

// console.log("🚀 FDK Extension initialized with configuration:");
// console.log(
//   "   - API Key:",
//   process.env.EXTENSION_API_KEY ? "✅ Set" : "❌ Not set"
// );
// console.log(
//   "   - API Secret:",
//   process.env.EXTENSION_API_SECRET ? "✅ Set" : "❌ Not set"
// );
// console.log("   - Base URL:", process.env.EXTENSION_BASE_URL || "❌ Not set");
// console.log("   - Cluster:", process.env.FP_API_DOMAIN || "❌ Not set");
// console.log("   - Access Mode: offline");
// console.log("   - Webhook Path: /api/webhook-events");

// // Import storage logger utility
// const { initLogger } = require("./storageLogger");

// // Initialize storage logger on startup (writes to storage.log file)
// setTimeout(() => {
//   initLogger({
//     clearOnStart: false, // Set to true to clear log file on each restart
//     watchChanges: true, // Continuously watch for database changes
//   });
// }, 2000);

module.exports = fdkExtension;
