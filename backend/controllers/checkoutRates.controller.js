const express = require("express");
const axios = require("axios");

/**
 * Normalize delivery address to match BobGo API requirements
 * Converts country names to ISO codes and zone names to abbreviations
 */
const normalizeDeliveryAddress = (address) => {
  if (!address) return address;

  // Country name to ISO code mapping
  const countryCodeMap = {
    "south africa": "ZA",
    southafrica: "ZA",
    za: "ZA",
  };

  // Zone name to abbreviation mapping (South Africa)
  const zoneAbbreviationMap = {
    gauteng: "GP",
    "western cape": "WC",
    "kwazulu-natal": "KZN",
    kzn: "KZN",
    "eastern cape": "EC",
    limpopo: "LP",
    mpumalanga: "MP",
    "north west": "NW",
    "free state": "FS",
    "northern cape": "NC",
  };

  const normalized = { ...address };

  // Normalize country: convert to uppercase and map if needed
  if (normalized.country) {
    const countryLower = normalized.country.toLowerCase().trim();
    if (countryCodeMap[countryLower]) {
      normalized.country = countryCodeMap[countryLower];
    } else if (countryLower.length === 2) {
      // Already a code, just uppercase it
      normalized.country = countryLower.toUpperCase();
    }
  }

  // Normalize zone: convert to uppercase and map if needed
  if (normalized.zone) {
    const zoneLower = normalized.zone.toLowerCase().trim();
    if (zoneAbbreviationMap[zoneLower]) {
      normalized.zone = zoneAbbreviationMap[zoneLower];
    } else if (zoneLower.length <= 3) {
      // Already an abbreviation, just uppercase it
      normalized.zone = zoneLower.toUpperCase();
    }
  }

  return normalized;
};

const getServicePlan = async (req, res) => {
  try {
    console.log("✅ getServicePlan endpoint hit!");
    console.log("📥 Request method:", req.method);
    console.log("📥 Request path:", req.path);
    console.log("📥 Request headers:", JSON.stringify(req.headers, null, 2));
    console.log("📥 Request body:", JSON.stringify(req.body, null, 2));

    // Get company ID from header
    const headerCompanyId = req.headers["x-company-id"];

    if (!headerCompanyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID is required in x-company-id header",
      });
    }

    // Get delivery_address and items from request body (frontend)
    let { delivery_address, items } = req.body;

    console.log("delivery_address" , delivery_address);

    if (!delivery_address) {
      return res.status(400).json({
        success: false,
        message: "delivery_address is required in request body",
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "items array is required in request body",
      });
    }

    // Ensure delivery_address has all required fields before normalization
    // Ensure street_address and code (postal code) are preserved
    if (!delivery_address.street_address && delivery_address.address) {
      delivery_address.street_address = delivery_address.address;
    }
    if (!delivery_address.code) {
      // Map code from other possible field names (postal_code, pincode, zip)
      delivery_address.code = 
        delivery_address.postal_code || 
        delivery_address.pincode || 
        delivery_address.zip || 
        delivery_address.code || 
        "";
    }

    // Normalize delivery address (convert country names to codes, zones to abbreviations)
    delivery_address = normalizeDeliveryAddress(delivery_address);

    // Ensure normalized address still has code field (it might be lost during normalization)
    if (!delivery_address.code && delivery_address.postal_code) {
      delivery_address.code = delivery_address.postal_code;
    }

    console.log(
      "📋 Normalized delivery_address:",
      JSON.stringify(delivery_address, null, 2)
    );

    // Fetch configuration from database
    const ConfigurationModel = require("../models/Configuration.model");
    const configModel = new ConfigurationModel();
    const configData = await configModel.getByCompanyId(headerCompanyId);
    configModel.close();

    if (!configData) {
      return res.status(404).json({
        success: false,
        message:
          "Configuration not found for this company. Please configure your settings first.",
      });
    }

    // Build collection_address from configuration database
    // Normalize collection address as well
    // Map code field - check multiple possible field names (code, postal_code, pincode)
    const collectionCode = 
      configData.code || 
      configData.postal_code || 
      configData.pincode || 
      "0181";
      // TODO : need to add field for code from configuration

    const collection_address = normalizeDeliveryAddress({
      company: configData.company_name || "Bob Go",
      street_address: configData.street_address || "",
      local_area: configData.local_area || "",
      city: configData.city || "",
      zone: configData.zone || "",
      country: configData.country_code || configData.country || "",
      code: collectionCode, // Postal code from config
    });

    console.log(
      "📋 Collection address:",
      JSON.stringify(collection_address, null, 2)
    );

    // Get declared_value and handling_time from configuration database
    const declared_value = configData.shipment_declared_value || 0;
    const handling_time = configData.shipment_handling_time || 2;

    // Build payload for BobGo API
    const payload = {
      collection_address,
      delivery_address, // From frontend
      items, // From frontend
      declared_value, // From configuration
      handling_time, // From configuration
    };

    // Get API URL and token from configuration
    const apiUrl =
      configData.delivery_partner_URL || "https://api.sandbox.bobgo.co.za";
    const apiToken =
      configData.delivery_partner_API_token || process.env.BOBGO_TOKEN;

    if (!apiToken) {
      return res.status(400).json({
        success: false,
        message:
          "API token not configured. Please set delivery_partner_API_token in configuration.",
      });
    }

    // Construct the full API endpoint URL
    const bobgoApiUrl = `${apiUrl.replace(/\/$/, "")}/v2/rates-at-checkout`;

    console.log("📦 Calling BobGo API:", bobgoApiUrl);
    console.log("📋 Payload:", JSON.stringify(payload, null, 2));

    // Call BobGo API to get the service plan
    const response = await axios.post(bobgoApiUrl, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `bearer ${apiToken}`, // BobGo API expects lowercase "bearer"
        Accept: "*/*",
      },
    });

    return res.json({
      success: true,
      data: response.data,
    });
  } catch (err) {
    console.error("BobGo API Error:", {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
    });
    return res.status(err.response?.status || 500).json({
      success: false,
      message: err.message,
      error: err.response?.data || "Unknown error",
    });
  }
};

module.exports = { getServicePlan };
