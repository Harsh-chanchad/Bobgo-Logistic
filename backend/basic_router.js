/**
 * This module sets up an Express router with various endpoints for handling logistics and file operations.
 * It interacts with a partner client to perform operations such as fetching courier partner schemes, creating schemes,
 * uploading files, and updating shipment statuses.
 */

const express = require("express");
const basicRouter = express.Router();
const fdkExtension = require("./fdk");
const { uploadFileToStorage } = require("./utils/fileUpload");
const path = require("path");

/**
 * Extracts company_id from request using fallback pattern
 * @param {Object} req - Express request object
 * @returns {string|number|null} - Company ID or null if not found
 */
const getCompanyId = (req) => {
  return (
    req.company_id ||
    req.headers?.["x-company-id"] ||
    req.query.company_id ||
    null
  );
};

/**
 * GET /test_basic_route
 * Fetches courier partner schemes for the specified organization.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} JSON response with courier partner schemes.
 * @throws {Error} 404 error if fetching fails.
 */
basicRouter.get("/test_basic_route", async function view(req, res, next) {
  const companyId = getCompanyId(req);
  console.log("company_id", companyId);
  try {
    const platformClient = await fdkExtension.getPlatformClient(companyId);

    const response =
      await platformClient.serviceability.getCourierPartnerSchemes({
        company_id: companyId,
        schemeType: "global",
      });

    // Filter to show only service plans belonging to this extension
    const myExtensionId = process.env.EXTENSION_API_KEY;

    const filteredItems =
      response.items?.filter((plan) => plan.extension_id === myExtensionId) ||
      [];

    const filteredResponse = {
      ...response,
      company_id: req.company_id || req.headers?.["x-company-id"],
      items: filteredItems,
      page: {
        ...response.page,
        size: filteredItems.length,
        item_total: filteredItems.length,
      },
    };

    console.log(`📊 Total plans in system: ${response.items?.length || 0}`);
    console.log(`🔑 Your extension ID: ${myExtensionId}`);
    console.log(`✅ Your plans: ${filteredItems.length}`);
    console.log(
      `📋 Your plan names: ${
        filteredItems.map((p) => p.name).join(", ") || "None"
      }`
    );

    res.json(filteredResponse);
  } catch (err) {
    console.error(err);
    console.log(JSON.stringify(err));
    res.status(404).json({ success: false });
  }
});

/**
 * GET /scheme/:schemeId
 * Fetches a specific courier partner scheme by scheme ID.
 *
 * @param {Object} req - Express request object with schemeId param.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} JSON response with the specific scheme details.
 * @throws {Error} 404 error if fetching fails.
 */
basicRouter.get("/scheme/:schemeId", async function view(req, res, next) {
  try {
    const { schemeId } = req.params;
    const headerCompanyId = req.headers["x-company-id"];

    if (!schemeId) {
      return res.status(400).json({
        success: false,
        message: "Scheme ID is required",
      });
    }

    if (!headerCompanyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID is required in header",
      });
    }

    // 1. Fetch scheme data
    const platformClient = await fdkExtension.getPlatformClient(
      headerCompanyId
    );
    const response =
      await platformClient.serviceability.getCourierPartnerSchemes({
        company_id: headerCompanyId,
        schemeType: "global",
      });

    const myExtensionId = process.env.EXTENSION_API_KEY;
    const scheme = response.items?.find(
      (plan) =>
        plan.scheme_id === schemeId && plan.extension_id === myExtensionId
    );

    if (!scheme) {
      console.log(`❌ Scheme not found: ${schemeId}`);
      return res.status(404).json({
        success: false,
        message: "Scheme not found or does not belong to this extension",
      });
    }

    // 2. Fetch configuration data
    const ConfigurationModel = require("./models/Configuration.model");
    const configModel = new ConfigurationModel();
    const configData = await configModel.getByCompanyId(headerCompanyId);
    configModel.close();

    // 3. Merge scheme + configuration data
    const mergedData = {
      ...scheme,
      credentials: configData
        ? {
            company_name: configData.company_name,
            bobgo_token: configData.delivery_partner_API_token,
            webhook_url: `curl -X POST 'https://bobgo-extension.fynd.com/v1.0/webhook/${headerCompanyId}'`,
          }
        : null,
    };

    console.log(`✅ Found scheme: ${scheme.name} (${schemeId})`);
    console.log(`📦 Transport type: ${scheme.transport_type}`);
    console.log(`🌍 Region: ${scheme.region}`);
    console.log(`💳 Payment modes: ${scheme.payment_mode?.join(", ")}`);
    console.log(`🔑 Credentials: ${configData ? "Found" : "Not found"}`);

    res.json({
      success: true,
      data: mergedData,
    });
  } catch (err) {
    console.error("Error fetching scheme:", err);
    console.log(JSON.stringify(err));
    res.status(500).json({
      success: false,
      message: "Failed to fetch scheme details",
      error: err.message,
    });
  }
});

