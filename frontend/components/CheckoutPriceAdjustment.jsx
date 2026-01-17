import React, { useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import urlJoin from "url-join";
import loaderGif from "../public/assets/loader.gif";

const EXAMPLE_MAIN_URL = window.location.origin;

export const CheckoutPriceAdjustment = ({ companyId: propCompanyId }) => {
    const { company_id: routeCompanyId, application_id: routeApplicationId } = useParams();
    const companyId = propCompanyId || routeCompanyId;

    // Form state
    const [cartId, setCartId] = useState("");
    const [applicationId, setApplicationId] = useState(routeApplicationId || "");
    const [deliveryAddress, setDeliveryAddress] = useState({
        company: "",
        street_address: "",
        local_area: "",
        city: "",
        zone: "",
        country: "ZA",
        code: "",
    });
    const [items, setItems] = useState([
        {
            description: "",
            price: 0,
            quantity: 1,
            length_cm: 0,
            width_cm: 0,
            height_cm: 0,
            weight_kg: 0,
        },
    ]);

    // Service plans state
    const [servicePlans, setServicePlans] = useState(null);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [planLoading, setPlanLoading] = useState(false);
    const [planError, setPlanError] = useState(null);

    // Price adjustment state
    const [adjustmentLoading, setAdjustmentLoading] = useState(false);
    const [adjustmentResult, setAdjustmentResult] = useState(null);
    const [adjustmentError, setAdjustmentError] = useState(null);

    // Fetch service plans
    const fetchServicePlans = async () => {
        if (!companyId) {
            setPlanError("Company ID is required");
            return;
        }

        // Validate delivery address
        if (!deliveryAddress.street_address || !deliveryAddress.city) {
            setPlanError("Please fill in delivery address (street address and city are required)");
            return;
        }

        // Validate items
        if (items.length === 0 || items.some(item => !item.price || !item.weight_kg)) {
            setPlanError("Please add at least one item with price and weight");
            return;
        }

        setPlanLoading(true);
        setPlanError(null);
        setServicePlans(null);
        setSelectedPlan(null);

        try {
            const requestBody = {
                delivery_address: deliveryAddress,
                items: items,
            };

            const { data } = await axios.post(
                urlJoin(EXAMPLE_MAIN_URL, "/api/checkout/getServicePlan"),
                requestBody,
                {
                    headers: {
                        "x-company-id": companyId,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (data.success && data.data) {
                // Handle different response structures
                const plans = data.data.items || data.data.plans || (Array.isArray(data.data) ? data.data : [data.data]);
                setServicePlans(plans);
                console.log("Service Plans Response:", plans);
            } else {
                setPlanError(data.message || "No service plans available");
            }
        } catch (e) {
            console.error("Error fetching service plans:", e);
            setPlanError(e.response?.data?.message || e.message);
        } finally {
            setPlanLoading(false);
        }
    };

    // Update cart price with selected service plan
    const updateCartPrice = async () => {
        if (!cartId) {
            setAdjustmentError("Cart ID is required");
            return;
        }

        if (!applicationId) {
            setAdjustmentError("Application ID is required");
            return;
        }

        if (!selectedPlan) {
            setAdjustmentError("Please select a service plan first");
            return;
        }

        setAdjustmentLoading(true);
        setAdjustmentError(null);
        setAdjustmentResult(null);

        try {
            // Extract service plan data for price adjustment
            const servicePlanData = {
                id: selectedPlan.id || selectedPlan.plan_id || selectedPlan._id,
                name: selectedPlan.name || selectedPlan.plan_name || "Delivery Service",
                rate: selectedPlan.rate || selectedPlan.price || selectedPlan.cost || 0,
                currency: selectedPlan.currency || "INR",
                estimated_days: selectedPlan.estimated_days || selectedPlan.delivery_time,
            };

            const { data } = await axios.post(
                urlJoin(EXAMPLE_MAIN_URL, "/api/checkout/priceadjustment"),
                {
                    cart_id: cartId,
                    application_id: applicationId,
                    service_plan: servicePlanData,
                },
                {
                    headers: {
                        "x-company-id": companyId,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (data.success) {
                setAdjustmentResult(data.data);
                console.log("Cart updated successfully:", data.data);
            } else {
                setAdjustmentError(data.message || "Failed to update cart");
            }
        } catch (e) {
            console.error("Error updating cart:", e);
            setAdjustmentError(e.response?.data?.message || e.message);
        } finally {
            setAdjustmentLoading(false);
        }
    };

    // Add new item
    const addItem = () => {
        setItems([...items, {
            description: "",
            price: 0,
            quantity: 1,
            length_cm: 0,
            width_cm: 0,
            height_cm: 0,
            weight_kg: 0,
        }]);
    };

    // Update item
    const updateItem = (index, field, value) => {
        const updatedItems = [...items];
        updatedItems[index][field] = field === "price" || field.includes("_") || field === "quantity" || field === "weight_kg"
            ? parseFloat(value) || 0
            : value;
        setItems(updatedItems);
    };

    // Remove item
    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    return (
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Checkout Price Adjustment
                </h2>
                <p className="text-sm text-gray-600">
                    Select service plan and update cart with shipping charges
                </p>
            </div>

            {/* Step 1: Cart & Application Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Step 1: Cart Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cart ID *
                        </label>
                        <input
                            type="text"
                            value={cartId}
                            onChange={(e) => setCartId(e.target.value)}
                            placeholder="Enter cart ID"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Application ID *
                        </label>
                        <input
                            type="text"
                            value={applicationId}
                            onChange={(e) => setApplicationId(e.target.value)}
                            placeholder="Enter application ID"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Step 2: Delivery Address */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Step 2: Delivery Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                        <input
                            type="text"
                            value={deliveryAddress.company}
                            onChange={(e) => setDeliveryAddress({ ...deliveryAddress, company: e.target.value })}
                            placeholder="Company name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                        <input
                            type="text"
                            value={deliveryAddress.street_address}
                            onChange={(e) => setDeliveryAddress({ ...deliveryAddress, street_address: e.target.value })}
                            placeholder="Street address"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Local Area</label>
                        <input
                            type="text"
                            value={deliveryAddress.local_area}
                            onChange={(e) => setDeliveryAddress({ ...deliveryAddress, local_area: e.target.value })}
                            placeholder="Local area"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                        <input
                            type="text"
                            value={deliveryAddress.city}
                            onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
                            placeholder="City"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
                        <input
                            type="text"
                            value={deliveryAddress.zone}
                            onChange={(e) => setDeliveryAddress({ ...deliveryAddress, zone: e.target.value })}
                            placeholder="Zone"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Country Code</label>
                        <input
                            type="text"
                            value={deliveryAddress.country}
                            onChange={(e) => setDeliveryAddress({ ...deliveryAddress, country: e.target.value })}
                            placeholder="ZA"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                        <input
                            type="text"
                            value={deliveryAddress.code}
                            onChange={(e) => setDeliveryAddress({ ...deliveryAddress, code: e.target.value })}
                            placeholder="Postal code"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                </div>
            </div>

            {/* Step 3: Items */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Step 3: Items</h3>
                    <button
                        onClick={addItem}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                        + Add Item
                    </button>
                </div>
                {items.map((item, index) => (
                    <div key={index} className="mb-4 p-3 bg-white rounded border border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-gray-700">Item {index + 1}</span>
                            {items.length > 1 && (
                                <button
                                    onClick={() => removeItem(index)}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Description</label>
                                <input
                                    type="text"
                                    value={item.description}
                                    onChange={(e) => updateItem(index, "description", e.target.value)}
                                    placeholder="Item description"
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Price *</label>
                                <input
                                    type="number"
                                    value={item.price}
                                    onChange={(e) => updateItem(index, "price", e.target.value)}
                                    placeholder="0"
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Quantity</label>
                                <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => updateItem(index, "quantity", e.target.value)}
                                    placeholder="1"
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Weight (kg) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={item.weight_kg}
                                    onChange={(e) => updateItem(index, "weight_kg", e.target.value)}
                                    placeholder="0"
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Length (cm)</label>
                                <input
                                    type="number"
                                    value={item.length_cm}
                                    onChange={(e) => updateItem(index, "length_cm", e.target.value)}
                                    placeholder="0"
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Width (cm)</label>
                                <input
                                    type="number"
                                    value={item.width_cm}
                                    onChange={(e) => updateItem(index, "width_cm", e.target.value)}
                                    placeholder="0"
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Height (cm)</label>
                                <input
                                    type="number"
                                    value={item.height_cm}
                                    onChange={(e) => updateItem(index, "height_cm", e.target.value)}
                                    placeholder="0"
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Step 4: Get Service Plans */}
            <div className="mb-6">
                <button
                    onClick={fetchServicePlans}
                    disabled={planLoading}
                    className={`w-full py-3 px-5 rounded-lg text-base font-semibold transition-all ${planLoading
                        ? "bg-gray-400 cursor-not-allowed opacity-70"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                >
                    {planLoading ? (
                        <span className="flex items-center justify-center gap-2">
                            <img src={loaderGif} alt="Loading" className="w-5 h-5" />
                            Fetching Service Plans...
                        </span>
                    ) : (
                        "📦 Step 4: Get Service Plans"
                    )}
                </button>
                {planError && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                        {planError}
                    </div>
                )}
            </div>

            {/* Step 5: Select Service Plan */}
            {servicePlans && servicePlans.length > 0 && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Step 5: Select Service Plan</h3>
                    <div className="space-y-2">
                        {servicePlans.map((plan, index) => {
                            const planId = plan.id || plan.plan_id || plan._id || index;
                            const planName = plan.name || plan.plan_name || `Plan ${index + 1}`;
                            const planRate = plan.rate || plan.price || plan.cost || 0;
                            const planCurrency = plan.currency || "INR";
                            const isSelected = selectedPlan && (selectedPlan.id === planId || selectedPlan.plan_id === planId);

                            return (
                                <div
                                    key={planId}
                                    onClick={() => setSelectedPlan(plan)}
                                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${isSelected
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-gray-200 bg-white hover:border-gray-300"
                                        }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h4 className="font-semibold text-gray-900">{planName}</h4>
                                            {plan.estimated_days && (
                                                <p className="text-sm text-gray-600">
                                                    Estimated delivery: {plan.estimated_days} days
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-gray-900">
                                                {planCurrency} {planRate.toFixed(2)}
                                            </p>
                                            {isSelected && (
                                                <span className="text-xs text-blue-600">✓ Selected</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Step 6: Update Cart */}
            {selectedPlan && (
                <div className="mb-6">
                    <button
                        onClick={updateCartPrice}
                        disabled={adjustmentLoading}
                        className={`w-full py-3 px-5 rounded-lg text-base font-semibold transition-all ${adjustmentLoading
                            ? "bg-gray-400 cursor-not-allowed opacity-70"
                            : "bg-green-600 text-white hover:bg-green-700"
                            }`}
                    >
                        {adjustmentLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <img src={loaderGif} alt="Loading" className="w-5 h-5" />
                                Updating Cart...
                            </span>
                        ) : (
                            "✅ Step 6: Update Cart Price"
                        )}
                    </button>
                    {adjustmentError && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                            {adjustmentError}
                        </div>
                    )}
                </div>
            )}

            {/* Results */}
            {adjustmentResult && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-green-800 mb-3">✅ Cart Updated Successfully!</h3>
                    <div className="space-y-2 text-sm">
                        <div>
                            <span className="font-medium">Cart ID:</span> {adjustmentResult.cart_id}
                        </div>
                        {adjustmentResult.service_plan && (
                            <div>
                                <span className="font-medium">Service Plan:</span> {adjustmentResult.service_plan.name}
                            </div>
                        )}
                        {adjustmentResult.breakup && adjustmentResult.breakup.raw && (
                            <div>
                                <span className="font-medium">Shipping Charge:</span>{" "}
                                {adjustmentResult.currency?.code || "INR"} {adjustmentResult.breakup.raw.delivery || 0}
                            </div>
                        )}
                        {adjustmentResult.breakup && adjustmentResult.breakup.raw && (
                            <div>
                                <span className="font-medium">Total:</span>{" "}
                                {adjustmentResult.currency?.code || "INR"} {adjustmentResult.breakup.raw.total || 0}
                            </div>
                        )}
                    </div>
                    <details className="mt-4">
                        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                            View Full Response
                        </summary>
                        <pre className="mt-2 p-3 bg-white rounded text-xs overflow-auto max-h-64 border border-gray-200">
                            {JSON.stringify(adjustmentResult, null, 2)}
                        </pre>
                    </details>
                </div>
            )}
        </div>
    );
};
