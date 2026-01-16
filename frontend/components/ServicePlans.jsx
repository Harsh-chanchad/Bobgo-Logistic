import React, { useState, useEffect } from "react";
import { Button } from "@gofynd/nitrozen-react";
import loaderGif from "../public/assets/loader.gif";
import localShippingIcon from "../public/assets/local_shipping.svg";
import airplaneIcon from "../public/assets/plane.svg";
import { api } from "../utils/api";
import { SchemeEditForm } from "./SchemeEditForm";
import "./ServicePlans.less";

const EXAMPLE_MAIN_URL = window.location.origin;

// Icon components
const TruckIcon = () => (
    <div className="plan-card__icon">
        <img src={localShippingIcon} alt="Truck Icon" />
    </div>
);

const PlaneIcon = () => (
    <div className="plan-card__icon">
        <img src={airplaneIcon} alt="Plane Icon" />
    </div>
);

const ChevronRightIcon = () => (
    <svg
        className="plan-card__chevron"
        fill="none"
        stroke="#666666"
        strokeWidth="2"
        viewBox="0 0 24 24"
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
);

const PlusIcon = () => (
    <svg className="fab__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
    </svg>
);

export const ServicePlans = ({ companyId }) => {
    const [servicePlans, setServicePlans] = useState(null);
    const [plansLoading, setPlansLoading] = useState(true);
    const [selectedSchemeId, setSelectedSchemeId] = useState(null);

    useEffect(() => {
        const loadServicePlans = async () => {
            setPlansLoading(true);
            try {
                const result = await api.getAllSchemes(companyId);
                if (result.success) {
                    setServicePlans(result.data);
                    console.log("Service Plans loaded:", result.data);
                } else {
                    setServicePlans({ error: result.error });
                }
            } catch (e) {
                console.error("Error loading service plans:", e);
                setServicePlans({ error: e.message });
            } finally {
                setPlansLoading(false);
            }
        };

        if (companyId) {
            loadServicePlans();
        }
    }, [companyId]);

    // If a scheme is selected, show the edit form
    if (selectedSchemeId) {
        return (
            <SchemeEditForm
                schemeId={selectedSchemeId}
                companyId={companyId}
                onBack={() => setSelectedSchemeId(null)}
            />
        );
    }

    const getServiceIcon = (plan) => {
        // Check if transport type is air or if name contains "Air"
        if (plan.transport_type?.toLowerCase().includes("air") ||
            plan.name?.toLowerCase().includes("air")) {
            return <PlaneIcon />;
        }
        return <TruckIcon />;
    };

    const getStatusBadge = (plan) => {
        const isCustom = plan.company_id && plan.company_id !== "_all_";
        return (
            <span className={isCustom ? "badge--custom" : "badge--admin"}>
                {isCustom ? 'CUSTOM' : 'ADMIN'}
            </span>
        );
    };

    // Get tags/capabilities from plan
    const getTags = (plan) => {
        const tags = [];

        // Add delivery_type as a tag if exists
        if (plan.delivery_type) {
            tags.push(plan.delivery_type);
        }

        // Add feature flags as tags
        if (plan.feature) {
            if (plan.feature.doorstep_qc) tags.push('Doorstep QC');
            if (plan.feature.cold_storage) tags.push('Cold Storage Goods');
            if (plan.feature.dangerous_goods) tags.push('Dangerous Goods');
            if (plan.feature.fragile_goods) tags.push('Fragile Goods');
            if (plan.feature.mps) tags.push('Mps');
        }

        return tags;
    };

    const renderServicePlansSection = () => {
        if (plansLoading) {
            return (
                <div className="loading-state">
                    <img src={loaderGif} alt="Loading" className="loading-state__spinner" />
                    <p className="loading-state__text">Loading available service plans...</p>
                </div>
            );
        }

        if (servicePlans?.error) {
            return (
                <div className="error-state">
                    <span className="error-state__icon">⚠️</span>
                    <p className="error-state__text">
                        Failed to load service plans: {servicePlans.error}
                    </p>
                </div>
            );
        }

        if (!servicePlans?.items || servicePlans.items.length === 0) {
            return (
                <div className="empty-state">
                    <span className="empty-state__icon">📦</span>
                    <p className="empty-state__text">No service plans available</p>
                </div>
            );
        }

        return (
            <div className="service-plans__list">
                {servicePlans.items.map((plan, index) => {
                    const planId = plan.scheme_id || index;
                    const tags = getTags(plan);

                    return (
                        <div
                            key={planId}
                            className="plan-card"
                            onClick={() => {
                                console.log('Plan clicked:', plan.scheme_id, plan.name);
                                setSelectedSchemeId(plan.scheme_id);
                            }}
                            style={{ cursor: 'pointer' }}
                        >
                            {/* Icon */}
                            {getServiceIcon(plan)}

                            {/* Content - Title and Tags */}
                            <div className="plan-card__content">
                                <h3 className="plan-card__title">
                                    {plan.name || "Unnamed Plan"}
                                </h3>
                                {tags.length > 0 && (
                                    <div className="plan-card__tags">
                                        {tags.map((tag, idx) => (
                                            <span key={idx} className="plan-card__tag">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Right Section - Badge and Chevron */}
                            <div className="plan-card__right">
                                {getStatusBadge(plan)}
                                <ChevronRightIcon />
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div
            className="service-plans"
            onClick={() => {
                console.log('Service Plans clicked');
            }}
        >
            {/* Header Section */}
            <div className="service-plans__header">
                <div className="service-plans__header-content">
                    <div className="service-plans__header-text">
                        <h1 className="service-plans__header-title">
                            Service Plans
                        </h1>
                        <p className="service-plans__header-description">
                            Activate the desired service offered below or create your own contracted account.
                        </p>
                    </div>
                    <Button
                        theme="primary"
                        className="service-plans__create-btn"
                    >
                        Create Own Account
                    </Button>
                </div>
            </div>

            {/* Service Plans List */}
            <div className="service-plans__list-container">
                {renderServicePlansSection()}
            </div>

            {/* Floating Action Button */}
            <div className="fab">
                <Button
                    rounded
                    className="fab__button"
                    onClick={() => console.log('Add new service plan')}
                >
                    <PlusIcon />
                </Button>
            </div>
        </div>
    );
};