/**
 * PUT /scheme/:schemeId
 * Updates an existing courier partner scheme.
 *
 * @param {Object} req - Express request object with schemeId param and scheme data in body.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} JSON response with the updated scheme details.
 * @throws {Error} 400/404/500 error if update fails.
 */
// basicRouter.put("/scheme/:schemeId", async function view(req, res, next) {
//   try {
//     const { schemeId } = req.params;
//     const schemeData = req.body;

//     if (!schemeId) {
//       return res.status(400).json({
//         success: false,
//         message: "Scheme ID is required",
//       });
//     }

//     if (!schemeData || Object.keys(schemeData).length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Scheme data is required",
//       });
//     }

//     const platformClient = await fdkExtension.getPlatformClient(companyId);

//     // Construct the update payload
//     const updatePayload = {
//       extension_id: process.env.EXTENSION_API_KEY,
//       scheme_id: schemeData._id || schemeId,
//       name: schemeData.name,
//       transport_type: schemeData.transport,
//       region: schemeData.region,
//       delivery_type: schemeData.delivery_type,
//       payment_mode: schemeData.payment_mode,
//       stage: schemeData.is_active ? "enabled" : "disabled",
//       weight: {
//         gte: schemeData.weight_min,
//         lte: schemeData.weight_max,
//       },
//       volumetric_weight: {
//         gte: schemeData.volumetric_weight_min,
//         lte: schemeData.volumetric_weight_max,
//       },
//       feature: schemeData.feature,
//     };

//     // Add optional fields if they exist
//     if (schemeData.description) {
//       updatePayload.description = schemeData.description;
//     }
//     if (
//       schemeData.feature &&
//       typeof schemeData.feature.ndr_attempts === "number"
//     ) {
//       updatePayload.ndr_attempts = schemeData.feature.ndr_attempts;
//     }
//     if (schemeData.feature && schemeData.feature.status_updates) {
//       updatePayload.status_updates = schemeData.feature.status_updates;
//     }
//     if (
//       schemeData.feature &&
//       typeof schemeData.feature.qc_shipment_item_quantity === "number"
//     ) {
//       updatePayload.qc_shipment_item_quantity =
//         schemeData.feature.qc_shipment_item_quantity;
//     }
//     if (
//       schemeData.feature &&
//       typeof schemeData.feature.non_qc_shipment_item_quantity === "number"
//     ) {
//       updatePayload.non_qc_shipment_item_quantity =
//         schemeData.feature.non_qc_shipment_item_quantity;
//     }

//     console.log(`📝 Updating scheme: ${schemeData.name} (${schemeId})`);
//     console.log(`🔄 Update payload:`, JSON.stringify(updatePayload, null, 2));

//     // Call the updateCourierPartnerScheme API
//     const response =
//       await platformClient.serviceability.updateCourierPartnerScheme({
//         company_id: companyId,
//         schemeId: schemeId,
//         body: updatePayload,
//       });

//     console.log(`✅ Scheme updated successfully: ${schemeData.name}`);

//     res.json({
//       success: true,
//       data: response,
//       message: "Scheme updated successfully",
//     });
//   } catch (err) {
//     console.error("Error updating scheme:", err);
//     console.log(JSON.stringify(err));

//     const statusCode = err.response?.status || 500;
//     const errorMessage =
//       err.response?.data?.message || err.message || "Failed to update scheme";

//     res.status(statusCode).json({
//       success: false,
//       message: errorMessage,
//       error: err.message,
//     });
//   }
// });

/**
 * PUT /scheme/:schemeId
 * Updates a courier partner scheme and its configuration.
 *
 * @param {Object} req - Express request object with schemeId param and x-company-id header.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} JSON response with success status.
 * @throws {Error} 500 error if update fails.
 */
