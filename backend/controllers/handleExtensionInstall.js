const handleExtensionInstall = async (
  event_name,
  request_body,
  company_id,
  application_id
) => {
  console.log(
    "Extension install event received",
    event_name,
    request_body,
    company_id,
    application_id
  );
};

module.exports = handleExtensionInstall;
