const express = require("express");
const fulfillmentCreatedRouter = express.Router();
const handleFulfillmentCreateEvent = require("../controllers/webhook/handleFulfillmentCreateEvent");

fulfillmentCreatedRouter.post("/", handleFulfillmentCreateEvent);

module.exports = fulfillmentCreatedRouter;