basicRouter.put("/scheme/:schemeId", async function view(req, res, next) {
  try {
    const { schemeId } = req.params;
    const headerCompanyId = req.headers["x-company-id"];
    const { scheme_updates, credentials } = req.body;

    console.log("scheme_updates", scheme_updates);

    if (!schemeId || !headerCompanyId) {
      return res.status(400).json({
        success: false,
        message: "Scheme ID and Company ID are required",
      });
    }

    // 1. Update/Create Configuration (if credentials provided)
    if (credentials) {
      const ConfigurationModel = require("./models/Configuration.model");
      const configModel = new ConfigurationModel();

      const configData = {
        fynd_company_id: headerCompanyId,
        company_name: credentials.company_name,
        delivery_partner_API_token: credentials.bobgo_token,
      };

      await configModel.upsert(configData);
      configModel.close();
      console.log(`✅ Configuration saved for company ${headerCompanyId}`);
    }

    // 2. Update Scheme (if scheme_updates provided)
    if (scheme_updates) {
      const platformClient = await fdkExtension.getPlatformClient(
        headerCompanyId
      );

      // First, fetch the current scheme to get all existing fields
      const response =
        await platformClient.serviceability.getCourierPartnerSchemes({
          company_id: headerCompanyId,
          schemeType: "global",
        });

      const myExtensionId = process.env.EXTENSION_API_KEY;
      const currentScheme = response.items?.find(
        (plan) =>
          plan.scheme_id === schemeId && plan.extension_id === myExtensionId
      );

      if (!currentScheme) {
        return res.status(404).json({
          success: false,
          message: "Scheme not found",
        });
      }

      // Build feature object - merge existing with updates (ONLY boolean flags accepted by Platform API)
      // Note: ndr_attempts, status_updates, qc_shipment_item_quantity, non_qc_shipment_item_quantity, operation_scheme
      // are SCHEME-LEVEL fields, NOT feature object fields. The Platform API rejects them in the feature object.
      const buildFeatureObject = () => {
        const existingFeatures = currentScheme.feature || {};
        const updateFeatures = scheme_updates.feature || {};

        // Only boolean feature flags accepted by Platform API
        const defaultFeatures = {
          doorstep_qc: false,
          qr: false,
          mps: false,
          ndr: false,
          dangerous_goods: false,
          fragile_goods: false,
          restricted_goods: false,
          cold_storage_goods: false,
          doorstep_exchange: false,
          doorstep_return: false,
          product_installation: false,
          openbox_delivery: false,
          multi_pick_single_drop: false,
          single_pick_multi_drop: false,
          multi_pick_multi_drop: false,
          ewaybill: false,
        };

        // Fields that are NOT allowed in feature object (they're scheme-level)
        const schemeOnlyFields = [
          "ndr_attempts",
          "status_updates",
          "operation_scheme",
          "qc_shipment_item_quantity",
          "non_qc_shipment_item_quantity",
        ];

        // Merge: defaults -> existing -> updates (only boolean values)
        const merged = { ...defaultFeatures };

        // Apply existing boolean features only
        Object.entries(existingFeatures).forEach(([key, value]) => {
          if (typeof value === "boolean" && !schemeOnlyFields.includes(key)) {
            merged[key] = value;
          }
        });

        // Apply update boolean features only
        Object.entries(updateFeatures).forEach(([key, value]) => {
          if (typeof value === "boolean" && !schemeOnlyFields.includes(key)) {
            merged[key] = value;
          }
        });

        return merged;
      };

      // Helper to convert gte/lte to gt/lt format for weight fields
      const convertWeight = (weightObj, currentWeight, defaultWeight) => {
        const weight = weightObj ?? currentWeight ?? {};
        return {
          gt: weight.gte ?? weight.gt ?? defaultWeight.gt,
          lt: weight.lte ?? weight.lt ?? defaultWeight.lt,
        };
      };

      // Transform frontend payload to Platform API format
      const fdkPayload = {
        extension_id: process.env.EXTENSION_API_KEY,
        scheme_id: schemeId,
        name: scheme_updates.name ?? currentScheme.name ?? "",
        weight: convertWeight(scheme_updates.weight, currentScheme.weight, {
          gt: 0.01,
          lt: 100,
        }),
        volumetric_weight: convertWeight(
          scheme_updates.volumetric_weight,
          currentScheme.volumetric_weight,
          { gt: 0.01, lt: 1000 }
        ),
        transport_type:
          scheme_updates.transport_type?.toLowerCase() ??
          currentScheme.transport_type ??
          "surface",
        region:
          scheme_updates.region ??
          scheme_updates.feature?.operation_scheme ??
          currentScheme.region ??
          currentScheme.feature?.operation_scheme ??
          "intra-city",
        delivery_type:
          scheme_updates.delivery_type ??
          currentScheme.delivery_type ??
          "one-day",
        payment_mode: scheme_updates.payment_mode ??
          currentScheme.payment_mode ?? ["COD", "PREPAID"],
        stage: scheme_updates.stage ?? currentScheme.stage ?? "enabled",
        status_updates:
          scheme_updates.feature?.status_updates ??
          scheme_updates.status_updates ??
          currentScheme.feature?.status_updates ??
          currentScheme.status_updates ??
          "real-time",
        ndr_attempts:
          scheme_updates.feature?.ndr_attempts ??
          scheme_updates.ndr_attempts ??
          currentScheme.feature?.ndr_attempts ??
          currentScheme.ndr_attempts ??
          1,
        qc_shipment_item_quantity:
          scheme_updates.feature?.qc_shipment_item_quantity ??
          scheme_updates.qc_shipment_item_quantity ??
          currentScheme.feature?.qc_shipment_item_quantity ??
          currentScheme.qc_shipment_item_quantity ??
          1,
        non_qc_shipment_item_quantity:
          scheme_updates.feature?.non_qc_shipment_item_quantity ??
          scheme_updates.non_qc_shipment_item_quantity ??
          currentScheme.feature?.non_qc_shipment_item_quantity ??
          currentScheme.non_qc_shipment_item_quantity ??
          1,
        default_tat: {
          enabled:
            scheme_updates.default_tat?.enabled ??
            currentScheme.default_tat?.enabled ??
            false,
          tat: {
            min:
              scheme_updates.default_tat?.tat?.min ??
              currentScheme.default_tat?.tat?.min ??
              0,
            max:
              scheme_updates.default_tat?.tat?.max ??
              currentScheme.default_tat?.tat?.max ??
              0,
            unit:
              scheme_updates.default_tat?.tat?.unit ??
              currentScheme.default_tat?.tat?.unit ??
              "days",
          },
        },
        // Handle pickup_cutoff - only include if provided
        ...(scheme_updates.pickup_cutoff || currentScheme.pickup_cutoff
          ? {
              pickup_cutoff: {
                forward:
                  scheme_updates.pickup_cutoff?.forward ??
                  currentScheme.pickup_cutoff?.forward ??
                  "",
                reverse:
                  scheme_updates.pickup_cutoff?.reverse ??
                  currentScheme.pickup_cutoff?.reverse ??
                  "",
                timezone:
                  scheme_updates.pickup_cutoff?.timezone ??
                  currentScheme.pickup_cutoff?.timezone ??
                  "",
              },
            }
          : {}),
        feature: buildFeatureObject(),
      };

      // Validate required fields before sending
      if (!fdkPayload.name || fdkPayload.name.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Name is required and cannot be empty",
        });
      }

      console.log(
        `📝 Updating scheme via Platform API:`,
        JSON.stringify(fdkPayload, null, 2)
      );

      // Update scheme via Platform Client API
      try {
        const updateResponse =
          await platformClient.serviceability.updateCourierPartnerScheme({
            schemeId: schemeId,
            body: fdkPayload,
          });
        console.log(`✅ Scheme updated: ${schemeId}`);
        console.log(
          `📋 Update response:`,
          JSON.stringify(updateResponse, null, 2)
        );
      } catch (apiError) {
        const errorDetails = apiError.response?.data || apiError.message;
        const errorMessage =
          typeof errorDetails === "object"
            ? JSON.stringify(errorDetails, null, 2)
            : errorDetails;
        console.error(`❌ Platform API Error:`, errorMessage);
        console.error(
          `❌ Request body that failed:`,
          JSON.stringify(fdkPayload, null, 2)
        );
        return res.status(apiError.response?.status || 500).json({
          success: false,
          message: "Failed to save data",
          error: errorMessage,
        });
      }
    }

    res.json({
      success: true,
      message: "Data saved successfully",
    });
  } catch (err) {
    console.error("Error saving:", err);
    console.log(JSON.stringify(err));
    res.status(500).json({
      success: false,
      message: "Failed to save data",
      error: err.message,
    });
  }
});

