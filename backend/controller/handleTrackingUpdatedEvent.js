const handleTrackingUpdatedEvent = async (req, res) => {
  try {
    console.log("🔑 Tracking updated event received");
    console.log("📦 Request Body:", JSON.stringify(req.body, null, 2));
    console.log("📋 Request Headers:", JSON.stringify(req.headers, null, 2));
    res.status(200).json({
      success: true,
      message: "Tracking updated event received",
    });
  } catch (error) {
    console.error("❌ Error handling tracking updated event:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = handleTrackingUpdatedEvent;
