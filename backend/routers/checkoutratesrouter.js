const express = require("express");
const checkoutRatesRouter = express.Router();
const checkoutRatesController = require("../controllers/checkoutratescontroller.js");
checkoutRatesRouter.post(
  "/getServicePlan",
  checkoutRatesController.getServicePlan
);

module.exports = checkoutRatesRouter;