/**
 * POST /scheme
 * Creates a new courier partner scheme.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} JSON response with the created scheme details.
 * @throws {Error} 404 error if creation fails.
 */
basicRouter.post("/scheme", async function view(req, res, next) {
  try {
    const companyId = getCompanyId(req);
    const platformClient = await fdkExtension.getPlatformClient(companyId);
    const response =
      await platformClient.serviceability.createCourierPartnerScheme({
        company_id: companyId,
        body: {
          extension_id: process.env.EXTENSION_API_KEY,
          scheme_id: "Scheme_id_5",
          name: "Scheme_name_5",
          weight: {
            lt: 10,
            gt: 1,
          },
          volumetric_weight: {
            lt: 10,
            gt: 1,
          },
          transport_type: "surface",
          region: "intra-city",
          delivery_type: "one-day",
          payment_mode: ["COD", "PREPAID"],
          stage: "enabled",
          status_updates: "real-time",
          ndr_attempts: 1,
          qc_shipment_item_quantity: 1,
          non_qc_shipment_item_quantity: 1,
          feature: {
            doorstep_qc: false,
            qr: false,
            mps: false,
            ndr: false,
            dangerous_goods: false,
            fragile_goods: false,
            restricted_goods: false,
            cold_storage_goods: false,
            doorstep_exchange: false,
            doorstep_return: false,
            product_installation: false,
            openbox_delivery: false,
            multi_pick_single_drop: false,
            single_pick_multi_drop: false,
            multi_pick_multi_drop: false,
            ewaybill: false,
          },
        },
      });
    console.log(JSON.stringify(response));
    res.json(response);
  } catch (err) {
    console.error(err);
    console.log(JSON.stringify(err));
    res.status(404).json({ success: false });
  }
});

