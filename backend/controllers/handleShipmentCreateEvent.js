const handleShipmentCreateEvent = async (
  event_name,
  request_body,
  company_id,
  application_id
) => {
  console.log(
    "✅ Shipment create event received",
    event_name,
    request_body,
    company_id,
    application_id
  );

  // Your business logic here
  // Example: Save to database, call external APIs, etc.
};

module.exports = handleShipmentCreateEvent;
