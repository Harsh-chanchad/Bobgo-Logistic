import axios from "axios";
import urlJoin from "url-join";

const MAIN_URL = window.location.origin;

/**
 * API utility functions for interacting with the backend
 */
export const api = {
  /**
   * Fetches all courier partner schemes for the organization
   * @returns {Promise<Object>} Response containing all schemes
   */
  getAllSchemes: async () => {
    try {
      const { data } = await axios.get(
        urlJoin(MAIN_URL, "/apibasic/test_basic_route")
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
   * @returns {Promise<Object>} Response containing the scheme details
   */
  getSchemeById: async (schemeId) => {
    if (!schemeId) {
      return {
        success: false,
        error: "Scheme ID is required",
      };
    }

    try {
      const { data } = await axios.get(
        urlJoin(MAIN_URL, `/apibasic/scheme/${schemeId}`)
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
   * @returns {Promise<Object>} Response containing the created scheme
   */
  createScheme: async (schemeData) => {
    try {
      const { data } = await axios.post(
        urlJoin(MAIN_URL, "/apibasic/scheme"),
        schemeData
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
   * @returns {Promise<Object>} Response containing the created account
   */
  createSellerAccount: async (accountData) => {
    try {
      const { data } = await axios.post(
        urlJoin(MAIN_URL, "/apibasic/create_seller_account"),
        accountData
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
   * @returns {Promise<Object>} Response containing the update result
   */
  updateShipmentStatus: async (statusData) => {
    try {
      const { data } = await axios.post(
        urlJoin(MAIN_URL, "/apibasic/update_shipment_status"),
        statusData
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
   * @returns {Promise<Object>} Response containing the update result
   */
  updateShipmentTracking: async (trackingData) => {
    try {
      const { data } = await axios.post(
        urlJoin(MAIN_URL, "/apibasic/update_shipment_tracking"),
        trackingData
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
   * @returns {Promise<Object>} Response containing the upload result
   */
  uploadServiceability: async (filePath, schemeId, options = {}) => {
    try {
      const { data } = await axios.post(
        urlJoin(MAIN_URL, "/apibasic/upload_scheme_servicability"),
        {
          file_path: filePath,
          scheme_id: schemeId,
          country: options.country || "India",
          region: options.region || "Pincode",
          action: options.action || "import",
        }
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
   * @returns {Promise<Object>} Response containing the upload result
   */
  uploadTAT: async (filePath, schemeId, options = {}) => {
    try {
      const { data } = await axios.post(
        urlJoin(MAIN_URL, "/apibasic/upload_scheme_tat"),
        {
          file_path: filePath,
          scheme_id: schemeId,
          country: options.country || "India",
          region: options.region || "City",
          action: options.action || "import",
        }
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
   * @returns {Promise<Object>} Response containing the history
   */
  getServiceabilityHistory: async (schemeId) => {
    try {
      const { data } = await axios.get(
        urlJoin(MAIN_URL, "/apibasic/scheme_serviceability_history"),
        { params: { schemeId } }
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
   * @returns {Promise<Object>} Response containing the history
   */
  getTATHistory: async (schemeId) => {
    try {
      const { data } = await axios.get(
        urlJoin(MAIN_URL, "/apibasic/scheme_tat_history"),
        { params: { schemeId } }
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
};

export default api;