/**
 * GET /countries
 * Retrieves a list of countries available for logistics operations.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} JSON response with the list of countries.
 * @throws {Error} 404 error if fetching fails.
 */
basicRouter.get("/countries", async function view(req, res, next) {
  try {
    const companyId = getCompanyId(req);
    const platformClient = await fdkExtension.getPlatformClient(companyId);
    const response = await platformClient.serviceability.getCountries({
      company_id: companyId,
      onboarding: true,
      q: "india",
    });
    console.log(JSON.stringify(response));
    res.json(response);
  } catch (err) {
    console.error(err);
    console.log(JSON.stringify(err));
    res.status(404).json({ success: false });
  }
});

/**
 * GET /sample_serv_file
 * Fetches a sample serviceability file for logistics operations.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} JSON response with the sample file details.
 * @throws {Error} 404 error if fetching fails.
 */
basicRouter.get("/sample_serv_file", async function view(req, res, next) {
  try {
    const companyId = getCompanyId(req);
    const platformClient = await fdkExtension.getPlatformClient(companyId);
    const response =
      await platformClient.serviceability.sampleFileServiceability({
        company_id: companyId,
        body: {
          country: "INDIA",
          region: "pincode",
          type: "serviceability",
        },
      });
    console.log(JSON.stringify(response));
    res.json(response);
  } catch (err) {
    console.error(err);
    console.log(JSON.stringify(err));
    res.status(404).json({ success: false });
  }
});

/**
 * GET /sample_tat_file
 * Fetches a sample TAT (Turnaround Time) file for logistics operations.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} JSON response with the sample file details.
 * @throws {Error} 404 error if fetching fails.
 */
basicRouter.get("/sample_tat_file", async function view(req, res, next) {
  try {
    const companyId = getCompanyId(req);
    const platformClient = await fdkExtension.getPlatformClient(companyId);
    const response =
      await platformClient.serviceability.sampleFileServiceability({
        company_id: companyId,
        body: {
          country: "INDIA",
          region: "city",
          type: "tat",
        },
      });
    console.log(JSON.stringify(response));
    res.json(response);
  } catch (err) {
    console.error(err);
    console.log(JSON.stringify(err));
    res.status(404).json({ success: false });
  }
});

/**
 * GET /sample_serv_tat_file_status
 * Retrieves the status of a sample serviceability or TAT file.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} JSON response with the file status.
 * @throws {Error} 404 error if fetching fails.
 */
basicRouter.get(
  "/sample_serv_tat_file_status",
  async function view(req, res, next) {
    try {
      const companyId = getCompanyId(req);
      const platformClient = await fdkExtension.getPlatformClient(companyId);
      const response =
        await platformClient.serviceability.getSampleFileServiceabilityStatus({
          company_id: companyId,
          batchId: "6761363a0456c5b5dcaa3b4a",
        });
      console.log(JSON.stringify(response));
      res.json(response);
    } catch (err) {
      console.error(err);
      console.log(JSON.stringify(err));
      res.status(404).json({ success: false });
    }
  }
);

