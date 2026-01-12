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
const { companyId } = require("./config/constants");

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
    const platformClient = await fdkExtension.getPlatformClient(1);
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
    const platformClient = await fdkExtension.getPlatformClient(1);
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
      const platformClient = await fdkExtension.getPlatformClient(1);
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
      const platformClient = await fdkExtension.getPlatformClient(1);
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
      const platformClient = await fdkExtension.getPlatformClient(1);
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
      const platformClient = await fdkExtension.getPlatformClient(1);
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
    const platformClient = await fdkExtension.getPlatformClient(1);
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
      const platformClient = await fdkExtension.getPlatformClient(1);
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
    const platformClient = await fdkExtension.getPlatformClient(1);
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
