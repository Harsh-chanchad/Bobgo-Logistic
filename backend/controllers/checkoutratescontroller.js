const express = require("express");
const axios = require("axios");

const payload = {
  collection_address: {
    company: "Bob Go",
    street_address: "125 Dallas Avenue",
    local_area: "Newlands",
    city: "Pretoria",
    zone: "GP",
    country: "ZA",
    code: "0181",
  },
  delivery_address: {
    company: "Bob Go",
    street_address: "125 Dallas Avenue",
    local_area: "Newlands",
    city: "Pretoria",
    zone: "GP",
    country: "ZA",
    code: "0181",
  },
  items: [
    {
      description: "",
      price: 200,
      quantity: 1,
      length_cm: 17,
      width_cm: 8,
      height_cm: 5,
      weight_kg: 0,
    },
  ],
  declared_value: 0,
  handling_time: 2,
};

const getServicePlan = async (req, res) => {
  try {
    // TODO : here we have payload from frontend and we will transform that payload as per bobgo API need,
    // currentlly it is static

    // next we will call bobgo API to get the service plan
    const response = await axios.post(
      "https://api.sandbox.bobgo.co.za/v2/rates-at-checkout",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.BOBGO_TOKEN}`,
          Accept: "*/*",
        },
      }
    );
    return res.json({
      success: true,
      data: response.data,
    });
  } catch (err) {
    console.error("BobGo API Error:", {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
    });
    return res.status(err.response?.status || 500).json({
      success: false,
      message: err.message,
      error: err.response?.data || "Unknown error",
    });
  }
};
module.exports = { getServicePlan };
