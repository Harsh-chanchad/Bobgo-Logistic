// controllers/priceAdjustment.controller.js
// Based on Fynd SDK Documentation: https://docs.fynd.com/partners/commerce/sdk/latest/platform/application/cart#addPriceAdjustment

const fdkExtension = require("../fdk");

/**
 * POST /priceadjustment or /shipmentcharge
 * Body:
 * {
 *   cart_id: "...",
 *   application_id: "...",
 *   service_plan: {
 *     id: 1998,
 *     name: "Local express shipping",
 *     rate: 100,
 *     currency: "ZAR",
 *     service_code: "bobgo_1998_0_0"
 *   }
 * }
 *
 * Headers:
 *  x-company-id: companyId (Required)
 */
const updateCartShipping = async (req, res) => {
  try {
    // 1. Validate company ID from header
    const companyId = req.headers["x-company-id"];
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID required in header (x-company-id)",
      });
    }

    // 2. Validate request body
    const { cart_id, application_id, service_plan } = req.body;
    if (!cart_id || !application_id || !service_plan) {
      return res.status(400).json({
        success: false,
        message: "cart_id, application_id, and service_plan are required",
      });
    }

    if (
      service_plan.rate === undefined ||
      service_plan.rate === null ||
      !service_plan.currency
    ) {
      return res.status(400).json({
        success: false,
        message: "service_plan must contain 'rate' and 'currency'",
      });
    }

    console.log("🛒 Updating cart shipping for cart:", cart_id);
    console.log("📦 Service Plan:", service_plan.name || "Shipping");
    console.log(
      "💰 Shipping Charge:",
      service_plan.rate,
      service_plan.currency
    );

    // 3. Get platform client using FDK
    const platformClient = await fdkExtension.getPlatformClient(companyId);
    if (!platformClient) {
      return res.status(500).json({
        success: false,
        message: "Failed to get platform client",
      });
    }

    // 4. Get application client from platform client
    const appClient = platformClient.application(application_id);
    if (!appClient || !appClient.cart) {
      return res.status(500).json({
        success: false,
        message: "Failed to get application cart client",
      });
    }

    const extensionId =
      platformClient?.config?.extension_id || "extension-bobgo";

    // 5. Remove existing shipping price adjustments (idempotency)
    console.log("🔍 Checking for existing price adjustments...");
    try {
      const existingAdjustments = await appClient.cart.getPriceAdjustments({
        cartId: cart_id,
      });

      const adjustmentItems = existingAdjustments?.data?.items || existingAdjustments?.items || [];
      
      if (Array.isArray(adjustmentItems) && adjustmentItems.length > 0) {
        for (const adj of adjustmentItems) {
          // Remove shipping/delivery charge adjustments from this extension
          const shouldRemove =
            adj.type === "delivery_charge" ||
            adj.type === "charge" ||
            adj.message?.toLowerCase().includes("shipping") ||
            adj.message?.toLowerCase().includes("delivery") ||
            adj.meta?.extension_id === extensionId;

          if (shouldRemove && adj.id) {
            console.log("🗑️ Removing existing shipping adjustment:", adj.id);
            try {
              await appClient.cart.removePriceAdjustment({
                id: adj.id,
              });
              console.log("✅ Removed adjustment:", adj.id);
            } catch (delErr) {
              console.log(
                "⚠️ Failed to delete adjustment",
                adj.id,
                delErr.message
              );
            }
          }
        }
      } else {
        console.log("ℹ️ No existing adjustments found for this cart");
      }
    } catch (e) {
      // If no adjustments exist or API fails, continue to add new one
      console.log(
        "ℹ️ Could not fetch existing adjustments (safe to ignore if none exist):",
        e.message
      );
    }

    // 6. Fetch cart to get items and extract article IDs
    console.log("📦 Fetching cart items to build dynamic article_ids...");
    let cartItems = [];
    try {
      const cartData = await appClient.cart.getCart({
        id: cart_id,
        b: true, // Include breakup values
      });
      
      cartItems = cartData?.items || [];
      console.log(`✅ Found ${cartItems.length} items in cart`);
    } catch (cartErr) {
      console.log("⚠️ Could not fetch cart items:", cartErr.message);
      // Continue with "ALL" fallback
    }

    // 7. Build dynamic article_ids array
    // If cart items are available, use specific article IDs; otherwise use "ALL"
    const shippingValue = Number(service_plan.rate || 0);
    let articleIds = [];

    if (cartItems && cartItems.length > 0) {
      // Extract article IDs from cart items
      // Article ID can be in: article.uid, article.identifier.upc, identifiers.identifier, or item key
      cartItems.forEach((item, index) => {
        const articleId = 
          item.article?.uid || 
          item.article?.identifier?.upc || 
          item.identifiers?.identifier ||
          item.key?.split('_')[0] || // Extract from key format: "articleId_size_delivery"
          null;

        if (articleId) {
          // Distribute shipping value equally across all items
          // You can also distribute based on item value/weight if needed
          const itemShippingValue = Math.round((shippingValue / cartItems.length) * 100) / 100;
          
          articleIds.push({
            article_id: articleId,
            value: itemShippingValue,
          });
        } else {
          console.log(`⚠️ Could not extract article_id for item ${index}:`, item);
        }
      });

      // If no article IDs were extracted, fallback to "ALL"
      if (articleIds.length === 0) {
        console.log("⚠️ No article IDs extracted, using 'ALL' fallback");
        articleIds = [
          {
            article_id: "ALL",
            value: shippingValue,
          },
        ];
      } else {
        console.log(`✅ Built dynamic article_ids array with ${articleIds.length} items`);
        // Adjust total to match shippingValue (handle rounding)
        const totalDistributed = articleIds.reduce((sum, item) => sum + item.value, 0);
        if (Math.abs(totalDistributed - shippingValue) > 0.01) {
          // Adjust last item to make total exact
          const difference = shippingValue - totalDistributed;
          articleIds[articleIds.length - 1].value += difference;
          articleIds[articleIds.length - 1].value = Math.round(articleIds[articleIds.length - 1].value * 100) / 100;
        }
      }
    } else {
      // Fallback to "ALL" if cart items not available
      console.log("⚠️ No cart items found, using 'ALL' fallback");
      articleIds = [
        {
          article_id: "ALL",
          value: shippingValue,
        },
      ];
    }

    console.log("📋 Dynamic article_ids:", JSON.stringify(articleIds, null, 2));

    // 8. Build payload as per Fynd SDK documentation
    // Required fields: value, message, article_level_distribution, collection, type, article_ids, cart_id
    const priceAdjustmentPayload = {
      // Required: Unique identifier of the cart
      cart_id: cart_id,

      // Required: The amount applied on the cart
      value: shippingValue,

      is_authenticated: true,

      // Required: The message associated with the price adjustment
      message: service_plan.name || "Shipping Charge",

      // Required: type of price adjustment
      // Valid values: "discount", "charge", "delivery_charge"
      type: "delivery_charge",

      // Required: Flag indicating whether the distribution should be done at the article level
      // Fynd API requires this to be true
      article_level_distribution: true,

      // Required: Collection object
      collection: {
        collected_by: "FYND",
        refund_by: "FYND",
      },

      // Required: The list of article objects in the price adjustment (DYNAMIC)
      article_ids: articleIds,

      // Optional: Flag indicating whether refunds are allowed at cart level
      allowed_refund: true,

      // Optional: Additional information regarding price adjustment
      meta: {
        extension_id: extensionId,
        service_plan_id: service_plan.id || null,
        service_code: service_plan.service_code || null,
      },

      // Optional: Restrictions for cancellation and return
      restrictions: {
        post_order: {
          cancellation_allowed: true,
          return_allowed: true,
        },
      },
    };

    console.log(
      "📋 Price Adjustment Payload:",
      JSON.stringify(priceAdjustmentPayload, null, 2)
    );

    // 9. Add price adjustment using SDK method
    let addAdjustmentResponse;
    try {
      addAdjustmentResponse = await appClient.cart.addPriceAdjustment({
        body: priceAdjustmentPayload,
      });

      console.log(
        "✅ Price adjustment added successfully:",
        JSON.stringify(addAdjustmentResponse?.data || addAdjustmentResponse, null, 2)
      );
    } catch (postErr) {
      console.error("❌ Failed to add price adjustment:", {
        message: postErr.message,
        response: postErr.response?.data || postErr.details,
        status: postErr.status,
      });

      // Extract numeric status code (postErr.status might be string like "Bad Request")
      const statusCode = typeof postErr.status === 'number' 
        ? postErr.status 
        : (postErr.response?.status || 400);

      return res.status(statusCode).json({
        success: false,
        message: "Failed to add price adjustment",
        error: postErr.response?.data || postErr.details || postErr.message,
      });
    }

    // 10. Fetch updated cart with breakup values
    console.log("🔄 Fetching updated cart...");
    let updatedCart = null;
    try {
      updatedCart = await appClient.cart.getCart({
        id: cart_id,
        b: true, // Include breakup values
      });
      console.log("📦 Cart fetched successfully");
      
      // Log breakup values if available
      if (updatedCart?.breakup_values) {
        console.log("📊 Cart breakup:", JSON.stringify(updatedCart.breakup_values.raw, null, 2));
      }
    } catch (cartErr) {
      console.log("⚠️ Could not fetch updated cart:", cartErr.message);
      // Continue anyway - adjustment was added successfully
    }

    // 11. Prepare and send response
    // Normalize cart_id: Fynd returns both cart_id (numeric) and id (MongoDB ObjectId string)
    // Use the MongoDB ObjectId string format (id) as it's more consistent and matches the input
    const normalizedCartId = updatedCart?.id || cart_id; // Prefer MongoDB ObjectId format
    const numericCartId = updatedCart?.cart_id || (typeof updatedCart?.id === 'string' ? null : updatedCart?.id);
    
    const responseData = {
      success: true,
      data: {
        cart_id: updatedCart?.cart_id || updatedCart?.id || cart_id,
        currency: updatedCart?.currency || {
          code: service_plan.currency,
          symbol: service_plan.currency === "ZAR" ? "R" : service_plan.currency,
        },
        service_plan: {
          name: service_plan.name || "Shipping Charge",
          rate: shippingValue,
          currency: service_plan.currency,
        },
        adjustment_add_response: addAdjustmentResponse?.data || addAdjustmentResponse || null,
        _cart_data: updatedCart || null,
      },
    };

    // Log cart ID formats for debugging
    if (normalizedCartId !== numericCartId) {
      console.log("ℹ️ Cart ID formats:", {
        mongo_id: normalizedCartId,
        numeric_id: numericCartId,
        note: "Fynd platform returns both formats - using MongoDB ObjectId (id) as primary"
      });
    }

    return res.json(responseData);
  } catch (error) {
    console.error("❌ Error in updateCartShipping:", {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
    });

    // Extract numeric status code safely
    const statusCode = typeof error.status === 'number' 
      ? error.status 
      : (error.response?.status || 500);

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to update cart shipping",
      error: error.response?.data || error.details || {},
    });
  }
};

