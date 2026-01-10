const {
  processBobGoWebhookAndUpdateFynd,
  extractShipmentIdFromBobGo,
  extractCompanyIdFromBobGo,
} = require("../../utils/statusMapper");
const fdkExtension = require("../../fdk");

/**
 * Handle BobGo Fulfillment Created Webhook
 *
 * Triggered when warehouse staff selects a courier from BobGo portal
 * Webhook payload contains: method_status: "pending-collection", status: "success"
 * Action: Update Fynd shipment status to "dp_assigned"
 */
const handleFulfillmentCreateEvent = async (req, res) => {
  try {
    const bobGoWebhook = req.body;

    console.log("📦 Fulfillment create event received from BobGo");
    console.log("📋 Webhook payload:", JSON.stringify(bobGoWebhook, null, 2));

    // Extract shipment ID and company ID
    const shipmentId = extractShipmentIdFromBobGo(bobGoWebhook);
    const companyId = extractCompanyIdFromBobGo(bobGoWebhook);

    if (!shipmentId) {
      console.warn("⚠️ No shipment ID found in BobGo webhook");
      return res.status(400).json({
        success: false,
        message:
          "Missing channel_order_number (shipment_id) in webhook payload",
      });
    }

    console.log(
      `🔍 Processing fulfillment for shipment: ${shipmentId}, company: ${companyId}`
    );

    // Get platform client for the company
    const platformClient = await fdkExtension.getPlatformClient(companyId);

    if (!platformClient) {
      console.error(
        `❌ Failed to get platform client for company ${companyId} - no valid session`
      );
      return res.status(500).json({
        success: false,
        error: "No valid session found for company. Please authenticate first.",
      });
    }

    // Process webhook and update Fynd
    const result = await processBobGoWebhookAndUpdateFynd(
      bobGoWebhook,
      platformClient,
      shipmentId
    );

    if (result.success) {
      console.log(
        `✅ Successfully processed fulfillment webhook and updated Fynd`
      );
      return res.status(200).json({
        success: true,
        message: "Fulfillment event processed successfully",
        shipmentId,
        fyndStatus: result.fyndStatus,
        bobGoStatus: result.bobGoStatus,
      });
    } else {
      console.warn(
        `⚠️ Failed to process fulfillment webhook: ${
          result.message || result.error
        }`
      );
      return res.status(200).json({
        success: false,
        message:
          result.message || result.error || "Failed to process fulfillment",
        shipmentId,
      });
    }
  } catch (error) {
    console.error("❌ Error handling fulfillment create event:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = handleFulfillmentCreateEvent;
