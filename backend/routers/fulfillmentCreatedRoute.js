const express = require("express");
const fulfillmentCreatedRouter = express.Router();
const handleFulfillmentCreateEvent = require("../controller/handleFulfillmentCreateEvent");

fulfillmentCreatedRouter.post("/", handleFulfillmentCreateEvent);

module.exports = fulfillmentCreatedRouter;
