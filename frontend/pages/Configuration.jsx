import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import urlJoin from "url-join";
import loaderGif from "../public/assets/loader.gif";

const EXAMPLE_MAIN_URL = window.location.origin;

export const Configuration = () => {
    const { company_id } = useParams();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const [existingConfig, setExistingConfig] = useState(null);
    const [formData, setFormData] = useState({
        fynd_company_id: company_id || "11874",
        company_name: "SOUTHAFRICAFYND",
        street_address: "125 Dallas Avenue",
        local_area: "Newlands",
        city: "Pretoria",
        zone: "GP",
        country: "South Africa",
        country_code: "ZA",
        delivery_partner_URL: "https://api.sandbox.bobgo.co.za",
        delivery_partner_API_token: "1de3e43420ec4ee8ad1a91299a5fe03e",
        shipment_declared_value: 200.0,
        shipment_handling_time: 2,
    });

    useEffect(() => {
        if (company_id) {
            setFormData((prev) => ({ ...prev, fynd_company_id: company_id }));
            fetchExistingConfig(company_id);
        }
    }, [company_id]);

    const fetchExistingConfig = async (companyId) => {
        try {
            const { data } = await axios.get(
                urlJoin(EXAMPLE_MAIN_URL, `/api/configurations/${companyId}`)
            );
            if (data.success) {
                setExistingConfig(data.data);
                setFormData(data.data);
                setMessage({
                    type: "info",
                    text: "Configuration found for this company. You can update it below.",
                });
            }
        } catch (e) {
            if (e.response?.status === 404) {
                setMessage({
                    type: "info",
                    text: "No configuration found. Create a new one.",
                });
            } else {
                console.error("Error fetching configuration:", e);
            }
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            const response = await axios.post(
                urlJoin(EXAMPLE_MAIN_URL, "/api/configurations"),
                formData,
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            console.log("Configuration created:", response.data);
            setMessage({
                type: "success",
                text: response.data.message || "Configuration created successfully!",
            });
            setExistingConfig(response.data.data);
        } catch (err) {
            console.error("Error creating configuration:", err);
            setMessage({
                type: "error",
                text: err.response?.data?.message || "Failed to create configuration",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            const response = await axios.put(
                urlJoin(
                    EXAMPLE_MAIN_URL,
                    `/api/configurations/${formData.fynd_company_id}`
                ),
                formData,
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            console.log("Configuration updated:", response.data);
            setMessage({
                type: "success",
                text: response.data.message || "Configuration updated successfully!",
            });
        } catch (err) {
            console.error("Error updating configuration:", err);
            setMessage({
                type: "error",
                text: err.response?.data?.message || "Failed to update configuration",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpsert = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            const response = await axios.post(
                urlJoin(EXAMPLE_MAIN_URL, "/api/configurations/upsert"),
                formData,
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            console.log("Configuration upserted:", response.data);
            setMessage({
                type: "success",
                text:
                    response.data.message ||
                    `Configuration ${response.data.data.action} successfully!`,
            });
            setExistingConfig(response.data.data);
        } catch (err) {
            console.error("Error upserting configuration:", err);
            setMessage({
                type: "error",
                text: err.response?.data?.message || "Failed to save configuration",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="products-container">
            <div className="title">Configuration Management</div>

            {message.text && (
                <div
                    style={{
                        padding: "12px",
                        marginBottom: "20px",
                        borderRadius: "4px",
                        backgroundColor:
                            message.type === "success"
                                ? "#d4edda"
                                : message.type === "error"
                                    ? "#f8d7da"
                                    : "#d1ecf1",
                        color:
                            message.type === "success"
                                ? "#155724"
                                : message.type === "error"
                                    ? "#721c24"
                                    : "#0c5460",
                        border: `1px solid ${message.type === "success"
                            ? "#c3e6cb"
                            : message.type === "error"
                                ? "#f5c6cb"
                                : "#bee5eb"
                            }`,
                    }}
                >
                    {message.text}
                </div>
            )}

            {loading ? (
                <div className="loader" style={{ textAlign: "center", padding: "40px" }}>
                    <img src={loaderGif} alt="Loading..." />
                </div>
            ) : (
                <form
                    onSubmit={existingConfig ? handleUpdate : handleSubmit}
                    style={{ maxWidth: "800px" }}
                >
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        {/* Column 1 */}
                        <div>
                            <div style={{ marginBottom: "15px" }}>
                                <label
                                    style={{
                                        display: "block",
                                        marginBottom: "5px",
                                        fontWeight: "bold",
                                    }}
                                >
                                    Company ID *
                                </label>
                                <input
                                    type="text"
                                    name="fynd_company_id"
                                    value={formData.fynd_company_id}
                                    onChange={handleInputChange}
                                    required
                                    disabled={!!existingConfig}
                                    style={{
                                        width: "100%",
                                        padding: "8px",
                                        border: "1px solid #ddd",
                                        borderRadius: "4px",
                                        backgroundColor: existingConfig ? "#f5f5f5" : "white",
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: "15px" }}>
                                <label
                                    style={{
                                        display: "block",
                                        marginBottom: "5px",
                                        fontWeight: "bold",
                                    }}
                                >
                                    Company Name
                                </label>
                                <input
                                    type="text"
                                    name="company_name"
                                    value={formData.company_name}
                                    onChange={handleInputChange}
                                    style={{
                                        width: "100%",
                                        padding: "8px",
                                        border: "1px solid #ddd",
                                        borderRadius: "4px",
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: "15px" }}>
                                <label
                                    style={{
                                        display: "block",
                                        marginBottom: "5px",
                                        fontWeight: "bold",
                                    }}
                                >
                                    Street Address
                                </label>
                                <input
                                    type="text"
                                    name="street_address"
                                    value={formData.street_address}
                                    onChange={handleInputChange}
                                    style={{
                                        width: "100%",
                                        padding: "8px",
                                        border: "1px solid #ddd",
                                        borderRadius: "4px",
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: "15px" }}>
                                <label
                                    style={{
                                        display: "block",
                                        marginBottom: "5px",
                                        fontWeight: "bold",
                                    }}
                                >
                                    Local Area
                                </label>
                                <input
                                    type="text"
                                    name="local_area"
                                    value={formData.local_area}
                                    onChange={handleInputChange}
                                    style={{
                                        width: "100%",
                                        padding: "8px",
                                        border: "1px solid #ddd",
                                        borderRadius: "4px",
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: "15px" }}>
                                <label
                                    style={{
                                        display: "block",
                                        marginBottom: "5px",
                                        fontWeight: "bold",
                                    }}
                                >
                                    City
                                </label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    style={{
                                        width: "100%",
                                        padding: "8px",
                                        border: "1px solid #ddd",
                                        borderRadius: "4px",
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: "15px" }}>
                                <label
                                    style={{
                                        display: "block",
                                        marginBottom: "5px",
                                        fontWeight: "bold",
                                    }}
                                >
                                    Zone/Province
                                </label>
                                <input
                                    type="text"
                                    name="zone"
                                    value={formData.zone}
                                    onChange={handleInputChange}
                                    style={{
                                        width: "100%",
                                        padding: "8px",
                                        border: "1px solid #ddd",
                                        borderRadius: "4px",
                                    }}
                                />
                            </div>
                        </div>

                        {/* Column 2 */}
                        <div>
                            <div style={{ marginBottom: "15px" }}>
                                <label
                                    style={{
                                        display: "block",
                                        marginBottom: "5px",
                                        fontWeight: "bold",
                                    }}
                                >
                                    Country
                                </label>
                                <input
                                    type="text"
                                    name="country"
                                    value={formData.country}
                                    onChange={handleInputChange}
                                    style={{
                                        width: "100%",
                                        padding: "8px",
                                        border: "1px solid #ddd",
                                        borderRadius: "4px",
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: "15px" }}>
                                <label
                                    style={{
                                        display: "block",
                                        marginBottom: "5px",
                                        fontWeight: "bold",
                                    }}
                                >
                                    Country Code
                                </label>
                                <input
                                    type="text"
                                    name="country_code"
                                    value={formData.country_code}
                                    onChange={handleInputChange}
                                    style={{
                                        width: "100%",
                                        padding: "8px",
                                        border: "1px solid #ddd",
                                        borderRadius: "4px",
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: "15px" }}>
                                <label
                                    style={{
                                        display: "block",
                                        marginBottom: "5px",
                                        fontWeight: "bold",
                                    }}
                                >
                                    Delivery Partner URL
                                </label>
                                <input
                                    type="url"
                                    name="delivery_partner_URL"
                                    value={formData.delivery_partner_URL}
                                    onChange={handleInputChange}
                                    style={{
                                        width: "100%",
                                        padding: "8px",
                                        border: "1px solid #ddd",
                                        borderRadius: "4px",
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: "15px" }}>
                                <label
                                    style={{
                                        display: "block",
                                        marginBottom: "5px",
                                        fontWeight: "bold",
                                    }}
                                >
                                    API Token
                                </label>
                                <input
                                    type="text"
                                    name="delivery_partner_API_token"
                                    value={formData.delivery_partner_API_token}
                                    onChange={handleInputChange}
                                    style={{
                                        width: "100%",
                                        padding: "8px",
                                        border: "1px solid #ddd",
                                        borderRadius: "4px",
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: "15px" }}>
                                <label
                                    style={{
                                        display: "block",
                                        marginBottom: "5px",
                                        fontWeight: "bold",
                                    }}
                                >
                                    Declared Value
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="shipment_declared_value"
                                    value={formData.shipment_declared_value}
                                    onChange={handleInputChange}
                                    style={{
                                        width: "100%",
                                        padding: "8px",
                                        border: "1px solid #ddd",
                                        borderRadius: "4px",
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: "15px" }}>
                                <label
                                    style={{
                                        display: "block",
                                        marginBottom: "5px",
                                        fontWeight: "bold",
                                    }}
                                >
                                    Handling Time (days)
                                </label>
                                <input
                                    type="number"
                                    name="shipment_handling_time"
                                    value={formData.shipment_handling_time}
                                    onChange={handleInputChange}
                                    style={{
                                        width: "100%",
                                        padding: "8px",
                                        border: "1px solid #ddd",
                                        borderRadius: "4px",
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div
                        style={{
                            marginTop: "20px",
                            display: "flex",
                            gap: "10px",
                        }}
                    >
                        <button
                            type="button"
                            onClick={handleUpsert}
                            disabled={loading}
                            style={{
                                padding: "10px 20px",
                                backgroundColor: "#2874f0",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: loading ? "not-allowed" : "pointer",
                                fontSize: "16px",
                                opacity: loading ? 0.6 : 1,
                            }}
                        >
                            {loading ? "Saving..." : "Save (Create or Update)"}
                        </button>

                        {!existingConfig && (
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    padding: "10px 20px",
                                    backgroundColor: "#28a745",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: loading ? "not-allowed" : "pointer",
                                    fontSize: "16px",
                                    opacity: loading ? 0.6 : 1,
                                }}
                            >
                                {loading ? "Creating..." : "Create New"}
                            </button>
                        )}

                        {existingConfig && (
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    padding: "10px 20px",
                                    backgroundColor: "#ffc107",
                                    color: "black",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: loading ? "not-allowed" : "pointer",
                                    fontSize: "16px",
                                    opacity: loading ? 0.6 : 1,
                                }}
                            >
                                {loading ? "Updating..." : "Update Existing"}
                            </button>
                        )}
                    </div>
                </form>
            )}

            {existingConfig && !loading && (
                <div
                    style={{
                        marginTop: "30px",
                        padding: "15px",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "4px",
                        border: "1px solid #dee2e6",
                    }}
                >
                    <h3 style={{ marginTop: 0 }}>Current Configuration</h3>
                    <pre style={{ fontSize: "12px", overflow: "auto" }}>
                        {JSON.stringify(existingConfig, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

