import React, { useState, useEffect } from "react";
import axios from "axios";
import urlJoin from "url-join";
import { Button } from "@gofynd/nitrozen-react";
import loaderGif from "../public/assets/loader.gif";
import "./ServicePlans.less";

const EXAMPLE_MAIN_URL = window.location.origin;

/**
 * SchemeDetails Component
 * Displays detailed information about a specific courier scheme
 * @param {Object} props - Component props
 * @param {string} props.schemeId - The scheme ID to fetch details for
 * @param {Function} props.onBack - Callback function when back button is clicked
 */
export const SchemeDetails = ({ schemeId, onBack }) => {
    const [scheme, setScheme] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSchemeDetails = async () => {
            if (!schemeId) {
                setError("No scheme ID provided");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const { data } = await axios.get(
                    urlJoin(EXAMPLE_MAIN_URL, `/apibasic/scheme/${schemeId}`)
                );

                if (data.success) {
                    setScheme(data.data);
                    console.log("Scheme details loaded:", data.data);
                } else {
                    setError(data.message || "Failed to load scheme details");
                }
            } catch (e) {
                console.error("Error loading scheme details:", e);
                setError(e.response?.data?.message || e.message || "Failed to load scheme details");
            } finally {
                setLoading(false);
            }
        };

        fetchSchemeDetails();
    }, [schemeId]);

    const renderFeaturesList = (features) => {
        if (!features) return null;

        const enabledFeatures = Object.entries(features)
            .filter(([key, value]) => value === true)
            .map(([key]) => key);

        const disabledFeatures = Object.entries(features)
            .filter(([key, value]) => value === false)
            .map(([key]) => key);

        return (
            <div className="scheme-features">
                {enabledFeatures.length > 0 && (
                    <div className="scheme-features__section">
                        <h4 className="scheme-features__title">✅ Enabled Features</h4>
                        <div className="scheme-features__list">
                            {enabledFeatures.map((feature) => (
                                <span key={feature} className="scheme-features__tag scheme-features__tag--enabled">
                                    {formatFeatureName(feature)}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {disabledFeatures.length > 0 && (
                    <div className="scheme-features__section">
                        <h4 className="scheme-features__title">❌ Disabled Features</h4>
                        <div className="scheme-features__list">
                            {disabledFeatures.map((feature) => (
                                <span key={feature} className="scheme-features__tag scheme-features__tag--disabled">
                                    {formatFeatureName(feature)}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const formatFeatureName = (name) => {
        return name
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const renderInfoCard = (title, items) => {
        return (
            <div className="scheme-info-card">
                <h4 className="scheme-info-card__title">{title}</h4>
                <div className="scheme-info-card__content">
                    {items.map((item, idx) => (
                        <div key={idx} className="scheme-info-card__row">
                            <span className="scheme-info-card__label">{item.label}:</span>
                            <span className="scheme-info-card__value">{item.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="scheme-details">
                <div className="loading-state">
                    <img src={loaderGif} alt="Loading" className="loading-state__spinner" />
                    <p className="loading-state__text">Loading scheme details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="scheme-details">
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

    if (!scheme) {
        return (
            <div className="scheme-details">
                <div className="empty-state">
                    <span className="empty-state__icon">📦</span>
                    <p className="empty-state__text">No scheme data available</p>
                    {onBack && (
                        <Button onClick={onBack} theme="secondary">
                            Go Back
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    const basicInfo = [
        { label: "Scheme ID", value: scheme.scheme_id || "N/A" },
        { label: "Name", value: scheme.name || "N/A" },
        { label: "Extension ID", value: scheme.extension_id || "N/A" },
        { label: "Company ID", value: scheme.company_id || "N/A" },
        { label: "Stage", value: scheme.stage || "N/A" },
        { label: "Status Updates", value: scheme.status_updates || "N/A" },
    ];

    const shippingInfo = [
        { label: "Transport Type", value: scheme.transport_type || "N/A" },
        { label: "Region", value: scheme.region || "N/A" },
        { label: "Delivery Type", value: scheme.delivery_type || "N/A" },
        {
            label: "Payment Modes",
            value: scheme.payment_mode?.join(", ") || "N/A"
        },
    ];

    const weightInfo = [
        {
            label: "Weight Range",
            value: scheme.weight
                ? `${scheme.weight.gte || 0} - ${scheme.weight.lte || 0} kg`
                : "N/A"
        },
        {
            label: "Volumetric Weight",
            value: scheme.volumetric_weight
                ? `${scheme.volumetric_weight.gte || 0} - ${scheme.volumetric_weight.lte || 0} kg`
                : "N/A"
        },
        { label: "NDR Attempts", value: scheme.ndr_attempts || "N/A" },
        {
            label: "QC Shipment Quantity",
            value: scheme.qc_shipment_item_quantity || "N/A"
        },
        {
            label: "Non-QC Shipment Quantity",
            value: scheme.non_qc_shipment_item_quantity || "N/A"
        },
    ];

    const tatInfo = scheme.default_tat?.enabled && scheme.default_tat.tat ? [
        { label: "TAT Enabled", value: "Yes" },
        {
            label: "TAT Duration",
            value: `${scheme.default_tat.tat.min || 0} - ${scheme.default_tat.tat.max || 0} ${scheme.default_tat.tat.unit || "days"}`
        },
    ] : [
        { label: "TAT Enabled", value: "No" }
    ];

    const timestamps = [
        { label: "Created On", value: scheme.created_on ? new Date(scheme.created_on).toLocaleString() : "N/A" },
        { label: "Modified On", value: scheme.modified_on ? new Date(scheme.modified_on).toLocaleString() : "N/A" },
    ];

    return (
        <div className="scheme-details">
            {/* Header */}
            <div className="scheme-details__header">
                {onBack && (
                    <Button onClick={onBack} theme="secondary" className="scheme-details__back-btn">
                        ← Back
                    </Button>
                )}
                <h2 className="scheme-details__title">{scheme.name}</h2>
                <span className={`badge--${scheme.stage === 'enabled' ? 'success' : 'warning'}`}>
                    {scheme.stage?.toUpperCase()}
                </span>
            </div>

            {/* Logo */}
            {/* {scheme.logo?.large && (
                <div className="scheme-details__logo">
                    <img src={scheme.logo.large} alt={`${scheme.name} logo`} />
                </div>
            )} */}

            {/* Info Cards Grid */}
            <div className="scheme-details__grid">
                {renderInfoCard("Basic Information", basicInfo)}
                {renderInfoCard("Shipping Information", shippingInfo)}
                {renderInfoCard("Weight & Quantity", weightInfo)}
                {renderInfoCard("TAT Information", tatInfo)}
                {renderInfoCard("Timestamps", timestamps)}
            </div>

            {/* Features Section */}
            {scheme.feature && (
                <div className="scheme-details__features">
                    <h3 className="scheme-details__section-title">Features & Capabilities</h3>
                    {renderFeaturesList(scheme.feature)}
                </div>
            )}

            {/* Raw JSON (for debugging) */}
            {/* <details className="scheme-details__raw">
                <summary>View Raw JSON</summary>
                <pre>{JSON.stringify(scheme, null, 2)}</pre>
            </details> */}
        </div>
    );
};
