const express = require("express");
const checkoutRatesRouter = express.Router();
const checkoutRatesController = require("../controllers/checkoutRates.controller.js");
const priceAdjustmentController = require("../controllers/priceAdjustment.controller.js");

checkoutRatesRouter.post(
  "/getServicePlan",
  checkoutRatesController.getServicePlan
);

checkoutRatesRouter.post(
  "/priceadjustment",
  priceAdjustmentController.updateCartShipping
);

// GET price adjustments for a cart
checkoutRatesRouter.get(
  "/priceadjustment",
  priceAdjustmentController.getPriceAdjustments
);

// DELETE a specific price adjustment
checkoutRatesRouter.delete(
  "/priceadjustment/:id",
  priceAdjustmentController.removePriceAdjustment
);

module.exports = checkoutRatesRouter;
