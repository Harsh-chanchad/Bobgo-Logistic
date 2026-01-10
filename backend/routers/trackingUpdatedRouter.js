const express = require("express");
const trackingUpdatedRouter = express.Router();
const handleTrackingUpdatedEvent = require("../controllers/handleTrackingUpdatedEvent");

trackingUpdatedRouter.post("/", handleTrackingUpdatedEvent);

module.exports = trackingUpdatedRouter;