/**
 * POST /start_and_complete_upload_servicability
 * Initiates and completes the upload of a serviceability file.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} JSON response with the upload completion details.
 * @throws {Error} 404 error if upload fails.
 */
basicRouter.post(
  "/start_and_complete_upload_servicability",
  async function view(req, res, next) {
    try {
      const companyId = getCompanyId(req);
      const platformClient = await fdkExtension.getPlatformClient(companyId);
      const response = await platformClient.fileStorage.startUpload({
        namespace: "test",
        company_id: companyId,
        body: {
          file_name: "sample_serv_file.csv",
          content_type: "text/csv",
          size: 500,
          tags: ["servicability"],
          params: {
            subpath: "test",
          },
        },
      });
      console.log(JSON.stringify(response));

      const uploadUrl = response.upload.url;
      // Replace with the path to your local file
      const filePath = path.resolve(__dirname, "../sample_serv_file.csv");
      // Replace with your file's MIME type
      const mimeType = "text/csv";
      console.log("---------------------------------------------");
      console.log(uploadUrl, filePath);
      console.log("---------------------------------------------");
      await uploadFileToStorage(uploadUrl, filePath, mimeType);

      const response_complte = await platformClient.fileStorage.completeUpload({
        namespace: "test",
        company_id: companyId,
        body: {
          file_name: response.file_name,
          file_path: response.file_path,
          content_type: response.content_type,
          method: response.method,
          namespace: response.namespace,
          operation: response.operation,
          size: response.size,
          upload: {
            expiry: response.upload.expiry,
            url: response.upload.url,
          },
          tags: response.tags,
        },
      });
      console.log(JSON.stringify(response_complte));
      res.json(response_complte);
    } catch (err) {
      console.error(err);
      console.log(JSON.stringify(err));
      res.status(404).json({ success: false });
    }
  }
);

/**
 * POST /start_and_complete_upload_tat
 * Initiates and completes the upload of a TAT file.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} JSON response with the upload completion details.
 * @throws {Error} 404 error if upload fails.
 */
basicRouter.post(
  "/start_and_complete_upload_tat",
  async function view(req, res, next) {
    try {
      const companyId = getCompanyId(req);
      const platformClient = await fdkExtension.getPlatformClient(companyId);
      const response = await platformClient.fileStorage.startUpload({
        namespace: "test",
        company_id: companyId,
        body: {
          file_name: "sample_tat_file.csv",
          content_type: "text/csv",
          size: 500,
          tags: ["tat"],
          params: {
            subpath: "test",
          },
        },
      });
      console.log(JSON.stringify(response));

      const uploadUrl = response.upload.url;
      // Replace with the path to your local file
      const filePath = path.resolve(__dirname, "../sample_tat_file.csv");
      // Replace with your file's MIME type
      const mimeType = "text/csv";
      console.log("---------------------------------------------");
      console.log(uploadUrl, filePath);
      console.log("---------------------------------------------");
      await uploadFileToStorage(uploadUrl, filePath, mimeType);

      const response_complte = await platformClient.fileStorage.completeUpload({
        namespace: "test",
        company_id: companyId,
        body: {
          file_name: response.file_name,
          file_path: response.file_path,
          content_type: response.content_type,
          method: response.method,
          namespace: response.namespace,
          operation: response.operation,
          size: response.size,
          upload: {
            expiry: response.upload.expiry,
            url: response.upload.url,
          },
          tags: response.tags,
        },
      });
      console.log(JSON.stringify(response_complte));
      res.json(response_complte);
    } catch (err) {
      console.error(err);
      console.log(JSON.stringify(err));
      res.status(404).json({ success: false });
    }
  }
);

/**
 * POST /upload_scheme_servicability
 * Uploads a serviceability scheme file.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} JSON response with the upload details.
 * @throws {Error} 404 error if upload fails.
 */
basicRouter.post(
  "/upload_scheme_servicability",
  async function view(req, res, next) {
    try {
      const companyId = getCompanyId(req);
      const platformClient = await fdkExtension.getPlatformClient(companyId);
      const response = await platformClient.serviceability.bulkServiceability({
        company_id: companyId,
        extensionId: process.env.EXTENSION_API_KEY,
        schemeId: "Scheme_id_3",
        body: {
          file_path:
            "https://cdn.fynd.com/v2/falling-surf-7c8bb8/fyprod/wrkr/test/general/free/original/sample_serv_file.csv",
          country: "India",
          action: "import",
          region: "Pincode",
        },
      });
      console.log(JSON.stringify(response));
      res.json(response);
    } catch (err) {
      console.error(err);
      console.log(JSON.stringify(err));
      res.status(404).json({ success: false });
    }
  }
);

