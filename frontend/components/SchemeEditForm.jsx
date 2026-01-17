import React, { useState, useEffect } from "react";
import { Button } from "@gofynd/nitrozen-react";
import loaderGif from "../public/assets/loader.gif";
import { api } from "../utils/api";
import { DeliveryCapabilityModal } from "./DeliveryCapabilityModal";
import "./SchemeEditForm.less";

/**
 * SchemeEditForm Component
 * Edit form for courier scheme details matching Delhivery extension UI
 * @param {Object} props - Component props
 * @param {string} props.schemeId - The scheme ID to edit
 * @param {string|number} props.companyId - Company ID for configuration
 * @param {Function} props.onBack - Callback function when back button is clicked
 */
export const SchemeEditForm = ({ schemeId, companyId, onBack }) => {
    const [scheme, setScheme] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showToken, setShowToken] = useState(false);
    const [showCapabilitiesModal, setShowCapabilitiesModal] = useState(false);
    const [showServiceabilityModal, setShowServiceabilityModal] = useState(false);
    const [showTATModal, setShowTATModal] = useState(false);
    const [selectedServiceabilityFile, setSelectedServiceabilityFile] = useState(null);
    const [selectedTATFile, setSelectedTATFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    // Form state managed in object structure
    const [formData, setFormData] = useState({
        planDetails: {
            customPlanName: "",
            displayName: "",
            planType: "surface"
        },
        serviceableWeight: {
            deadWeight: {
                min: "",
                max: ""
            },
            volumetricWeight: {
                min: "",
                max: ""
            }
        },
        credentials: {
            companyName: "",
            bobgoToken: "",
            webhookUrl: "",
            // Address fields
            streetAddress: "",
            localArea: "",
            city: "",
            zone: "",
            country: "",
            countryCode: "",
            // API URL
            deliveryPartnerUrl: "",
            // Shipment values
            shipmentDeclaredValue: 0,
            shipmentHandlingTime: 2
        },
        deliveryCapabilities: {
            features: {}
        },
        serviceableAreas: {
            autoUpdate: false
        },
        pickupCutoff: {
            forward: "",
            reverse: "",
            timezone: ""
        },
        turnAroundTime: {
            useDefault: true,
            min: "",
            max: "",
            unit: "days"
        }
    });

    // Fetch scheme details with configuration on mount
    useEffect(() => {
        const fetchData = async () => {
            if (!schemeId || !companyId) {
                setError("Scheme ID and Company ID required");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const result = await api.getSchemeWithConfig(schemeId, companyId);

                if (result.success) {
                    const schemeData = result.data;
                    setScheme(schemeData);

                    // Pre-fill ALL form data
                    setFormData({
                        planDetails: {
                            customPlanName: schemeData.name || "",
                            displayName: `Display Name: ${schemeData.name || ""}`,
                            planType: schemeData.transport_type || "surface"
                        },
                        serviceableWeight: {
                            deadWeight: {
                                // API returns gt/lt, but we also check for gte/lte as fallback
                                min: schemeData.weight?.gt,
                                max: schemeData.weight?.lt
                            },
                            volumetricWeight: {
                                // API returns gt/lt, but we also check for gte/lte as fallback
                                min: schemeData.volumetric_weight?.gt,
                                max: schemeData.volumetric_weight?.lt
                            }
                        },
                        credentials: {
                            companyName: schemeData.credentials?.company_name || "",
                            bobgoToken: schemeData.credentials?.bobgo_token || "",
                            webhookUrl: schemeData.credentials?.webhook_url ||
                                `curl -X POST 'https://bobgo-extension.fynd.com/v1.0/webhook/${companyId}'`,
                            // Address fields from database
                            streetAddress: schemeData.credentials?.street_address || "",
                            localArea: schemeData.credentials?.local_area || "",
                            city: schemeData.credentials?.city || "",
                            zone: schemeData.credentials?.zone || "",
                            country: schemeData.credentials?.country || "",
                            countryCode: schemeData.credentials?.country_code || "",
                            // API URL
                            deliveryPartnerUrl: schemeData.credentials?.delivery_partner_URL || "",
                            // Shipment values
                            shipmentDeclaredValue: schemeData.credentials?.shipment_declared_value || 0,
                            shipmentHandlingTime: schemeData.credentials?.shipment_handling_time || 2
                        },
                        deliveryCapabilities: {
                            features: {
                                ...(schemeData.feature || {}),
                                // Set cash_on_delivery based on payment_mode array
                                cash_on_delivery: schemeData.payment_mode?.includes("COD") || false
                            }
                        },
                        serviceableAreas: {
                            autoUpdate: false
                        },
                        pickupCutoff: {
                            forward: schemeData.pickup_cutoff?.forward || "",
                            reverse: schemeData.pickup_cutoff?.reverse || "",
                            timezone: schemeData.pickup_cutoff?.timezone || schemeData.timezone || ""
                        },
                        turnAroundTime: {
                            // Database has priority - GET endpoint already merges database > scheme
                            useDefault: schemeData.default_tat?.enabled !== false,
                            min: schemeData.default_tat?.tat?.min?.toString() || "",
                            max: schemeData.default_tat?.tat?.max?.toString() || "",
                            unit: schemeData.default_tat?.tat?.unit || "days"
                        }
                    });

                    console.log("Data loaded with credentials:", schemeData);
                } else {
                    setError(result.error || "Failed to load data");
                }
            } catch (e) {
                console.error("Error:", e);
                setError(e.message || "Failed to load data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [schemeId, companyId]);

    // Handle input changes
    const handleInputChange = (section, field, value, subField = null) => {
        setFormData(prev => {
            if (subField) {
                return {
                    ...prev,
                    [section]: {
                        ...prev[section],
                        [field]: {
                            ...prev[section][field],
                            [subField]: value
                        }
                    }
                };
            } else {
                return {
                    ...prev,
                    [section]: {
                        ...prev[section],
                        [field]: value
                    }
                };
            }
        });

        // Auto-generate display name when custom plan name changes
        if (section === 'planDetails' && field === 'customPlanName') {
            setFormData(prev => ({
                ...prev,
                planDetails: {
                    ...prev.planDetails,
                    displayName: `Display Name: ${value}`
                }
            }));
        }
    };

    // Generate time options (00:00 to 23:59 in 15-min intervals)
    const generateTimeOptions = () => {
        const options = [];
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 15) {
                const h = hour.toString().padStart(2, '0');
                const m = minute.toString().padStart(2, '0');
                const time24 = `${h}:${m}`;
                const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                const ampm = hour < 12 ? 'AM' : 'PM';
                const time12 = `${hour12}:${m} ${ampm}`;
                options.push({ value: time24, label: time12 });
            }
        }
        return options;
    };

    // Common timezones
    const timezones = [
        { value: "Asia/Kolkata", label: "Asia/Kolkata (IST)" },
        { value: "UTC", label: "UTC" },
        { value: "America/New_York", label: "America/New_York (EST)" },
        { value: "America/Los_Angeles", label: "America/Los_Angeles (PST)" },
        { value: "Europe/London", label: "Europe/London (GMT)" },
        { value: "Asia/Dubai", label: "Asia/Dubai (GST)" },
        { value: "Asia/Singapore", label: "Asia/Singapore (SGT)" },
        { value: "Australia/Sydney", label: "Australia/Sydney (AEDT)" }
    ];

    // Get capability tags for display
    const getCapabilityTags = (features) => {
        const tags = [];

        if (!features || Object.keys(features).length === 0) {
            return ["No capabilities configured"];
        }

        // Add enabled features
        Object.entries(features).forEach(([key, value]) => {
            if (value === true) {
                // Format feature name (e.g., doorstep_qc → Doorstep QC)
                const formatted = key
                    .split('_')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                tags.push(formatted);
            }
        });

        // Add scheme properties as tags
        if (scheme) {
            if (scheme.region) tags.push(scheme.region);
            if (scheme.transport_type) tags.push(scheme.transport_type);
            if (scheme.delivery_type) tags.push(scheme.delivery_type);
            if (scheme.status_updates) tags.push(scheme.status_updates);
        }

        return tags.length > 0 ? tags : ["No capabilities configured"];
    };

    // Handle save - save all configuration fields to database
    const handleSave = async () => {
        console.log("Saving form data:", formData);

        setLoading(true);

        try {
            // Send all configuration fields to backend
            const updates = {
                default_tat: {
                    min_tat: parseInt(formData.turnAroundTime.min) || 1,
                    max_tat: parseInt(formData.turnAroundTime.max) || 3,
                    unit: formData.turnAroundTime.unit || "days"
                },
                delivery_partner_API_token: formData.credentials.bobgoToken || "",
                company_name: formData.credentials.companyName || "",
                // Address fields
                street_address: formData.credentials.streetAddress || "",
                local_area: formData.credentials.localArea || "",
                city: formData.credentials.city || "",
                zone: formData.credentials.zone || "",
                country: formData.credentials.country || "",
                country_code: formData.credentials.countryCode || "",
                // API URL
                delivery_partner_URL: formData.credentials.deliveryPartnerUrl || "",
                // Shipment values
                shipment_declared_value: parseFloat(formData.credentials.shipmentDeclaredValue) || 0,
                shipment_handling_time: parseInt(formData.credentials.shipmentHandlingTime) || 2
            };

            console.log("Sending updates to backend:", JSON.stringify(updates, null, 2));

            const result = await api.saveSchemeData(schemeId, companyId, updates);

            if (result.success) {
                alert("✅ Data saved successfully!");
                // Reload data to reflect changes
                const refreshResult = await api.getSchemeWithConfig(schemeId, companyId);
                if (refreshResult.success) {
                    const schemeData = refreshResult.data;
                    setScheme(schemeData);
                    // Update form data with refreshed values
                    setFormData(prev => ({
                        ...prev,
                        turnAroundTime: {
                            useDefault: schemeData.default_tat?.enabled !== false,
                            min: schemeData.default_tat?.tat?.min?.toString() || "",
                            max: schemeData.default_tat?.tat?.max?.toString() || "",
                            unit: schemeData.default_tat?.tat?.unit || "days"
                        },
                        credentials: {
                            companyName: schemeData.credentials?.company_name || prev.credentials.companyName,
                            bobgoToken: schemeData.credentials?.bobgo_token || prev.credentials.bobgoToken,
                            webhookUrl: schemeData.credentials?.webhook_url || prev.credentials.webhookUrl,
                            // Address fields
                            streetAddress: schemeData.credentials?.street_address || prev.credentials.streetAddress,
                            localArea: schemeData.credentials?.local_area || prev.credentials.localArea,
                            city: schemeData.credentials?.city || prev.credentials.city,
                            zone: schemeData.credentials?.zone || prev.credentials.zone,
                            country: schemeData.credentials?.country || prev.credentials.country,
                            countryCode: schemeData.credentials?.country_code || prev.credentials.countryCode,
                            // API URL
                            deliveryPartnerUrl: schemeData.credentials?.delivery_partner_URL || prev.credentials.deliveryPartnerUrl,
                            // Shipment values
                            shipmentDeclaredValue: schemeData.credentials?.shipment_declared_value || prev.credentials.shipmentDeclaredValue,
                            shipmentHandlingTime: schemeData.credentials?.shipment_handling_time || prev.credentials.shipmentHandlingTime
                        }
                    }));
                }
            } else {
                const errorMsg = result.error || "Unknown error";
                console.error("Save failed:", errorMsg);
                alert("❌ Failed to save: " + errorMsg);
            }
        } catch (error) {
            console.error("Save error:", error);
            const errorMsg = error.response?.data?.message || error.message || "Unknown error occurred";
            alert("❌ Failed to save data: " + errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="scheme-edit-form">
                <div className="loading-state">
                    <img src={loaderGif} alt="Loading" className="loading-state__spinner" />
                    <p className="loading-state__text">Loading scheme details...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="scheme-edit-form">
                <div className="error-state">
                    <span className="error-state__icon">⚠️</span>
                    <p className="error-state__text">{error}</p>
                    {onBack && (
                        <Button onClick={onBack} theme="secondary">
                            Go Back
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    // Character count for custom plan name
    const customPlanNameLength = formData.planDetails.customPlanName.length;
    const maxPlanNameLength = 90;

    return (
        <div className="scheme-edit-form">
            {/* Header with breadcrumb and save button */}
            <div className="scheme-edit-form__header">
                <div className="scheme-edit-form__breadcrumb">
                    Home &gt; Service Plan
                </div>
                <Button
                    theme="primary"
                    className="scheme-edit-form__save-btn"
                    onClick={handleSave}
                    disabled={loading}
                >
                    Save
                </Button>
            </div>

            {/* Main scrollable content */}
            <div className="scheme-edit-form__container">
                {/* Plan Details Section */}
                <div className="scheme-edit-form__section">
                    <h2 className="scheme-edit-form__section-title">Plan Details</h2>

                    <div className="scheme-edit-form__row">
                        {/* Custom Plan Name */}
                        <div className="scheme-edit-form__field-group">
                            <label className="scheme-edit-form__label">
                                Custom Plan Name *
                            </label>
                            <input
                                type="text"
                                className="scheme-edit-form__input"
                                value={formData.planDetails.customPlanName}
                                // onChange={(e) => handleInputChange('planDetails', 'customPlanName', e.target.value)}
                                readOnly
                                maxLength={maxPlanNameLength}
                                placeholder="Enter plan name"
                                style={{ backgroundColor: "#f5f5f5" }}
                            />
                            <div className="scheme-edit-form__helper-row">
                                <span className="scheme-edit-form__display-name">
                                    {formData.planDetails.displayName}
                                </span>
                                <span className="scheme-edit-form__char-count">
                                    {customPlanNameLength}/{maxPlanNameLength}
                                </span>
                            </div>
                        </div>

                        {/* Plan Type */}
                        <div className="scheme-edit-form__field-group">
                            <label className="scheme-edit-form__label">
                                Plan Type *
                            </label>
                            <select
                                className="scheme-edit-form__select"
                                value={formData.planDetails.planType}
                                // onChange={(e) => handleInputChange('planDetails', 'planType', e.target.value)}

                                style={{ backgroundColor: "#f5f5f5", cursor: "not-allowed" }}
                            >
                                <option value="surface">Surface</option>
                                <option value="air">Air</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Serviceable Weight Section */}
                <div className="scheme-edit-form__section">
                    <div className="scheme-edit-form__section-header">
                        <h2 className="scheme-edit-form__section-title">Serviceable Weight</h2>
                        <span className="scheme-edit-form__section-subtitle">
                            All weights are in (kg)
                        </span>
                    </div>

                    {/* Dead Weight */}
                    <div className="scheme-edit-form__subsection">
                        <h3 className="scheme-edit-form__subsection-title">Dead Weight</h3>
                        <div className="scheme-edit-form__row">
                            <div className="scheme-edit-form__field-group">
                                <label className="scheme-edit-form__label">
                                    Minimum Weight
                                    <span className="scheme-edit-form__info-icon" title="Minimum weight in kg">ⓘ</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="scheme-edit-form__input"
                                    value={formData.serviceableWeight.deadWeight.min}
                                    // onChange={(e) => handleInputChange('serviceableWeight', 'deadWeight', e.target.value, 'min')}
                                    readOnly
                                    placeholder="Enter Minimum Weight"
                                    style={{ backgroundColor: "#f5f5f5" }}
                                />
                            </div>
                            <div className="scheme-edit-form__field-group">
                                <label className="scheme-edit-form__label">
                                    Maximum Weight
                                    <span className="scheme-edit-form__info-icon" title="Maximum weight in kg">ⓘ</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="scheme-edit-form__input"
                                    value={formData.serviceableWeight.deadWeight.max}
                                    // onChange={(e) => handleInputChange('serviceableWeight', 'deadWeight', e.target.value, 'max')}
                                    readOnly
                                    placeholder="Enter Maximum Weight"
                                    style={{ backgroundColor: "#f5f5f5" }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Volumetric Weight */}
                    <div className="scheme-edit-form__subsection">
                        <h3 className="scheme-edit-form__subsection-title">Volumetric Weight</h3>
                        <div className="scheme-edit-form__row">
                            <div className="scheme-edit-form__field-group">
                                <label className="scheme-edit-form__label">
                                    Minimum Weight
                                    <span className="scheme-edit-form__info-icon" title="Minimum volumetric weight in kg">ⓘ</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="scheme-edit-form__input"
                                    value={formData.serviceableWeight.volumetricWeight.min}
                                    // onChange={(e) => handleInputChange('serviceableWeight', 'volumetricWeight', e.target.value, 'min')}
                                    readOnly
                                    placeholder="Enter Minimum Weight"
                                    style={{ backgroundColor: "#f5f5f5" }}
                                />
                            </div>
                            <div className="scheme-edit-form__field-group">
                                <label className="scheme-edit-form__label">
                                    Maximum Weight
                                    <span className="scheme-edit-form__info-icon" title="Maximum volumetric weight in kg">ⓘ</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="scheme-edit-form__input"
                                    value={formData.serviceableWeight.volumetricWeight.max}
                                    // onChange={(e) => handleInputChange('serviceableWeight', 'volumetricWeight', e.target.value, 'max')}
                                    readOnly
                                    placeholder="Enter Maximum Weight"
                                    style={{ backgroundColor: "#f5f5f5" }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enter Credentials Section */}
                <div className="scheme-edit-form__section">
                    <h2 className="scheme-edit-form__section-title">Enter Credentials</h2>
                    <p className="scheme-edit-form__section-description">
                        Account Details to be filled
                    </p>

                    {/* Account Name */}
                    <div className="scheme-edit-form__field-group">
                        <label className="scheme-edit-form__label">Account Name *</label>
                        <input
                            type="text"
                            className="scheme-edit-form__input"
                            value={formData.credentials.companyName}
                            onChange={(e) => handleInputChange('credentials', 'companyName', e.target.value)}
                            placeholder="Enter company name"
                        />
                    </div>

                    {/* API Token */}
                    <div className="scheme-edit-form__field-group">
                        <label className="scheme-edit-form__label">Api Token *</label>
                        <div className="password-field">
                            <input
                                type={showToken ? "text" : "password"}
                                className="scheme-edit-form__input"
                                value={formData.credentials.bobgoToken}
                                onChange={(e) => handleInputChange('credentials', 'bobgoToken', e.target.value)}
                                placeholder="Enter API token"
                            />
                            <button
                                type="button"
                                className="password-field__eye-icon"
                                onClick={() => setShowToken(!showToken)}
                            >
                                {showToken ? "👁️" : "👁️‍🗨️"}
                            </button>
                        </div>
                    </div>

                    {/* Webhook URL (Read-only) */}
                    <div className="scheme-edit-form__field-group">
                        <label className="scheme-edit-form__label">Webhook URL</label>
                        <div className="readonly-field">
                            <input
                                type="text"
                                className="scheme-edit-form__input scheme-edit-form__input--readonly"
                                value={formData.credentials.webhookUrl}
                                readOnly
                            />
                            <button
                                type="button"
                                className="readonly-field__copy-icon"
                                onClick={() => {
                                    navigator.clipboard.writeText(formData.credentials.webhookUrl);
                                    alert("Webhook URL copied to clipboard!");
                                }}
                            >
                                📋
                            </button>
                        </div>
                    </div>

                    {/* Delivery Partner URL */}
                    <div className="scheme-edit-form__field-group">
                        <label className="scheme-edit-form__label">Delivery Partner URL</label>
                        <input
                            type="text"
                            className="scheme-edit-form__input"
                            value={formData.credentials.deliveryPartnerUrl}
                            onChange={(e) => handleInputChange('credentials', 'deliveryPartnerUrl', e.target.value)}
                            placeholder="https://api.sandbox.bobgo.co.za"
                        />
                    </div>
                </div>

                {/* Address Information Section */}
                <div className="scheme-edit-form__section">
                    <h2 className="scheme-edit-form__section-title">Address Information</h2>
                    <p className="scheme-edit-form__section-description">
                        Company address details
                    </p>

                    {/* Street Address */}
                    <div className="scheme-edit-form__field-group">
                        <label className="scheme-edit-form__label">Street Address</label>
                        <input
                            type="text"
                            className="scheme-edit-form__input"
                            value={formData.credentials.streetAddress}
                            onChange={(e) => handleInputChange('credentials', 'streetAddress', e.target.value)}
                            placeholder="Enter street address"
                        />
                    </div>

                    <div className="scheme-edit-form__row scheme-edit-form__row--two-columns">
                        {/* Local Area */}
                        <div className="scheme-edit-form__field-group">
                            <label className="scheme-edit-form__label">Local Area</label>
                            <input
                                type="text"
                                className="scheme-edit-form__input"
                                value={formData.credentials.localArea}
                                onChange={(e) => handleInputChange('credentials', 'localArea', e.target.value)}
                                placeholder="Enter local area"
                            />
                        </div>

                        {/* City */}
                        <div className="scheme-edit-form__field-group">
                            <label className="scheme-edit-form__label">City</label>
                            <input
                                type="text"
                                className="scheme-edit-form__input"
                                value={formData.credentials.city}
                                onChange={(e) => handleInputChange('credentials', 'city', e.target.value)}
                                placeholder="Enter city"
                            />
                        </div>
                    </div>

                    <div className="scheme-edit-form__row scheme-edit-form__row--three-columns">
                        {/* Zone */}
                        <div className="scheme-edit-form__field-group">
                            <label className="scheme-edit-form__label">Zone</label>
                            <input
                                type="text"
                                className="scheme-edit-form__input"
                                value={formData.credentials.zone}
                                onChange={(e) => handleInputChange('credentials', 'zone', e.target.value)}
                                placeholder="Enter zone"
                            />
                        </div>

                        {/* Country */}
                        <div className="scheme-edit-form__field-group">
                            <label className="scheme-edit-form__label">Country</label>
                            <input
                                type="text"
                                className="scheme-edit-form__input"
                                value={formData.credentials.country}
                                onChange={(e) => handleInputChange('credentials', 'country', e.target.value)}
                                placeholder="Enter country"
                            />
                        </div>

                        {/* Country Code */}
                        <div className="scheme-edit-form__field-group">
                            <label className="scheme-edit-form__label">Country Code</label>
                            <input
                                type="text"
                                className="scheme-edit-form__input"
                                value={formData.credentials.countryCode}
                                onChange={(e) => handleInputChange('credentials', 'countryCode', e.target.value)}
                                placeholder="e.g., ZA, IN, US"
                                maxLength={10}
                            />
                        </div>
                    </div>
                </div>

                {/* Shipment Configuration Section */}
                <div className="scheme-edit-form__section">
                    <h2 className="scheme-edit-form__section-title">Shipment Configuration</h2>
                    <p className="scheme-edit-form__section-description">
                        Default shipment values
                    </p>

                    <div className="scheme-edit-form__row scheme-edit-form__row--two-columns">
                        {/* Shipment Declared Value */}
                        <div className="scheme-edit-form__field-group">
                            <label className="scheme-edit-form__label">Shipment Declared Value</label>
                            <input
                                type="number"
                                className="scheme-edit-form__input"
                                value={formData.credentials.shipmentDeclaredValue}
                                onChange={(e) => handleInputChange('credentials', 'shipmentDeclaredValue', e.target.value)}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                            />
                        </div>

                        {/* Shipment Handling Time */}
                        <div className="scheme-edit-form__field-group">
                            <label className="scheme-edit-form__label">Shipment Handling Time (days)</label>
                            <input
                                type="number"
                                className="scheme-edit-form__input"
                                value={formData.credentials.shipmentHandlingTime}
                                onChange={(e) => handleInputChange('credentials', 'shipmentHandlingTime', e.target.value)}
                                placeholder="2"
                                min="0"
                            />
                        </div>
                    </div>
                </div>

                {/* Delivery Service Capabilities Section */}
                <div className="scheme-edit-form__section">
                    <div className="scheme-edit-form__section-header">
                        <div>
                            <h2 className="scheme-edit-form__section-title">
                                Delivery Service Capabilities
                            </h2>
                            <p className="scheme-edit-form__section-description">
                                Functionality & features of the delivery service
                            </p>
                        </div>
                        <Button
                            theme="secondary"
                            onClick={() => setShowCapabilitiesModal(true)}
                        >
                            Manage
                        </Button>
                    </div>

                    {/* Display current capabilities as tags */}
                    <div className="capability-tags">
                        {getCapabilityTags(formData.deliveryCapabilities.features).map((tag, idx) => (
                            <span key={idx} className="capability-tag">{tag}</span>
                        ))}
                    </div>
                </div>

                {/* Serviceable Areas Section */}
                <div className="scheme-edit-form__section">
                    <div className="scheme-edit-form__section-header">
                        <div>
                            <h2 className="scheme-edit-form__section-title">Serviceable Areas</h2>
                            <p className="scheme-edit-form__section-description">
                                Use to enable, disable or restrict serviceability of the Delivery Partner
                            </p>
                        </div>
                        <Button
                            theme="secondary"
                            onClick={() => setShowServiceabilityModal(true)}
                        >
                            Bulk Action
                        </Button>
                    </div>

                    <div className="toggle-row">
                        <span>Enable to update Serviceability automatically based on the Delivery Partner's serviceability</span>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={formData.serviceableAreas.autoUpdate}
                            // onChange={(e) => handleInputChange('serviceableAreas', 'autoUpdate', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                {/* Default Pickup Cutoff Time Section */}
                <div className="scheme-edit-form__section">
                    <h2 className="scheme-edit-form__section-title">Default Pickup Cutoff Time</h2>
                    <p className="scheme-edit-form__section-description">
                        If no pickup cutoff time is set for a location, the default time will be applied.
                    </p>

                    <div className="scheme-edit-form__row scheme-edit-form__row--three-columns">
                        {/* Forward Pickup Cutoff */}
                        <div className="scheme-edit-form__field-group">
                            <label className="scheme-edit-form__label">Forward Pickup Cutoff</label>
                            <select
                                className="scheme-edit-form__select"
                                value={formData.pickupCutoff.forward}
                                // onChange={(e) => handleInputChange('pickupCutoff', 'forward', e.target.value)}
                                style={{ backgroundColor: "#f5f5f5" }}
                            >
                                <option value="">Select Time</option>
                                {generateTimeOptions().map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Reverse Pickup Cutoff */}
                        <div className="scheme-edit-form__field-group">
                            <label className="scheme-edit-form__label">Reverse Pickup Cutoff</label>
                            <select
                                className="scheme-edit-form__select"
                                value={formData.pickupCutoff.reverse}
                                // onChange={(e) => handleInputChange('pickupCutoff', 'reverse', e.target.value)}
                                disabled
                                style={{ backgroundColor: "#f5f5f5" }}
                            >
                                <option value="">Select Time</option>
                                {generateTimeOptions().map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Timezone */}
                        <div className="scheme-edit-form__field-group">
                            <label className="scheme-edit-form__label">Timezone</label>
                            <select
                                className="scheme-edit-form__select"
                                value={formData.pickupCutoff.timezone}
                                // onChange={(e) => handleInputChange('pickupCutoff', 'timezone', e.target.value)}
                                disabled
                                style={{ backgroundColor: "#f5f5f5" }}
                            >
                                <option value="">Select timezone</option>
                                {timezones.map((tz) => (
                                    <option key={tz.value} value={tz.value}>
                                        {tz.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Turn Around Time Section */}
                <div className="scheme-edit-form__section">
                    <div className="scheme-edit-form__section-header">
                        <div>
                            <h2 className="scheme-edit-form__section-title">Turn Around Time</h2>
                            <p className="scheme-edit-form__section-description">
                                Time taken to deliver shipments from one location to another.
                            </p>
                        </div>
                        <Button
                            theme="secondary"
                            onClick={() => setShowTATModal(true)}
                        >
                            Bulk Action
                        </Button>
                    </div>

                    {/* Use Default TAT Toggle */}
                    <div className="toggle-row">
                        <span>Use Default TAT</span>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={formData.turnAroundTime.useDefault}
                                onChange={(e) => handleInputChange('turnAroundTime', 'useDefault', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                    {/* TAT Input Fields (shown when toggle is ON) */}
                    {formData.turnAroundTime.useDefault && (
                        <div className="scheme-edit-form__row">
                            <div className="scheme-edit-form__field-group">
                                <label className="scheme-edit-form__label">Min TAT *</label>
                                <input
                                    type="number"
                                    className="scheme-edit-form__input"
                                    value={formData.turnAroundTime.min}
                                    onChange={(e) => handleInputChange('turnAroundTime', 'min', e.target.value)}
                                    placeholder="Enter minimum TAT"
                                    min="0"
                                />
                            </div>
                            <div className="scheme-edit-form__field-group">
                                <label className="scheme-edit-form__label">Max TAT *</label>
                                <input
                                    type="number"
                                    className="scheme-edit-form__input"
                                    value={formData.turnAroundTime.max}
                                    onChange={(e) => handleInputChange('turnAroundTime', 'max', e.target.value)}
                                    placeholder="Enter maximum TAT"
                                    min="0"
                                />
                            </div>
                            <div className="scheme-edit-form__field-group">
                                <label className="scheme-edit-form__label">Unit *</label>
                                <select
                                    className="scheme-edit-form__select"
                                    value={formData.turnAroundTime.unit}
                                    onChange={(e) => handleInputChange('turnAroundTime', 'unit', e.target.value)}
                                >
                                    <option value="days">Days</option>
                                    <option value="hours">Hours</option>
                                    <option value="weeks">Weeks</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Info Banner */}
                    <div className="info-banner">
                        <span className="info-banner__icon">ⓘ</span>
                        <span className="info-banner__text">
                            If no TAT is set for a route, the default TAT will be applied.
                        </span>
                    </div>
                </div>
            </div>

            {/* Capabilities Modal */}
            {showCapabilitiesModal && (
                <DeliveryCapabilityModal
                    scheme={scheme}
                    formData={formData}
                    onClose={() => setShowCapabilitiesModal(false)}
                    onSave={(updatedFeatures) => {
                        // Extract scheme-level fields from features
                        const transportType = updatedFeatures.transport_type;
                        const deliveryType = updatedFeatures.shipping_speeds && updatedFeatures.shipping_speeds.length > 0
                            ? updatedFeatures.shipping_speeds[0] // Use first shipping speed as delivery_type
                            : formData.planDetails.planType;
                        const operationScheme = updatedFeatures.operation_scheme;

                        // Remove scheme-level fields from features object
                        const { transport_type, shipping_speeds, operation_scheme, ...featureFields } = updatedFeatures;

                        setFormData(prev => ({
                            ...prev,
                            deliveryCapabilities: {
                                features: featureFields
                            },
                            planDetails: {
                                ...prev.planDetails,
                                planType: transportType || prev.planDetails.planType
                            }
                        }));

                        // Also update scheme object for immediate display
                        if (scheme) {
                            setScheme(prev => ({
                                ...prev,
                                transport_type: transportType || prev.transport_type,
                                delivery_type: deliveryType || prev.delivery_type,
                                region: operationScheme || prev.region,
                                feature: {
                                    ...prev.feature,
                                    ...featureFields
                                }
                            }));
                        }

                        setShowCapabilitiesModal(false);
                    }}
                />
            )}

            {/* Serviceability Bulk Action Modal */}
            {showServiceabilityModal && (
                <div className="modal-overlay" onClick={() => {
                    setShowServiceabilityModal(false);
                    setSelectedServiceabilityFile(null);
                }}>
                    <div className="bulk-action-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="bulk-action-modal__header">
                            <h3 className="bulk-action-modal__title">Serviceability Bulk Action</h3>
                            <button
                                className="bulk-action-modal__close"
                                onClick={() => {
                                    setShowServiceabilityModal(false);
                                    setSelectedServiceabilityFile(null);
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <div className="bulk-action-modal__content">
                            {/* Import Data Section */}
                            <div className="bulk-action-modal__section">
                                <h4 className="bulk-action-modal__section-title">Import Data</h4>
                                <p className="bulk-action-modal__help-text">
                                    Need help in importing? <a href="#" className="bulk-action-modal__link">Learn More</a>
                                </p>
                                <div className="bulk-action-modal__row">
                                    <div className="bulk-action-modal__field-group">
                                        <label className="bulk-action-modal__label">Country</label>
                                        <select className="scheme-edit-form__select">
                                            <option value="">Select Country</option>
                                            <option value="india">India</option>
                                            <option value="usa">USA</option>
                                        </select>
                                    </div>
                                    <div className="bulk-action-modal__field-group">
                                        <label className="bulk-action-modal__label">Hierarchy Type</label>
                                        <select className="scheme-edit-form__select">
                                            <option value="">Select Type</option>
                                            <option value="pincode">Pincode</option>
                                            <option value="city">City</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="bulk-action-modal__button-row">
                                    <Button theme="secondary">Download Sample</Button>
                                    <Button theme="secondary">Export</Button>
                                </div>
                            </div>

                            {/* Upload File Section */}
                            <div className="bulk-action-modal__section">
                                <div className="bulk-action-modal__section-header">
                                    <h4 className="bulk-action-modal__section-title">Upload File</h4>
                                    <a href="#" className="bulk-action-modal__history-link">
                                        <span className="bulk-action-modal__history-icon">🕐</span>
                                        Upload History
                                    </a>
                                </div>
                                <div
                                    className={`file-drop-zone ${isDragging ? 'file-drop-zone--dragging' : ''}`}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setIsDragging(true);
                                    }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setIsDragging(false);
                                        const file = e.dataTransfer.files[0];
                                        if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
                                            setSelectedServiceabilityFile(file);
                                        }
                                    }}
                                >
                                    <input
                                        type="file"
                                        id="serviceability-file"
                                        accept=".csv"
                                        className="file-drop-zone__input"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) setSelectedServiceabilityFile(file);
                                        }}
                                    />
                                    <label htmlFor="serviceability-file" className="file-drop-zone__label">
                                        <span className="file-drop-zone__icon">+</span>
                                        <span className="file-drop-zone__text">Choose File</span>
                                        <span className="file-drop-zone__subtext">Drag and drop a file here</span>
                                        {selectedServiceabilityFile && (
                                            <span className="file-drop-zone__filename">{selectedServiceabilityFile.name}</span>
                                        )}
                                    </label>
                                    <p className="file-drop-zone__hint">
                                        Accepted File Type: .csv and max. size 15MB
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAT Bulk Action Modal */}
            {showTATModal && (
                <div className="modal-overlay" onClick={() => {
                    setShowTATModal(false);
                    setSelectedTATFile(null);
                }}>
                    <div className="bulk-action-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="bulk-action-modal__header">
                            <h3 className="bulk-action-modal__title">Tat Bulk Action</h3>
                            <button
                                className="bulk-action-modal__close"
                                onClick={() => {
                                    setShowTATModal(false);
                                    setSelectedTATFile(null);
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <div className="bulk-action-modal__content">
                            {/* Import Data Section */}
                            <div className="bulk-action-modal__section">
                                <h4 className="bulk-action-modal__section-title">Import Data</h4>
                                <p className="bulk-action-modal__help-text">
                                    Need help in importing? <a href="#" className="bulk-action-modal__link">Learn More</a>
                                </p>
                                <div className="bulk-action-modal__row">
                                    <div className="bulk-action-modal__field-group">
                                        <label className="bulk-action-modal__label">Country</label>
                                        <select className="scheme-edit-form__select">
                                            <option value="">Select Country</option>
                                            <option value="india">India</option>
                                            <option value="usa">USA</option>
                                        </select>
                                    </div>
                                    <div className="bulk-action-modal__field-group">
                                        <label className="bulk-action-modal__label">Hierarchy Type</label>
                                        <select className="scheme-edit-form__select">
                                            <option value="">Select Type</option>
                                            <option value="pincode">Pincode</option>
                                            <option value="city">City</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="bulk-action-modal__button-row">
                                    <Button theme="secondary">Download Sample</Button>
                                    <Button theme="secondary">Export</Button>
                                </div>
                            </div>

                            {/* Upload File Section */}
                            <div className="bulk-action-modal__section">
                                <div className="bulk-action-modal__section-header">
                                    <h4 className="bulk-action-modal__section-title">Upload File</h4>
                                    <a href="#" className="bulk-action-modal__history-link">
                                        <span className="bulk-action-modal__history-icon">🕐</span>
                                        Upload History
                                    </a>
                                </div>
                                <div
                                    className={`file-drop-zone ${isDragging ? 'file-drop-zone--dragging' : ''}`}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setIsDragging(true);
                                    }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setIsDragging(false);
                                        const file = e.dataTransfer.files[0];
                                        if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
                                            setSelectedTATFile(file);
                                        }
                                    }}
                                >
                                    <input
                                        type="file"
                                        id="tat-file"
                                        accept=".csv"
                                        className="file-drop-zone__input"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) setSelectedTATFile(file);
                                        }}
                                    />
                                    <label htmlFor="tat-file" className="file-drop-zone__label">
                                        <span className="file-drop-zone__icon">+</span>
                                        <span className="file-drop-zone__text">Choose File</span>
                                        <span className="file-drop-zone__subtext">Drag and drop a file here</span>
                                        {selectedTATFile && (
                                            <span className="file-drop-zone__filename">{selectedTATFile.name}</span>
                                        )}
                                    </label>
                                    <p className="file-drop-zone__hint">
                                        Accepted File Type: .csv and max. size 15MB
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
