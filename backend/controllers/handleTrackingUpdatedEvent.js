const {
  processBobGoWebhookAndUpdateFynd,
  extractShipmentIdFromBobGo,
  extractCompanyIdFromBobGo,
} = require("../utils/bobgoToFyndStatusMapper");
const fdkExtension = require("../fdk");

/**
 * Handle BobGo Tracking Updated Webhook
 *
 * Triggered when courier updates the tracking status:
 * - status: "collected" → Update Fynd to "bag_picked"
 * - status: "out_for_delivery" → Update Fynd to "out_for_delivery"
 * - status: "delivered" → Update Fynd to "delivery_done"
 */
const handleTrackingUpdatedEvent = async (req, res) => {
  try {
    const bobGoWebhook = req.body;

    console.log("📍 Tracking updated event received from BobGo");
    console.log("📋 Webhook payload:", JSON.stringify(bobGoWebhook, null, 2));

    // Extract shipment ID and company ID
    const shipmentId = extractShipmentIdFromBobGo(bobGoWebhook);
    const companyId = extractCompanyIdFromBobGo(bobGoWebhook);

    if (!shipmentId) {
      console.warn("⚠️ No shipment ID found in BobGo tracking webhook");
      return res.status(400).json({
        success: false,
        message:
          "Missing channel_order_number (shipment_id) in webhook payload",
      });
    }

    console.log(
      `🔍 Processing tracking update for shipment: ${shipmentId}, company: ${companyId}`
    );
    console.log(
      `📊 BobGo tracking status: ${bobGoWebhook.status || "unknown"}`
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
        `✅ Successfully processed tracking webhook and updated Fynd`
      );
      return res.status(200).json({
        success: true,
        message: "Tracking event processed successfully",
        shipmentId,
        fyndStatus: result.fyndStatus,
        bobGoStatus: result.bobGoStatus,
      });
    } else {
      console.warn(
        `⚠️ Failed to process tracking webhook: ${
          result.message || result.error
        }`
      );
      return res.status(200).json({
        success: false,
        message:
          result.message || result.error || "Failed to process tracking update",
        shipmentId,
      });
    }
  } catch (error) {
    console.error("❌ Error handling tracking updated event:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = handleTrackingUpdatedEvent;