/**
 * POST /upload_scheme_tat
 * Uploads a TAT scheme file.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} JSON response with the upload details.
 * @throws {Error} 404 error if upload fails.
 */
basicRouter.post("/upload_scheme_tat", async function view(req, res, next) {
  try {
    const companyId = getCompanyId(req);
    const platformClient = await fdkExtension.getPlatformClient(companyId);
    const response = await platformClient.serviceability.bulkTat({
      company_id: companyId,
      extensionId: process.env.EXTENSION_API_KEY,
      schemeId: "Scheme_id_3",
      body: {
        file_path:
          "https://cdn.fynd.com/v2/falling-surf-7c8bb8/fyprod/wrkr/test/general/free/original/sample_tat_file.csv",
        country: "India",
        action: "import",
        region: "City",
      },
    });
    console.log(JSON.stringify(response));
    res.json(response);
  } catch (err) {
    console.error(err);
    console.log(JSON.stringify(err));
    res.status(404).json({ success: false });
  }
});

/**
 * GET /scheme_serviceability_history
 * Retrieves the history of serviceability scheme uploads.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} JSON response with the history details.
 * @throws {Error} 404 error if fetching fails.
 */
basicRouter.get(
  "/scheme_serviceability_history",
  async function view(req, res, next) {
    try {
      const companyId = getCompanyId(req);
      const platformClient = await fdkExtension.getPlatformClient(companyId);
      const response =
        await platformClient.serviceability.getBulkServiceability({
          company_id: companyId,
          extensionId: process.env.EXTENSION_API_KEY,
          schemeId: "Scheme_id_3",
        });
      console.log(JSON.stringify(response));
      res.json(response);
    } catch (err) {
      console.error(err);
      console.log(JSON.stringify(err));
      res.status(404).json({ success: false });
    }
  }
);

/**
 * GET /scheme_tat_history
 * Retrieves the history of TAT scheme uploads.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} JSON response with the history details.
 * @throws {Error} 404 error if fetching fails.
 */
basicRouter.get("/scheme_tat_history", async function view(req, res, next) {
  try {
    const companyId = getCompanyId(req);
    const platformClient = await fdkExtension.getPlatformClient(companyId);
    const response = await platformClient.serviceability.getBulkTat({
      company_id: companyId,
      extensionId: process.env.EXTENSION_API_KEY,
      schemeId: "Scheme_id_3",
      batchId: "674eda8262b934d3a7c31f22",
      action: "import",
      status: "processing",
      country: "India",
      region: "Pincode",
      startDate: "2024-12-01T18:30:00Z",
      endDate: "2024-12-04T18:30:00Z",
    });
    console.log(JSON.stringify(response));
    res.json(response);
  } catch (err) {
    console.error(err);
    console.log(JSON.stringify(err));
    res.status(404).json({ success: false });
  }
});

/**
 * POST /create_seller_account
 * Creates a new seller account for a courier partner.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} JSON response with the account creation details.
 * @throws {Error} 404 error if creation fails.
 */
basicRouter.post("/create_seller_account", async function view(req, res, next) {
  try {
    const companyId = getCompanyId(req);
    const platformClient = await fdkExtension.getPlatformClient(companyId);
    const response =
      await platformClient.serviceability.createCourierPartnerAccount({
        company_id: companyId,
        companyId: 9294,
        body: {
          extension_id: process.env.EXTENSION_API_KEY,
          account_id: "Scheme_id_3_company_id_9294",
          scheme_id: "Scheme_id_3",
          is_self_ship: false,
          stage: "enabled",
          is_own_account: true,
        },
      });

    console.log(JSON.stringify(response));
    res.json(response);
  } catch (err) {
    console.error(err);
    console.log(JSON.stringify(err));
    res.status(404).json({ success: false });
  }
});

/**
 * POST /update_shipment_status
 * Updates the status of a shipment.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} JSON response with the update details.
 * @throws {Error} 404 error if update fails.
 */
