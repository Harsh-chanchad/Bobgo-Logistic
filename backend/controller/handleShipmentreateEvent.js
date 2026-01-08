const handleShipmentCreateEvent = async (
  event_name,
  request_body,
  company_id,
  application_id
) => {
  console.log(
    "Shipment create event received",
    event_name,
    request_body,
    company_id,
    application_id
  );
};

module.exports = handleShipmentCreateEvent;