/**
 * GET /priceadjustment
 * Query params:
 *  cart_id: string (Required)
 *
 * Headers:
 *  x-company-id: companyId (Required)
 *  x-application-id: applicationId (Required)
 */
const getPriceAdjustments = async (req, res) => {
  try {
    const companyId = req.headers["x-company-id"];
    const applicationId = req.headers["x-application-id"] || req.query.application_id;
    const { cart_id } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID required in header (x-company-id)",
      });
    }

    if (!applicationId) {
      return res.status(400).json({
        success: false,
        message: "Application ID required in header (x-application-id) or query param",
      });
    }

    if (!cart_id) {
      return res.status(400).json({
        success: false,
        message: "cart_id query parameter is required",
      });
    }

    const platformClient = await fdkExtension.getPlatformClient(companyId);
    if (!platformClient) {
      return res.status(500).json({
        success: false,
        message: "Failed to get platform client",
      });
    }

    const appClient = platformClient.application(applicationId);

    const adjustments = await appClient.cart.getPriceAdjustments({
      cartId: cart_id,
    });

    return res.json({
      success: true,
      data: adjustments?.data || adjustments,
    });
  } catch (error) {
    console.error("❌ Error in getPriceAdjustments:", error.message);
    const statusCode = typeof error.status === 'number' ? error.status : (error.response?.status || 500);
    return res.status(statusCode).json({
      success: false,
      message: error.message,
      error: error.response?.data || {},
    });
  }
};

