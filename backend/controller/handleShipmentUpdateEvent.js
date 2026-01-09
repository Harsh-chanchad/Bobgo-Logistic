const axios = require("axios");
const ConfigurationModel = require("../configurationModel");

/**
 * Transform Fynd shipment payload to BobGo Create Order format
 */
function transformShipmentToBobGoOrder(shipmentData) {
  const shipment = shipmentData.payload?.shipment;

  if (!shipment) {
    throw new Error("Invalid shipment data structure");
  }

  // Extract customer details
  const user = shipment.user || {};
  const deliveryAddress = shipment.delivery_address || {};
  const bags = shipment.bags || [];

  // Calculate total items and prepare order_items array
  const orderItems = bags.map((bag) => {
    const item = bag.item || {};
    return {
      description: item.name || bag.item_name || "Product",
      vendor: item.brand?.name || "",
      sku: item.code || item.seller_identifier || "",
      unit_price: bag.prices?.price_effective || 0,
      qty: bag.quantity || 1,
      unit_weight_kg: (shipment.weight?.weight || 0) / bags.length || 0.1, // Distribute weight
    };
  });

  // Build BobGo payload
  const bobGoPayload = {
    channel_order_number: shipment.shipment_id,
    customer_name: user.first_name || user.name || "Customer",
    customer_surname: user.last_name || "",
    customer_email: user.email || "",
    customer_phone: user.phone || deliveryAddress.phone || "",
    currency: "ZAR", // Default to ZAR for South Africa
    buyer_selected_shipping_cost: shipment.prices?.delivery_charge || 0,
    buyer_selected_shipping_method:
      shipment.delivery_partner_details?.name || "Standard Shipping",
    delivery_address: {
      company: deliveryAddress.name || "",
      street_address: deliveryAddress.address || deliveryAddress.address1 || "",
      local_area: deliveryAddress.area || deliveryAddress.address2 || "",
      city: deliveryAddress.city || "",
      zone: deliveryAddress.state || "",
      country: deliveryAddress.country_iso_code || "ZA",
      code: deliveryAddress.pincode || deliveryAddress.zip || "",
    },
    order_items: orderItems,
    payment_status:
      shipment.payment_methods?.mode === "COD" ? "unpaid" : "paid",
  };

  return bobGoPayload;
}

/**
 * Create order in BobGo API
 */
async function createBobGoOrder(payload, config) {
  try {
    const bobGoUrl =
      config.delivery_partner_URL || "https://api.sandbox.bobgo.co.za";
    const apiToken = config.delivery_partner_API_token;

    console.log("🔑 BobGo API token:", apiToken);

    if (!apiToken) {
      throw new Error("BobGo API token not configured");
    }

    console.log("📦 Creating BobGo order:", JSON.stringify(payload, null, 2));

    const response = await axios.post(`${bobGoUrl}/v2/orders`, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
        Accept: "*/*",
      },
    });

    console.log("✅ BobGo order created successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ BobGo order creation failed:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
}

/**
 * Handle Shipment Update Event
 * Triggers BobGo order creation when status is 'ready_for_dp_assignment'
 */
async function handleShipmentUpdateEvent(
  eventName,
  payload,
  companyId,
  applicationId
) {
  try {
    console.log("📬 Shipment update event received:", {
      eventName,
      companyId,
      applicationId,
      status: payload?.payload?.shipment?.status,
      shipmentId: payload?.payload?.shipment?.shipment_id,
    });

    const shipmentStatus = payload?.payload?.shipment?.status;

    // Check if status is ready_for_dp_assignment
    if (shipmentStatus === "ready_for_dp_assignment") {
      console.log(
        "🚀 Status is 'ready_for_dp_assignment' - Creating BobGo order..."
      );

      // Get company configuration from database
      const configModel = new ConfigurationModel();
      const config = await configModel.getByCompanyId(companyId.toString());

      if (!config) {
        console.error(`❌ No configuration found for company ID: ${companyId}`);
        console.log(
          "⚠️ Please configure the company in the Configuration page first"
        );
        return;
      }

      console.log("✅ Configuration loaded for company:", config.company_name);

      // Transform Fynd shipment to BobGo format
      const bobGoPayload = transformShipmentToBobGoOrder(payload);

      // Create order in BobGo
      const bobGoResponse = await createBobGoOrder(bobGoPayload, config);

      console.log("🎉 BobGo order creation completed:", {
        shipmentId: payload?.payload?.shipment?.shipment_id,
        bobGoOrderId: bobGoResponse?.order_id || bobGoResponse?.id,
      });

      // TODO: Save the BobGo order ID to database for future reference

      // TODO: Update shipment with BobGo tracking details if needed

      return bobGoResponse;
    } else {
      console.log(
        `ℹ️ Shipment status is '${shipmentStatus}' - No action needed`
      );
    }
  } catch (error) {
    console.error("❌ Error handling shipment update event:", {
      error: error.message,
      stack: error.stack,
      eventName,
      companyId,
      applicationId,
    });
    // Don't throw - we don't want to fail the webhook
  }
}

module.exports = handleShipmentUpdateEvent;
