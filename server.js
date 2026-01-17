/**
 * Express Application Configuration
 *
 * This module sets up the Express app with middleware and routes
 */

const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const serveStatic = require("serve-static");
const { readFileSync } = require("fs");

// Import routes
const checkoutRatesRouter = require("./backend/routes/checkout.routes");
const configurationRouter = require("./backend/routes/configuration.routes");
const trackingUpdatedRouter = require("./backend/routes/trackingUpdated.routes");
const fulfillmentCreatedRouter = require("./backend/routes/fulfillmentCreated.routes");

// Import FDK and other routers
require("dotenv").config();
const fdkExtension = require("./backend/fdk");
const platformRouter = require("./backend/platform_router");
const partnerRouter = require("./backend/partner_router");
const basicRouter = require("./backend/basic_router");

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? path.join(process.cwd(), "frontend", "public", "dist")
    : path.join(process.cwd(), "frontend");

const app = express();

// Middleware
// CORS - Allow all origins
app.options("*", cors());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-company-id",
      "X-Requested-With",
    ],
    credentials: false,
  })
);

app.use(cookieParser("ext.session"));
app.use(bodyParser.json({ limit: "2mb" }));
app.use(serveStatic(STATIC_PATH, { index: false }));

// Request logging middleware for debugging - logs ALL incoming requests
app.use((req, res, next) => {
  console.log(`\n🌐 Incoming Request: [${req.method}] ${req.path}`);
  console.log(`   URL: ${req.url}`);
  console.log(`   Headers:`, {
    "x-company-id": req.headers["x-company-id"],
    "content-type": req.headers["content-type"],
  });
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`   Body:`, JSON.stringify(req.body, null, 2));
  }
  next();
});

// Mount webhook routes BEFORE FDK handler to prevent route interception
app.use("/tracking/updated", trackingUpdatedRouter);
app.use("/fulfillment/created", fulfillmentCreatedRouter);

// API routes - Mount BEFORE FDK handler to prevent route interception
app.use("/api/checkout", checkoutRatesRouter);
app.use("/api/configurations", configurationRouter);

// FDK extension handler
app.use("/", fdkExtension.fdkHandler);

// Webhook events handler
app.use("/api/webhook-events", async function (req, res) {
  try {
    console.log(`Webhook Event: ${req.body.event} received`);
    await fdkExtension.webhookRegistry.processWebhook(req);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.log(`Error Processing ${req.body.event} Webhook`);
    return res.status(500).json({ success: false });
  }
});

const platformApiRoutes = fdkExtension.platformApiRoutes;
const partnerApiRoutes = fdkExtension.partnerApiRoutes || express.Router();
// Additional API routes
app.use("/api", platformApiRoutes);
app.use("/apipartner", partnerApiRoutes);
app.use("/apibasic", basicRouter);

partnerApiRoutes.use("/", partnerRouter);
platformApiRoutes.use("/products", platformRouter);

// Serve React app for all other routes
app.get("*", (req, res) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(readFileSync(path.join(STATIC_PATH, "index.html")));
});

module.exports = app;
