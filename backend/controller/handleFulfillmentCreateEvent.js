const handleFulfillmentCreateEvent = async (req, res) => {
  try {
    console.log("✅ Fulfillment create event received", {
      body: req.body,
      headers: req.headers,
    });
    res.status(200).json({
      success: true,
      message: "Fulfillment create event received",
    });
  } catch (error) {
    console.error("❌ Error handling fulfillment create event:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = handleFulfillmentCreateEvent;
