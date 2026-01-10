const express = require("express");
const trackingUpdatedRouter = express.Router();
const handleTrackingUpdatedEvent = require("../controllers/webhook/handleTrackingUpdatedEvent");

trackingUpdatedRouter.post("/", handleTrackingUpdatedEvent);

module.exports = trackingUpdatedRouter;
