const express = require("express");
const fulfillmentCreatedRouter = express.Router();
const handleFulfillmentCreateEvent = require("../controllers/handleFulfillmentCreateEvent");

fulfillmentCreatedRouter.post("/", handleFulfillmentCreateEvent);

module.exports = fulfillmentCreatedRouter;
