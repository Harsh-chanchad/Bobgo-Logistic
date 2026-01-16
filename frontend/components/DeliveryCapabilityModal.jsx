import React, { useState, useEffect } from "react";
import { Button } from "@gofynd/nitrozen-react";
import "./DeliveryCapabilityModal.less";
import "./SchemeEditForm.less"; // Import shared styles for input/select classes

/**
 * DeliveryCapabilityModal Component
 * Modal for managing delivery service capabilities
 */
export const DeliveryCapabilityModal = ({ scheme, formData, onClose, onSave }) => {
    // Initialize modal state function
    const initializeModalData = () => ({
        // Yes/No Radio Buttons
        ewaybill: formData.deliveryCapabilities.features?.ewaybill || false,
        doorstep_exchange: formData.deliveryCapabilities.features?.doorstep_exchange || false,
        cash_on_delivery: formData.deliveryCapabilities.features?.cash_on_delivery !== undefined
            ? formData.deliveryCapabilities.features.cash_on_delivery
            : (scheme?.payment_mode?.includes("COD") || false),
        doorstep_return: formData.deliveryCapabilities.features?.doorstep_return || false,
        doorstep_qc: formData.deliveryCapabilities.features?.doorstep_qc || false,
        product_installation: formData.deliveryCapabilities.features?.product_installation || false,
        openbox_delivery: formData.deliveryCapabilities.features?.openbox_delivery || false,
        mps: formData.deliveryCapabilities.features?.mps || false,

        // Checkboxes
        dangerous_goods: formData.deliveryCapabilities.features?.dangerous_goods || false,
        restricted_goods: formData.deliveryCapabilities.features?.restricted_goods || false,
        fragile_goods: formData.deliveryCapabilities.features?.fragile_goods || false,
        cold_storage_goods: formData.deliveryCapabilities.features?.cold_storage_goods || false,

        // Transportation Mode
        transport_type: formData.planDetails?.planType || scheme?.transport_type || "surface",

        // Operation Scheme
        operation_scheme: formData.deliveryCapabilities.features?.operation_scheme ||
            (scheme?.region === "intra-city" ? "intra-city" :
                scheme?.region === "inter-city" ? "inter-city" :
                    scheme?.region === "inter-country" ? "inter-country" : "intra-city"),

        // DP's Shipping Speed (multiple values)
        shipping_speeds: formData.deliveryCapabilities.features?.shipping_speeds ||
            (scheme?.delivery_type ? [scheme.delivery_type] : ["Standard Delivery"]),
        newShippingSpeed: "",

        // Status Update
        status_updates: formData.deliveryCapabilities.features?.status_updates ||
            scheme?.status_updates || scheme?.feature?.status_updates || "real-time",

        // Toggle Switches
        multi_pick_single_drop: formData.deliveryCapabilities.features?.multi_pick_single_drop || false,
        single_pick_multi_drop: formData.deliveryCapabilities.features?.single_pick_multi_drop || false,
        multi_pick_multi_drop: formData.deliveryCapabilities.features?.multi_pick_multi_drop || false,

        // NDR Attempts
        ndr_attempts: formData.deliveryCapabilities.features?.ndr_attempts ??
            scheme?.ndr_attempts ?? scheme?.feature?.ndr_attempts ?? 0,

        // Return Shipment Quantity Limitations
        qc_shipment_limit_type: (formData.deliveryCapabilities.features?.qc_shipment_item_quantity === null ||
            formData.deliveryCapabilities.features?.qc_shipment_item_quantity === undefined) ?
            "no_limit" : "apply_limit",
        qc_shipment_max_quantity: formData.deliveryCapabilities.features?.qc_shipment_item_quantity || "",
        non_qc_shipment_limit_type: (formData.deliveryCapabilities.features?.non_qc_shipment_item_quantity === null ||
            formData.deliveryCapabilities.features?.non_qc_shipment_item_quantity === undefined) ?
            "no_limit" : "apply_limit",
        non_qc_shipment_max_quantity: formData.deliveryCapabilities.features?.non_qc_shipment_item_quantity || "",
    });

    const [modalData, setModalData] = useState(initializeModalData);

    // Update modal data when formData or scheme changes (when modal opens)
    useEffect(() => {
        setModalData({
            // Yes/No Radio Buttons
            ewaybill: formData.deliveryCapabilities.features?.ewaybill || false,
            doorstep_exchange: formData.deliveryCapabilities.features?.doorstep_exchange || false,
            cash_on_delivery: formData.deliveryCapabilities.features?.cash_on_delivery !== undefined
                ? formData.deliveryCapabilities.features.cash_on_delivery
                : (scheme?.payment_mode?.includes("COD") || false),
            doorstep_return: formData.deliveryCapabilities.features?.doorstep_return || false,
            doorstep_qc: formData.deliveryCapabilities.features?.doorstep_qc || false,
            product_installation: formData.deliveryCapabilities.features?.product_installation || false,
            openbox_delivery: formData.deliveryCapabilities.features?.openbox_delivery || false,
            mps: formData.deliveryCapabilities.features?.mps || false,

            // Checkboxes
            dangerous_goods: formData.deliveryCapabilities.features?.dangerous_goods || false,
            restricted_goods: formData.deliveryCapabilities.features?.restricted_goods || false,
            fragile_goods: formData.deliveryCapabilities.features?.fragile_goods || false,
            cold_storage_goods: formData.deliveryCapabilities.features?.cold_storage_goods || false,

            // Transportation Mode
            transport_type: formData.planDetails?.planType || scheme?.transport_type || "surface",

            // Operation Scheme
            operation_scheme: formData.deliveryCapabilities.features?.operation_scheme ||
                (scheme?.region === "intra-city" ? "intra-city" :
                    scheme?.region === "inter-city" ? "inter-city" :
                        scheme?.region === "inter-country" ? "inter-country" : "intra-city"),

            // DP's Shipping Speed (multiple values)
            shipping_speeds: formData.deliveryCapabilities.features?.shipping_speeds ||
                (scheme?.delivery_type ? [scheme.delivery_type] : ["Standard Delivery"]),
            newShippingSpeed: "",

            // Status Update
            status_updates: formData.deliveryCapabilities.features?.status_updates ||
                scheme?.status_updates || scheme?.feature?.status_updates || "real-time",

            // Toggle Switches
            multi_pick_single_drop: formData.deliveryCapabilities.features?.multi_pick_single_drop || false,
            single_pick_multi_drop: formData.deliveryCapabilities.features?.single_pick_multi_drop || false,
            multi_pick_multi_drop: formData.deliveryCapabilities.features?.multi_pick_multi_drop || false,

            // NDR Attempts
            ndr_attempts: formData.deliveryCapabilities.features?.ndr_attempts ??
                scheme?.ndr_attempts ?? scheme?.feature?.ndr_attempts ?? 0,

            // Return Shipment Quantity Limitations
            qc_shipment_limit_type: (formData.deliveryCapabilities.features?.qc_shipment_item_quantity === null ||
                formData.deliveryCapabilities.features?.qc_shipment_item_quantity === undefined) ?
                "no_limit" : "apply_limit",
            qc_shipment_max_quantity: formData.deliveryCapabilities.features?.qc_shipment_item_quantity || "",
            non_qc_shipment_limit_type: (formData.deliveryCapabilities.features?.non_qc_shipment_item_quantity === null ||
                formData.deliveryCapabilities.features?.non_qc_shipment_item_quantity === undefined) ?
                "no_limit" : "apply_limit",
            non_qc_shipment_max_quantity: formData.deliveryCapabilities.features?.non_qc_shipment_item_quantity || "",
        });
    }, [formData, scheme]);

    const handleRadioChange = (field, value) => {
        setModalData(prev => ({ ...prev, [field]: value }));
    };

    const handleCheckboxChange = (field, checked) => {
        setModalData(prev => ({ ...prev, [field]: checked }));
    };

    const handleToggleChange = (field, checked) => {
        setModalData(prev => ({ ...prev, [field]: checked }));
    };

    const handleAddShippingSpeed = () => {
        if (modalData.newShippingSpeed.trim()) {
            setModalData(prev => ({
                ...prev,
                shipping_speeds: [...prev.shipping_speeds, prev.newShippingSpeed.trim()],
                newShippingSpeed: ""
            }));
        }
    };

    const handleRemoveShippingSpeed = (index) => {
        setModalData(prev => ({
            ...prev,
            shipping_speeds: prev.shipping_speeds.filter((_, i) => i !== index)
        }));
    };

    const handleSave = () => {
        // Build features object
        const features = {
            // Boolean features
            ewaybill: modalData.ewaybill,
            doorstep_exchange: modalData.doorstep_exchange,
            cash_on_delivery: modalData.cash_on_delivery,
            doorstep_return: modalData.doorstep_return,
            doorstep_qc: modalData.doorstep_qc,
            product_installation: modalData.product_installation,
            openbox_delivery: modalData.openbox_delivery,
            mps: modalData.mps,
            dangerous_goods: modalData.dangerous_goods,
            restricted_goods: modalData.restricted_goods,
            fragile_goods: modalData.fragile_goods,
            cold_storage_goods: modalData.cold_storage_goods,
            multi_pick_single_drop: modalData.multi_pick_single_drop,
            single_pick_multi_drop: modalData.single_pick_multi_drop,
            multi_pick_multi_drop: modalData.multi_pick_multi_drop,

            // Non-boolean features
            transport_type: modalData.transport_type,
            operation_scheme: modalData.operation_scheme,
            shipping_speeds: modalData.shipping_speeds,
            status_updates: modalData.status_updates,
            ndr_attempts: parseInt(modalData.ndr_attempts) || 0,
            qc_shipment_item_quantity: modalData.qc_shipment_limit_type === "no_limit" ?
                null : (modalData.qc_shipment_max_quantity ? parseInt(modalData.qc_shipment_max_quantity) : null),
            non_qc_shipment_item_quantity: modalData.non_qc_shipment_limit_type === "no_limit" ?
                null : (modalData.non_qc_shipment_max_quantity ? parseInt(modalData.non_qc_shipment_max_quantity) : null),
        };

        onSave(features);
    };

    return (
        <div className="modal-overlay capabilities-modal-overlay" onClick={onClose}>
            <div className="capabilities-modal" onClick={(e) => e.stopPropagation()}>
                <div className="capabilities-modal__header">
                    <h3 className="capabilities-modal__title">Add Delivery Service Capabilities</h3>
                    <button
                        className="capabilities-modal__close"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                <div className="capabilities-modal__content">
                    {/* Select Capabilities (Checkboxes) - First Section */}
                    <div className="capabilities-modal__section">
                        <h4 className="capabilities-modal__section-title">Select Capabilities</h4>
                        <div className="capabilities-modal__checkbox-group">
                            <label className="capabilities-modal__checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={modalData.dangerous_goods}
                                    onChange={(e) => handleCheckboxChange("dangerous_goods", e.target.checked)}
                                />
                                <span>Dangerous Goods</span>
                            </label>
                            <label className="capabilities-modal__checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={modalData.restricted_goods}
                                    onChange={(e) => handleCheckboxChange("restricted_goods", e.target.checked)}
                                />
                                <span>Restricted Goods</span>
                            </label>
                            <label className="capabilities-modal__checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={modalData.fragile_goods}
                                    onChange={(e) => handleCheckboxChange("fragile_goods", e.target.checked)}
                                />
                                <span>Fragile Goods</span>
                            </label>
                            <label className="capabilities-modal__checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={modalData.cold_storage_goods}
                                    onChange={(e) => handleCheckboxChange("cold_storage_goods", e.target.checked)}
                                />
                                <span>Cold Storage Goods</span>
                            </label>
                        </div>
                    </div>

                    {/* Transportation Mode - Second Section */}
                    <div className="capabilities-modal__section">
                        <h4 className="capabilities-modal__section-title">Transportation Mode *</h4>
                        <div className="capabilities-modal__radio-group">
                            <label className="capabilities-modal__radio-label">
                                <input
                                    type="radio"
                                    name="transport_type"
                                    value="air"
                                    checked={modalData.transport_type === "air"}
                                    onChange={(e) => handleRadioChange("transport_type", e.target.value)}
                                />
                                <span>Air</span>
                            </label>
                            <label className="capabilities-modal__radio-label">
                                <input
                                    type="radio"
                                    name="transport_type"
                                    value="surface"
                                    checked={modalData.transport_type === "surface"}
                                    onChange={(e) => handleRadioChange("transport_type", e.target.value)}
                                />
                                <span>Surface</span>
                            </label>
                            <label className="capabilities-modal__radio-label">
                                <input
                                    type="radio"
                                    name="transport_type"
                                    value="waterways"
                                    checked={modalData.transport_type === "waterways"}
                                    onChange={(e) => handleRadioChange("transport_type", e.target.value)}
                                />
                                <span>Waterways</span>
                            </label>
                        </div>
                    </div>

                    {/* Operation Scheme - Third Section */}
                    <div className="capabilities-modal__section">
                        <h4 className="capabilities-modal__section-title">Operation Scheme *</h4>
                        <div className="capabilities-modal__radio-group">
                            <label className="capabilities-modal__radio-label">
                                <input
                                    type="radio"
                                    name="operation_scheme"
                                    value="intra-city"
                                    checked={modalData.operation_scheme === "intra-city"}
                                    onChange={(e) => handleRadioChange("operation_scheme", e.target.value)}
                                />
                                <span>Intra-City</span>
                            </label>
                            <label className="capabilities-modal__radio-label">
                                <input
                                    type="radio"
                                    name="operation_scheme"
                                    value="inter-city"
                                    checked={modalData.operation_scheme === "inter-city"}
                                    onChange={(e) => handleRadioChange("operation_scheme", e.target.value)}
                                />
                                <span>Inter-City</span>
                            </label>
                            <label className="capabilities-modal__radio-label">
                                <input
                                    type="radio"
                                    name="operation_scheme"
                                    value="inter-country"
                                    checked={modalData.operation_scheme === "inter-country"}
                                    onChange={(e) => handleRadioChange("operation_scheme", e.target.value)}
                                />
                                <span>Inter-Country</span>
                            </label>
                        </div>
                    </div>

                    {/* DP's Shipping Speed - Fourth Section */}
                    <div className="capabilities-modal__section">
                        <h4 className="capabilities-modal__section-title">DP's Shipping Speed *</h4>
                        <div className="capabilities-modal__shipping-speed-group">
                            {modalData.shipping_speeds.map((speed, index) => (
                                <div key={index} className="capabilities-modal__shipping-speed-item">
                                    <span>{speed}</span>
                                    <button
                                        type="button"
                                        className="capabilities-modal__remove-btn"
                                        onClick={() => handleRemoveShippingSpeed(index)}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            <div className="capabilities-modal__shipping-speed-input">
                                <input
                                    type="text"
                                    className="scheme-edit-form__input"
                                    placeholder="Enter shipping speed"
                                    value={modalData.newShippingSpeed}
                                    onChange={(e) => setModalData(prev => ({ ...prev, newShippingSpeed: e.target.value }))}
                                    onKeyPress={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleAddShippingSpeed();
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    className="capabilities-modal__add-btn"
                                    onClick={handleAddShippingSpeed}
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Yes/No Radio Buttons Section */}
                    <div className="capabilities-modal__section">
                        <h4 className="capabilities-modal__section-title">E-Waybill *</h4>
                        <div className="capabilities-modal__radio-group">
                            <label className="capabilities-modal__radio-label">
                                <input
                                    type="radio"
                                    name="ewaybill"
                                    checked={modalData.ewaybill === true}
                                    onChange={() => handleRadioChange("ewaybill", true)}
                                />
                                <span>Yes</span>
                            </label>
                            <label className="capabilities-modal__radio-label">
                                <input
                                    type="radio"
                                    name="ewaybill"
                                    checked={modalData.ewaybill === false}
                                    onChange={() => handleRadioChange("ewaybill", false)}
                                />
                                <span>No</span>
                            </label>
                        </div>
                    </div>

                    <div className="capabilities-modal__section">
                        <h4 className="capabilities-modal__section-title">Doorstep Hand To Hand Exchange *</h4>
                        <div className="capabilities-modal__radio-group">
                            <label className="capabilities-modal__radio-label">
                                <input
                                    type="radio"
                                    name="doorstep_exchange"
                                    checked={modalData.doorstep_exchange === true}
                                    onChange={() => handleRadioChange("doorstep_exchange", true)}
                                />
                                <span>Yes</span>
                            </label>
                            <label className="capabilities-modal__radio-label">
                                <input
                                    type="radio"
                                    name="doorstep_exchange"
                                    checked={modalData.doorstep_exchange === false}
                                    onChange={() => handleRadioChange("doorstep_exchange", false)}
                                />
                                <span>No</span>
                            </label>
                        </div>
                    </div>

                    <div className="capabilities-modal__section">
                        <h4 className="capabilities-modal__section-title">Cash On Delivery *</h4>
                        <div className="capabilities-modal__radio-group">
                            <label className="capabilities-modal__radio-label">
                                <input
                                    type="radio"
                                    name="cash_on_delivery"
                                    checked={modalData.cash_on_delivery === true}
                                    onChange={() => handleRadioChange("cash_on_delivery", true)}
                                />
                                <span>Yes</span>
                            </label>
                            <label className="capabilities-modal__radio-label">
                                <input
                                    type="radio"
                                    name="cash_on_delivery"
                                    checked={modalData.cash_on_delivery === false}
                                    onChange={() => handleRadioChange("cash_on_delivery", false)}
                                />
                                <span>No</span>
                            </label>
                        </div>
                    </div>

                    <div className="capabilities-modal__section">
                        <h4 className="capabilities-modal__section-title">Doorstep Return *</h4>
                        <div className="capabilities-modal__radio-group">
                            <label className="capabilities-modal__radio-label">
                                <input
                                    type="radio"
                                    name="doorstep_return"
                                    checked={modalData.doorstep_return === true}
                                    onChange={() => handleRadioChange("doorstep_return", true)}
                                />
                                <span>Yes</span>
                            </label>
                            <label className="capabilities-modal__radio-label">
                                <input
                                    type="radio"
                                    name="doorstep_return"
                                    checked={modalData.doorstep_return === false}
                                    onChange={() => handleRadioChange("doorstep_return", false)}
                                />
                                <span>No</span>
                            </label>
                        </div>
                    </div>

                    <div className="capabilities-modal__section">
                        <h4 className="capabilities-modal__section-title">Doorstep QC *</h4>
                        <div className="capabilities-modal__radio-group">
                            <label className="capabilities-modal__radio-label">
                                <input
                                    type="radio"
                                    name="doorstep_qc"
                                    checked={modalData.doorstep_qc === true}
                                    onChange={() => handleRadioChange("doorstep_qc", true)}
                                />
                                <span>Yes</span>
                            </label>
                            <label className="capabilities-modal__radio-label">
                                <input
                                    type="radio"
                                    name="doorstep_qc"
                                    checked={modalData.doorstep_qc === false}
                                    onChange={() => handleRadioChange("doorstep_qc", false)}
                                />
                                <span>No</span>
                            </label>
                        </div>
                    </div>

                    <div className="capabilities-modal__section">
                        <h4 className="capabilities-modal__section-title">Product Installation Capability *</h4>
                        <div className="capabilities-modal__radio-group">
                            <label className="capabilities-modal__radio-label">
                                <input
                                    type="radio"
                                    name="product_installation"
                                    checked={modalData.product_installation === true}
                                    onChange={() => handleRadioChange("product_installation", true)}
                                />
                                <span>Yes</span>
                            </label>
                            <label className="capabilities-modal__radio-label">
                                <input
                                    type="radio"
                                    name="product_installation"
                                    checked={modalData.product_installation === false}
                                    onChange={() => handleRadioChange("product_installation", false)}
                                />
                                <span>No</span>
                            </label>
                        </div>
                    </div>

                    <div className="capabilities-modal__section">
                        <h4 className="capabilities-modal__section-title">Open Box Delivery *</h4>
                        <div className="capabilities-modal__radio-group">
                            <label className="capabilities-modal__radio-label">
                                <input
                                    type="radio"
                                    name="openbox_delivery"
                                    checked={modalData.openbox_delivery === true}
                                    onChange={() => handleRadioChange("openbox_delivery", true)}
                                />
                                <span>Yes</span>
                            </label>
                            <label className="capabilities-modal__radio-label">
                                <input
                                    type="radio"
                                    name="openbox_delivery"
                                    checked={modalData.openbox_delivery === false}
                                    onChange={() => handleRadioChange("openbox_delivery", false)}
                                />
                                <span>No</span>
                            </label>
                        </div>
                    </div>

                    <div className="capabilities-modal__section">
                        <h4 className="capabilities-modal__section-title">Multi Part Shipment *</h4>
                        <div className="capabilities-modal__radio-group">
                            <label className="capabilities-modal__radio-label">
                                <input
                                    type="radio"
                                    name="mps"
                                    checked={modalData.mps === true}
                                    onChange={() => handleRadioChange("mps", true)}
                                />
                                <span>Yes</span>
                            </label>
                            <label className="capabilities-modal__radio-label">
                                <input
                                    type="radio"
                                    name="mps"
                                    checked={modalData.mps === false}
                                    onChange={() => handleRadioChange("mps", false)}
                                />
                                <span>No</span>
                            </label>
                        </div>
                    </div>

                    {/* Status Update */}
                    <div className="capabilities-modal__section">
                        <h4 className="capabilities-modal__section-title">Status Update *</h4>
                        <div className="capabilities-modal__radio-group">
                            <label className="capabilities-modal__radio-label">
                                <input
                                    type="radio"
                                    name="status_updates"
                                    value="real-time"
                                    checked={modalData.status_updates === "real-time"}
                                    onChange={(e) => handleRadioChange("status_updates", e.target.value)}
                                />
                                <span>Real Time</span>
                            </label>
                            <label className="capabilities-modal__radio-label">
                                <input
                                    type="radio"
                                    name="status_updates"
                                    value="delayed"
                                    checked={modalData.status_updates === "delayed"}
                                    onChange={(e) => handleRadioChange("status_updates", e.target.value)}
                                />
                                <span>Delayed</span>
                            </label>
                        </div>
                    </div>

                    {/* Toggle Switches */}
                    <div className="capabilities-modal__section">
                        <h4 className="capabilities-modal__section-title">Delivery Type Toggles</h4>
                        <div className="capabilities-modal__toggle-group">
                            <div className="toggle-row">
                                <span>Multi pick single drop</span>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={modalData.multi_pick_single_drop}
                                        onChange={(e) => handleToggleChange("multi_pick_single_drop", e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                            <div className="toggle-row">
                                <span>Single pick multi drop</span>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={modalData.single_pick_multi_drop}
                                        onChange={(e) => handleToggleChange("single_pick_multi_drop", e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                            <div className="toggle-row">
                                <span>Multi pick multi drop</span>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={modalData.multi_pick_multi_drop}
                                        onChange={(e) => handleToggleChange("multi_pick_multi_drop", e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* NDR Attempts */}
                    <div className="capabilities-modal__section">
                        <h4 className="capabilities-modal__section-title">
                            No. of NDR re-attempts allowed
                            <span className="capabilities-modal__info-icon" title="Number of NDR re-attempts">ⓘ</span>
                        </h4>
                        <div className="capabilities-modal__radio-group capabilities-modal__radio-group--horizontal">
                            {[0, 1, 2, 3, 4].map((num) => (
                                <label key={num} className="capabilities-modal__radio-label">
                                    <input
                                        type="radio"
                                        name="ndr_attempts"
                                        value={num}
                                        checked={modalData.ndr_attempts === num}
                                        onChange={(e) => handleRadioChange("ndr_attempts", parseInt(e.target.value))}
                                    />
                                    <span>{num}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Return Shipment Quantity Limitations */}
                    <div className="capabilities-modal__section">
                        <h4 className="capabilities-modal__section-title">
                            Return Shipment Quantity Limitations
                            <span className="capabilities-modal__info-icon" title="Return shipment quantity limits">ⓘ</span>
                        </h4>

                        <div className="capabilities-modal__quantity-group">
                            <div className="capabilities-modal__quantity-item">
                                <label className="capabilities-modal__label">With QC Shipment Quantity</label>
                                <select
                                    className="scheme-edit-form__select"
                                    value={modalData.qc_shipment_limit_type}
                                    onChange={(e) => setModalData(prev => ({ ...prev, qc_shipment_limit_type: e.target.value }))}
                                >
                                    <option value="no_limit">No Limit</option>
                                    <option value="apply_limit">Apply Limit</option>
                                </select>
                                {modalData.qc_shipment_limit_type === "apply_limit" && (
                                    <div className="capabilities-modal__max-quantity">
                                        <label className="capabilities-modal__label">Max Quantity *</label>
                                        <input
                                            type="number"
                                            className="scheme-edit-form__input"
                                            placeholder="Enter Max Quantity"
                                            value={modalData.qc_shipment_max_quantity}
                                            onChange={(e) => setModalData(prev => ({ ...prev, qc_shipment_max_quantity: e.target.value }))}
                                            min="1"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="capabilities-modal__quantity-item">
                                <label className="capabilities-modal__label">Without QC Shipment Quantity</label>
                                <select
                                    className="scheme-edit-form__select"
                                    value={modalData.non_qc_shipment_limit_type}
                                    onChange={(e) => setModalData(prev => ({ ...prev, non_qc_shipment_limit_type: e.target.value }))}
                                >
                                    <option value="no_limit">No Limit</option>
                                    <option value="apply_limit">Apply Limit</option>
                                </select>
                                {modalData.non_qc_shipment_limit_type === "apply_limit" && (
                                    <div className="capabilities-modal__max-quantity">
                                        <label className="capabilities-modal__label">Max Quantity *</label>
                                        <input
                                            type="number"
                                            className="scheme-edit-form__input"
                                            placeholder="Enter Max Quantity"
                                            value={modalData.non_qc_shipment_max_quantity}
                                            onChange={(e) => setModalData(prev => ({ ...prev, non_qc_shipment_max_quantity: e.target.value }))}
                                            min="1"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="capabilities-modal__footer">
                    <Button
                        theme="secondary"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        theme="primary"
                        onClick={handleSave}
                    >
                        Add
                    </Button>
                </div>
            </div>
        </div>
    );
};
