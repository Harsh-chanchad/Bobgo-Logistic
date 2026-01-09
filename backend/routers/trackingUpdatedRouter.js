const express = require("express");
const trackingUpdatedRouter = express.Router();
const handleTrackingUpdatedEvent = require("../controller/handleTrackingUpdatedEvent");

trackingUpdatedRouter.post("/", handleTrackingUpdatedEvent);

module.exports = trackingUpdatedRouter;
