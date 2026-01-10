/**
 * Utility to map BobGo order statuses to Fynd shipment statuses
 * and update Fynd shipment status via API
 */

const fdkExtension = require("../fdk");

/**
 * BobGo to Fynd Status Mapping
 *
 * BobGo Status Flow:
 * 1. Fulfillment Created (method_status: "pending-collection", status: "success") → DP Assigned
 * 2. Tracking Update (status: "collected") → Bag Picked
 * 3. Tracking Update (status: "out_for_delivery") → Out for Delivery
 * 4. Tracking Update (status: "delivered") → Delivered
 */
const STATUS_MAPPING = {
  // Fulfillment webhook statuses
  "pending-collection": "dp_assigned",

  // Tracking webhook statuses
  collected: "bag_picked",
  out_for_delivery: "out_for_delivery",
  "out for delivery": "out_for_delivery",
  delivered: "delivery_done",
  delivery_done: "delivery_done",

  // Additional possible statuses
  in_transit: "in_transit",
  ready_for_pickup: "ready_for_pickup",
  cancelled: "cancelled",
  failed_delivery: "return_initiated",
  returned: "return_bag_delivered",
};

/**
 * Maps BobGo status to Fynd status
 * @param {Object} bobGoWebhook - BobGo webhook payload
 * @returns {string|null} - Fynd status or null if no mapping found
 */
function mapBobGoStatusToFynd(bobGoWebhook) {
  try {
    // For fulfillment webhook: check method_status
    if (bobGoWebhook.method_status) {
      const methodStatus = bobGoWebhook.method_status.toLowerCase();
      if (STATUS_MAPPING[methodStatus]) {
        console.log(
          `📊 Mapped BobGo method_status "${methodStatus}" → Fynd status "${STATUS_MAPPING[methodStatus]}"`
        );
        return STATUS_MAPPING[methodStatus];
      }
    }

    // For tracking webhook: check status
    if (bobGoWebhook.status) {
      const status = bobGoWebhook.status.toLowerCase();
      if (STATUS_MAPPING[status]) {
        console.log(
          `📊 Mapped BobGo status "${status}" → Fynd status "${STATUS_MAPPING[status]}"`
        );
        return STATUS_MAPPING[status];
      }
    }

    console.warn(
      `⚠️ No Fynd status mapping found for BobGo webhook:`,
      bobGoWebhook
    );
    return null;
  } catch (error) {
    console.error("❌ Error mapping BobGo status:", error);
    return null;
  }
}

/**
 * Updates Fynd shipment status
 * @param {string} companyId - Company ID
 * @param {string} shipmentId - Shipment ID
 * @param {string} fyndStatus - Fynd status to update to
 * @param {Object} metadata - Additional metadata (optional)
 * @returns {Promise<Object>} - API response
 */
async function updateFyndShipmentStatus(
  companyId,
  shipmentId,
  fyndStatus,
  metadata = {}
) {
  try {
    console.log(`🔄 Updating Fynd shipment status:`, {
      companyId,
      shipmentId,
      status: fyndStatus,
      metadata,
    });

    const platformClient = await fdkExtension.getPlatformClient(11874);

    console.log("platformClient", platformClient);
    // Prepare reason text based on status
    const reasonText = metadata.bobGoMethodStatus
      ? `BobGo: ${metadata.bobGoMethodStatus}`
      : `BobGo: ${metadata.bobGoStatus || "Status updated"}`;

    // Call Fynd's shipment status update API with correct payload structure
    const response = await platformClient.order.updateShipmentStatus({
      body: {
        statuses: [
          {
            shipments: [
              {
                identifier: shipmentId, // Use 'identifier' not 'shipment_id'
                reasons: {
                  entities: [
                    {
                      filters: [],
                      data: {
                        reason_id: 1,
                        reason_text: reasonText,
                      },
                    },
                  ],
                },
                data_updates: {},
                transition_comments: [
                  {
                    title: "BobGo Status Update",
                    message: reasonText,
                  },
                ],
              },
            ],
            status: fyndStatus,
            exclude_bags_next_state: "",
            split_shipment: false,
          },
        ],
        task: true,
        force_transition: false,
        lock_after_transition: false,
        unlock_before_transition: true,
        resume_tasks_after_unlock: false,
      },
    });

    console.log(`✅ Fynd shipment status updated successfully:`, response);
    return response;
  } catch (error) {
    console.error(`❌ Failed to update Fynd shipment status:`, {
      companyId,
      shipmentId,
      status: fyndStatus,
      error: error.message,
      response: error.response?.data,
    });
    throw error;
  }
}

/**
 * Process BobGo webhook and update Fynd shipment
 * @param {Object} bobGoWebhook - BobGo webhook payload
 * @param {string} companyId - Company ID
 * @param {string} shipmentId - Shipment ID (from channel_order_number or external mapping)
 * @returns {Promise<Object>} - Result of the update
 */
async function processBobGoWebhookAndUpdateFynd(
  bobGoWebhook,
  companyId,
  shipmentId
) {
  try {
    console.log(`📥 Processing BobGo webhook for shipment ${shipmentId}`);

    // Map BobGo status to Fynd status
    const fyndStatus = mapBobGoStatusToFynd(bobGoWebhook);

    if (!fyndStatus) {
      console.warn(`⚠️ Skipping Fynd update - no status mapping found`);
      return {
        success: false,
        message: "No status mapping found",
      };
    }

    // Update Fynd shipment status

    const response = await updateFyndShipmentStatus(
      companyId,
      shipmentId,
      fyndStatus,
      {
        bobGoOrderId: bobGoWebhook.id || bobGoWebhook.order_id,
        bobGoStatus: bobGoWebhook.status,
        bobGoMethodStatus: bobGoWebhook.method_status,
        updatedAt: new Date().toISOString(),
      }
    );

    return {
      success: true,
      fyndStatus,
      bobGoStatus: bobGoWebhook.status || bobGoWebhook.method_status,
      response,
    };
  } catch (error) {
    console.error(`❌ Error processing BobGo webhook:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Extract shipment ID from BobGo webhook
 * @param {Object} bobGoWebhook - BobGo webhook payload
 * @returns {string|null} - Shipment ID or null
 */
function extractShipmentIdFromBobGo(bobGoWebhook) {
  // BobGo uses channel_order_number which corresponds to our Fynd shipment_id
  return (
    bobGoWebhook.channel_order_number ||
    bobGoWebhook.order?.channel_order_number ||
    null
  );
}

/**
 * Extract company ID from BobGo webhook or use default
 * @param {Object} bobGoWebhook - BobGo webhook payload
 * @returns {string} - Company ID
 */
function extractCompanyIdFromBobGo(bobGoWebhook) {
  const { companyId } = require("../constant");
  // For now, use the constant company ID
  // In the future, you might store BobGo order → Fynd company mapping in DB
  return companyId.toString();
}

module.exports = {
  STATUS_MAPPING,
  mapBobGoStatusToFynd,
  updateFyndShipmentStatus,
  processBobGoWebhookAndUpdateFynd,
  extractShipmentIdFromBobGo,
  extractCompanyIdFromBobGo,
};
