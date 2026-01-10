const express = require("express");
const configurationRouter = express.Router();
const ConfigurationModel = require("../models/Configuration.model");

/**
 * Configuration API Routes
 * Base path: /api/configurations
 */

// GET all configurations
configurationRouter.get("/", async (req, res) => {
  try {
    const model = new ConfigurationModel();
    const configs = await model.getAll();
    model.close();

    return res.json({
      success: true,
      count: configs.length,
      data: configs,
    });
  } catch (err) {
    console.error("Error fetching configurations:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// GET configuration by company ID
configurationRouter.get("/:fynd_company_id", async (req, res) => {
  try {
    const { fynd_company_id } = req.params;
    const model = new ConfigurationModel();
    const config = await model.getByCompanyId(fynd_company_id);
    model.close();

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Configuration not found",
      });
    }

    return res.json({
      success: true,
      data: config,
    });
  } catch (err) {
    console.error("Error fetching configuration:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// POST create new configuration
configurationRouter.post("/", async (req, res) => {
  try {
    const model = new ConfigurationModel();
    const result = await model.create(req.body);
    model.close();

    return res.status(201).json({
      success: true,
      message: "Configuration created successfully",
      data: result,
    });
  } catch (err) {
    console.error("Error creating configuration:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// PUT update configuration
configurationRouter.put("/:fynd_company_id", async (req, res) => {
  try {
    const { fynd_company_id } = req.params;
    const model = new ConfigurationModel();
    const result = await model.update(fynd_company_id, req.body);
    model.close();

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: "Configuration not found",
      });
    }

    return res.json({
      success: true,
      message: "Configuration updated successfully",
      data: result,
    });
  } catch (err) {
    console.error("Error updating configuration:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// POST upsert configuration (create or update)
configurationRouter.post("/upsert", async (req, res) => {
  try {
    const model = new ConfigurationModel();
    const result = await model.upsert(req.body);
    model.close();

    return res.json({
      success: true,
      message: `Configuration ${result.action} successfully`,
      data: result,
    });
  } catch (err) {
    console.error("Error upserting configuration:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// DELETE configuration
configurationRouter.delete("/:fynd_company_id", async (req, res) => {
  try {
    const { fynd_company_id } = req.params;
    const model = new ConfigurationModel();
    const result = await model.delete(fynd_company_id);
    model.close();

    if (result.deleted === 0) {
      return res.status(404).json({
        success: false,
        message: "Configuration not found",
      });
    }

    return res.json({
      success: true,
      message: "Configuration deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting configuration:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = configurationRouter;