basicRouter.post(
  "/update_shipment_status",
  async function view(req, res, next) {
    try {
      const platformClient = await fdkExtension.getPlatformClient(9294);
      const response = await platformClient.order.updateShipmentStatus({
        body: {
          task: false,
          force_transition: false,
          lock_after_transition: false,
          unlock_before_transition: false,
          resume_tasks_after_unlock: false,
          statuses: [
            {
              shipments: [
                {
                  identifier: "17334083479041568015",
                  products: [],
                  data_updates: {
                    entities: [
                      {
                        filters: [],
                        data: {
                          meta: {
                            courier_partner_extension_id:
                              process.env.EXTENSION_API_KEY,
                            courier_partner_scheme_id: "Scheme_id_3",
                            sort_code: "1129",
                            ewaybill_info: {
                              success: true,
                            },
                            waybill: ["6806010004126"],
                            tracking_url:
                              "https://www.test.com/track/package/6806010004126",
                            courier_partner_shipper_name: "Test",
                            logistics_meta: {
                              remark: "NAN",
                            },
                            is_own_account: true,
                            shipping_label_provided: false,
                            estimated_delivery_date: null,
                            promised_delivery_date: null,
                            rider_details: {
                              name: "Paras",
                              phone: "+9967539854",
                            },
                            label:
                              "https://cdn.fynd.com/v2/falling-surf-7c8bb8/fyprod/wrkr/documents/label/PDFs/17291005908611498449.pdf",
                            courier_partner_name: "Test Partner Name",
                          },
                          delivery_awb_number: "6806010004126",
                          pdf_links: {
                            label:
                              "https://cdn.fynd.com/v2/falling-surf-7c8bb8/fyprod/wrkr/documents/label/PDFs/17291005908611498449.pdf",
                          },
                        },
                      },
                    ],
                    products: [
                      {
                        filters: [],
                        data: {
                          meta: {
                            courier_partner_extension_id:
                              process.env.EXTENSION_API_KEY,
                            courier_partner_scheme_id: "Scheme_id_3",
                            sort_code: "1129",
                            ewaybill_info: {
                              success: true,
                            },
                            waybill: ["6806010004126"],
                            tracking_url:
                              "https://www.test.com/track/package/6806010004126",
                            courier_partner_shipper_name: "Test",
                            is_own_account: true,
                            estimated_delivery_date: null,
                            promised_delivery_date: null,
                            rider_details: {
                              name: "Paras",
                              phone: "+9967539854",
                            },
                            label:
                              "https://cdn.fynd.com/v2/falling-surf-7c8bb8/fyprod/wrkr/documents/label/PDFs/17291005908611498449.pdf",
                            courier_partner_name: "Test Partner Name",
                          },
                          delivery_awb_number: "6806010004126",
                        },
                      },
                    ],
                    order_item_status: [
                      {
                        filters: [],
                        data: {
                          meta: {
                            courier_partner_details: {
                              courier_partner_extension_id:
                                process.env.EXTENSION_API_KEY,
                              courier_partner_scheme_id: "Scheme_id_3",
                              courier_partner_name: "Test Partner Name",
                              is_own_account: true,
                              courier_partner_shipper_name: "Test",
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              ],
              status: "dp_assigned",
              exclude_bags_next_state: "",
              split_shipment: false,
            },
          ],
        },
      });
      console.log(JSON.stringify(response));
      res.json(response);
    } catch (err) {
      console.error(err);
      console.log(JSON.stringify(err));
      res.status(404).json({ success: false });
    }
  }
);

/**
 * POST /update_shipment_tracking
 * Updates the tracking information of a shipment.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} JSON response with the tracking update details.
 * @throws {Error} 404 error if update fails.
 */
basicRouter.post(
  "/update_shipment_tracking",
  async function view(req, res, next) {
    try {
      const platformClient = await fdkExtension.getPlatformClient(9294);
      const response = await platformClient.order.updateShipmentTracking({
        body: {
          awb: "6806010004126",
          dp_location: "Mumbai",
          dp_name: "Test bluedart",
          dp_status: "out_for_delivery",
          dp_status_updated_at: "2024-12-06T10:15:30Z",
          estimated_delivery_date: "2024-12-10T10:15:30Z",
          journey: "forward",
          meta: {},
          operational_status: "great",
          promised_delivery_date: "2024-12-10T10:15:30Z",
          remark: "Not Applicable",
          shipment_id: "17334083479041568015",
        },
      });
      console.log(JSON.stringify(response));
      res.json(response);
    } catch (err) {
      console.error(err);
      console.log(JSON.stringify(err));
      res.status(404).json({ success: false });
    }
  }
);

module.exports = basicRouter;
