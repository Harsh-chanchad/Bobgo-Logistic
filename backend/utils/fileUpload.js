const axios = require("axios");
const fs = require("fs");

/**
 * Uploads a file to a specified storage service using a PUT request.
 *
 * @param {string} uploadUrl - The URL to which the file will be uploaded.
 * @param {string} filePath - The local file path of the file to be uploaded.
 * @param {string} mimeType - The MIME type of the file being uploaded.
 * @returns {Promise<void>} - A promise that resolves when the file is successfully uploaded.
 * @throws Will log an error message if the upload fails, including the HTTP status and response data if available.
 */
async function uploadFileToStorage(uploadUrl, filePath, mimeType) {
    try {
        // Read the file as a buffer
        const fileBuffer = fs.readFileSync(filePath);

        // Make the PUT request to upload the file
        const response = await axios.put(uploadUrl, fileBuffer, {
            headers: {
                "Content-Type": mimeType,
            },
        });

        console.log("File uploaded successfully:", response.status, response.statusText);
    } catch (error) {
        console.error("Error uploading file:", error.response?.status, error.response?.data || error.message);
    }
}


module.exports = {
    uploadFileToStorage
};
