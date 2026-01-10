/**
 * Handles the assignment of a courier partner.
 *
 * @param {string} event_name - The name of the event triggering the handler.
 * @param {Object} request_body - The body of the request containing relevant data.
 * @param {string} company_id - The identifier for the company.
 * @param {string} application_id - The identifier for the application.
 *
 * @returns {Promise<void>} - A promise that resolves when the handler completes.
 *
 * @throws {Error} - If any error occurs during the handling process.
 */
async function courierPartnerAsignHandler(
  event_name,
  request_body,
  company_id,
  application_id
) {
  console.log(JSON.stringify(request_body));
  console.log(event_name);
  console.log(company_id);
  console.log(application_id);
}

/**
 * Handles the cancellation of a courier partner.
 *
 * @param {string} event_name - The name of the event triggering the handler.
 * @param {Object} request_body - The body of the request containing relevant data.
 * @param {string} company_id - The identifier for the company.
 * @param {string} application_id - The identifier for the application.
 *
 * @returns {Promise<void>} - A promise that resolves when the handler completes.
 *
 * @throws {Error} - If any error occurs during the handling process.
 */
async function courierPartnerCancelHandler(
  event_name,
  request_body,
  company_id,
  application_id
) {
  console.log(JSON.stringify(request_body));
  console.log(event_name);
  console.log(company_id);
  console.log(application_id);
}

module.exports = {
  courierPartnerAsign: courierPartnerAsignHandler,
  courierPartnerCancel: courierPartnerCancelHandler,
};
