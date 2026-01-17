import axios from "axios";
import urlJoin from "url-join";

const MAIN_URL = window.location.origin;

/**
 * API utility functions for interacting with the backend
 */
export const api = {
  /**
   * Fetches all courier partner schemes for the organization
   * @param {string|number} companyId - Company ID (optional, can be in header, query, or route param)
   * @returns {Promise<Object>} Response containing all schemes
   */
  getAllSchemes: async (companyId) => {
    try {
      const config = companyId
        ? {
            headers: {
              "x-company-id": companyId,
            },
          }
        : {};
      const { data } = await axios.get(
        urlJoin(MAIN_URL, "/apibasic/test_basic_route"),
        config
      );
      return { success: true, data };
    } catch (error) {
      console.error("Error fetching all schemes:", error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  /**
   * Fetches a specific scheme by ID
   * @param {string} schemeId - The scheme ID to fetch
   * @param {string|number} companyId - Company ID (optional, can be in header, query, or route param)
   * @returns {Promise<Object>} Response containing the scheme details
   */
  getSchemeById: async (schemeId, companyId) => {
    if (!schemeId) {
      return {
        success: false,
        error: "Scheme ID is required",
      };
    }

    try {
      const config = companyId
        ? {
            headers: {
              "x-company-id": companyId,
            },
          }
        : {};
      const { data } = await axios.get(
        urlJoin(MAIN_URL, `/apibasic/scheme/${schemeId}`),
        config
      );
      return data;
    } catch (error) {
      console.error(`Error fetching scheme ${schemeId}:`, error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  /**
   * Fetches scheme with merged configuration data
   * @param {string} schemeId - The scheme ID
   * @param {string|number} companyId - Company ID for configuration
   * @returns {Promise<Object>} Response containing scheme + config data
   */
  getSchemeWithConfig: async (schemeId, companyId) => {
    if (!schemeId) {
      return {
        success: false,
        error: "Scheme ID is required",
      };
    }

    if (!companyId) {
      return {
        success: false,
        error: "Company ID is required",
      };
    }

    try {
      const { data } = await axios.get(
        urlJoin(MAIN_URL, `/apibasic/scheme/${schemeId}`),
        {
          headers: {
            "x-company-id": companyId,
          },
        }
      );
      return data;
    } catch (error) {
      console.error(`Error fetching scheme with config:`, error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  /**
   * Saves scheme and configuration data
   * @param {string} schemeId - The scheme ID
   * @param {string|number} companyId - Company ID
   * @param {Object} updates - { scheme_updates, credentials }
   * @returns {Promise<Object>} Response with success status
   */
  /**
   * Saves only default_tat, delivery_partner_API_token, and company_name to Configuration table
   * @param {string} schemeId - The scheme ID (required for endpoint but not used in backend)
   * @param {string|number} companyId - Company ID
   * @param {Object} updates - Object containing default_tat, delivery_partner_API_token, and company_name
   * @param {Object} updates.default_tat - { min_tat: number, max_tat: number, unit: string }
   * @param {string} updates.delivery_partner_API_token - Bobgo API token
   * @param {string} updates.company_name - Company name
   * @returns {Promise<Object>} Response from backend
   */
  saveSchemeData: async (schemeId, companyId, updates) => {
    if (!schemeId || !companyId) {
      return {
        success: false,
        error: "Scheme ID and Company ID are required",
      };
    }

    try {
      const { data } = await axios.put(
        urlJoin(MAIN_URL, `/apibasic/scheme/${schemeId}`),
        updates,
        {
          headers: {
            "x-company-id": companyId,
          },
        }
      );
      return data;
    } catch (error) {
      console.error(`Error saving scheme data:`, error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  /**
   * Creates a new courier partner scheme
   * @param {Object} schemeData - The scheme data to create
   * @param {string|number} companyId - Company ID (optional, can be in header, query, or route param)
   * @returns {Promise<Object>} Response containing the created scheme
   */
  createScheme: async (schemeData, companyId) => {
    try {
      const config = companyId
        ? {
            headers: {
              "x-company-id": companyId,
            },
          }
        : {};
      const { data } = await axios.post(
        urlJoin(MAIN_URL, "/apibasic/scheme"),
        schemeData,
        config
      );
      return { success: true, data };
    } catch (error) {
      console.error("Error creating scheme:", error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  /**
   * Creates a seller account for a courier partner
   * @param {Object} accountData - The account data to create
   * @param {string|number} companyId - Company ID (optional, can be in header, query, or route param)
   * @returns {Promise<Object>} Response containing the created account
   */
  createSellerAccount: async (accountData, companyId) => {
    try {
      const config = companyId
        ? {
            headers: {
              "x-company-id": companyId,
            },
          }
        : {};
      const { data } = await axios.post(
        urlJoin(MAIN_URL, "/apibasic/create_seller_account"),
        accountData,
        config
      );
      return { success: true, data };
    } catch (error) {
      console.error("Error creating seller account:", error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  /**
   * Updates shipment status
   * @param {Object} statusData - The status update data
   * @param {string|number} companyId - Company ID (optional, can be in header, query, or route param)
   * @returns {Promise<Object>} Response containing the update result
   */
  updateShipmentStatus: async (statusData, companyId) => {
    try {
      const config = companyId
        ? {
            headers: {
              "x-company-id": companyId,
            },
          }
        : {};
      const { data } = await axios.post(
        urlJoin(MAIN_URL, "/apibasic/update_shipment_status"),
        statusData,
        config
      );
      return { success: true, data };
    } catch (error) {
      console.error("Error updating shipment status:", error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  /**
   * Updates shipment tracking information
   * @param {Object} trackingData - The tracking update data
   * @param {string|number} companyId - Company ID (optional, can be in header, query, or route param)
   * @returns {Promise<Object>} Response containing the update result
   */
  updateShipmentTracking: async (trackingData, companyId) => {
    try {
      const config = companyId
        ? {
            headers: {
              "x-company-id": companyId,
            },
          }
        : {};
      const { data } = await axios.post(
        urlJoin(MAIN_URL, "/apibasic/update_shipment_tracking"),
        trackingData,
        config
      );
      return { success: true, data };
    } catch (error) {
      console.error("Error updating shipment tracking:", error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  /**
   * Uploads a serviceability scheme file
   * @param {string} filePath - The CDN path of the uploaded file
   * @param {string} schemeId - The scheme ID to upload for
   * @param {Object} options - Additional options (country, region, action)
   * @param {string|number} companyId - Company ID (optional, can be in header, query, or route param)
   * @returns {Promise<Object>} Response containing the upload result
   */
  uploadServiceability: async (filePath, schemeId, options = {}, companyId) => {
    try {
      const config = companyId
        ? {
            headers: {
              "x-company-id": companyId,
            },
          }
        : {};
      const { data } = await axios.post(
        urlJoin(MAIN_URL, "/apibasic/upload_scheme_servicability"),
        {
          file_path: filePath,
          scheme_id: schemeId,
          country: options.country || "India",
          region: options.region || "Pincode",
          action: options.action || "import",
        },
        config
      );
      return { success: true, data };
    } catch (error) {
      console.error("Error uploading serviceability:", error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  /**
   * Uploads a TAT scheme file
   * @param {string} filePath - The CDN path of the uploaded file
   * @param {string} schemeId - The scheme ID to upload for
   * @param {Object} options - Additional options (country, region, action)
   * @param {string|number} companyId - Company ID (optional, can be in header, query, or route param)
   * @returns {Promise<Object>} Response containing the upload result
   */
  uploadTAT: async (filePath, schemeId, options = {}, companyId) => {
    try {
      const config = companyId
        ? {
            headers: {
              "x-company-id": companyId,
            },
          }
        : {};
      const { data } = await axios.post(
        urlJoin(MAIN_URL, "/apibasic/upload_scheme_tat"),
        {
          file_path: filePath,
          scheme_id: schemeId,
          country: options.country || "India",
          region: options.region || "City",
          action: options.action || "import",
        },
        config
      );
      return { success: true, data };
    } catch (error) {
      console.error("Error uploading TAT:", error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  /**
   * Gets serviceability history for a scheme
   * @param {string} schemeId - The scheme ID
   * @param {string|number} companyId - Company ID (optional, can be in header, query, or route param)
   * @returns {Promise<Object>} Response containing the history
   */
  getServiceabilityHistory: async (schemeId, companyId) => {
    try {
      const config = {
        params: { schemeId },
      };
      if (companyId) {
        config.headers = {
          "x-company-id": companyId,
        };
      }
      const { data } = await axios.get(
        urlJoin(MAIN_URL, "/apibasic/scheme_serviceability_history"),
        config
      );
      return { success: true, data };
    } catch (error) {
      console.error("Error fetching serviceability history:", error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  /**
   * Gets TAT history for a scheme
   * @param {string} schemeId - The scheme ID
   * @param {string|number} companyId - Company ID (optional, can be in header, query, or route param)
   * @returns {Promise<Object>} Response containing the history
   */
  getTATHistory: async (schemeId, companyId) => {
    try {
      const config = {
        params: { schemeId },
      };
      if (companyId) {
        config.headers = {
          "x-company-id": companyId,
        };
      }
      const { data } = await axios.get(
        urlJoin(MAIN_URL, "/apibasic/scheme_tat_history"),
        config
      );
      return { success: true, data };
    } catch (error) {
      console.error("Error fetching TAT history:", error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  /**
   * Updates cart price with selected service plan
   * @param {string} cartId - Fynd cart ID
   * @param {string} applicationId - Fynd application ID
   * @param {Object} servicePlan - Selected service plan object
   * @param {string|number} companyId - Company ID
   * @returns {Promise<Object>} Response from backend
   */
  updateCartPrice: async (cartId, applicationId, servicePlan, companyId) => {
    if (!cartId || !applicationId || !servicePlan || !companyId) {
      return {
        success: false,
        error: "cartId, applicationId, servicePlan, and companyId are required",
      };
    }

    try {
      const { data } = await axios.post(
        urlJoin(MAIN_URL, "/api/checkout/priceadjustment"),
        {
          cart_id: cartId,
          application_id: applicationId,
          service_plan: servicePlan,
        },
        {
          headers: {
            "x-company-id": companyId,
            "Content-Type": "application/json",
          },
        }
      );
      return data;
    } catch (error) {
      console.error("Error updating cart price:", error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        details: error.response?.data,
      };
    }
  },

  /**
   * Gets service plans for checkout
   * @param {Object} deliveryAddress - Delivery address object
   * @param {Array} items - Array of items
   * @param {string|number} companyId - Company ID
   * @returns {Promise<Object>} Response containing service plans
   */
  getServicePlans: async (deliveryAddress, items, companyId) => {
    if (!deliveryAddress || !items || !companyId) {
      return {
        success: false,
        error: "deliveryAddress, items, and companyId are required",
      };
    }

    try {
      const { data } = await axios.post(
        urlJoin(MAIN_URL, "/api/checkout/getServicePlan"),
        {
          delivery_address: deliveryAddress,
          items: items,
        },
        {
          headers: {
            "x-company-id": companyId,
            "Content-Type": "application/json",
          },
        }
      );
      return data;
    } catch (error) {
      console.error("Error fetching service plans:", error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        details: error.response?.data,
      };
    }
  },
};

export default api;
