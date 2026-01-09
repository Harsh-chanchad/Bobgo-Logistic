/**
 * This module sets up an Express router for handling partner-related routes.
 * It includes a single GET route '/test_partner_route' that retrieves courier partner accounts.
 *
 * @module partnerRouter
 */

const express = require("express");
const partnerRouter = express.Router();
const fdkExtension = require("./fdk");

/**
 * GET /test_partner_route
 *
 * This route handler retrieves courier partner accounts using the FDK extension.
 *
 * @async
 * @function view
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 *
 * @returns {Object} JSON response indicating success or failure.
 *
 * @throws Will log an error and respond with a 404 status if the operation fails.
 */
partnerRouter.get("/test_partner_route", async function view(req, res, next) {
  try {
    const platformClient = await fdkExtension.getPlatformClient(1);
    const response =
      await platformClient.serviceability.getCourierPartnerAccounts({
        companyId: 1,
        pageNo: 1,
        pageSize: 1,
        stage: "value",
        paymentMode: "value",
        transportType: "value",
      });
    console.log(JSON.stringify(response));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(404).json({ success: false });
  }
});

module.exports = partnerRouter;
