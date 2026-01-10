const axios = require("axios");
const ConfigurationModel = require("../../models/Configuration.model");

/**
 * Transform Fynd shipment payload to BobGo Create Order format
 */
function transformShipmentToBobGoOrder(shipmentData) {
  const shipment = shipmentData.payload?.shipment;

  if (!shipment) {
    throw new Error("Invalid shipment data structure");
  }

  console.log("Shipment data", shipment);

  // Extract customer details
  const user = shipment.user || {};
  const deliveryAddress = shipment.delivery_address || {};
  const bags = shipment.bags || [];
  const isAnonymousUser = user.is_anonymous_user === true;

  console.log("📋 Customer identification:", {
    isAnonymousUser,
    userEmail: user.email,
    userFirstName: user.first_name,
    userName: user.name,
    userPhone: user.phone,
    deliveryEmail: deliveryAddress.email,
    deliveryName: deliveryAddress.name,
    deliveryPhone: deliveryAddress.phone,
  });

  // Determine customer details based on user type
  let customerName, customerSurname, customerEmail, customerPhone;

  if (isAnonymousUser) {
    // Guest checkout - use delivery address
    console.log("👤 Using delivery address for guest checkout");
    const fullName =
      deliveryAddress.name || deliveryAddress.contact_person || "";
    const nameParts = fullName.trim().split(" ");
    customerName = nameParts[0] || "";
    customerSurname = nameParts.slice(1).join(" ") || "";
    customerEmail = deliveryAddress.email || "";
    customerPhone = deliveryAddress.phone || "";
  } else {
    // Logged-in user - use user object
    console.log("👤 Using user object for logged-in user");
    customerName = user.first_name || user.name || "";
    customerSurname = user.last_name || "";
    customerEmail = user.email || "";
    customerPhone = user.phone || user.mobile || "";
  }

  console.log("✅ Final customer details for BobGo:", {
    customerName,
    customerSurname,
    customerEmail,
    customerPhone,
  });

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
    customer_name: customerName,
    customer_surname: customerSurname,
    customer_email: customerEmail,
    customer_phone: customerPhone,
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

    // Log the full user data to see what we get from Fynd
    // const shipment = payload?.payload?.shipment;
    // console.log("\n🔍 FULL SHIPMENT DATA FOR ANALYSIS:");
    // console.log("User:", JSON.stringify(shipment?.user, null, 2));
    // console.log(
    //   "Delivery Address:",
    //   JSON.stringify(shipment?.delivery_address, null, 2)
    // );
    // console.log("Bags:", JSON.stringify(shipment?.bags, null, 2));
    // console.log("Prices:", JSON.stringify(shipment?.prices, null, 2));
    // console.log(
    //   "Payment Methods:",
    //   JSON.stringify(shipment?.payment_methods, null, 2)
    // );
    // console.log(
    //   "Delivery Partner:",
    //   JSON.stringify(shipment?.delivery_partner_details, null, 2)
    // );
    // console.log("Weight:", JSON.stringify(shipment?.weight, null, 2));

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