/**
 * DELETE /priceadjustment/:id
 * Params:
 *  id: price adjustment ID (Required)
 *
 * Headers:
 *  x-company-id: companyId (Required)
 *  x-application-id: applicationId (Required)
 */
const removePriceAdjustment = async (req, res) => {
  try {
    const companyId = req.headers["x-company-id"];
    const applicationId = req.headers["x-application-id"] || req.body.application_id;
    const { id } = req.params;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID required in header (x-company-id)",
      });
    }

    if (!applicationId) {
      return res.status(400).json({
        success: false,
        message: "Application ID required in header (x-application-id) or body",
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Price adjustment ID is required in URL params",
      });
    }

    const platformClient = await fdkExtension.getPlatformClient(companyId);
    if (!platformClient) {
      return res.status(500).json({
        success: false,
        message: "Failed to get platform client",
      });
    }

    const appClient = platformClient.application(applicationId);

    await appClient.cart.removePriceAdjustment({
      id: id,
    });

    return res.json({
      success: true,
      message: "Price adjustment removed successfully",
    });
  } catch (error) {
    console.error("❌ Error in removePriceAdjustment:", error.message);
    const statusCode = typeof error.status === 'number' ? error.status : (error.response?.status || 500);
    return res.status(statusCode).json({
      success: false,
      message: error.message,
      error: error.response?.data || {},
    });
  }
};

module.exports = {
  updateCartShipping,
  getPriceAdjustments,
  removePriceAdjustment,
};
