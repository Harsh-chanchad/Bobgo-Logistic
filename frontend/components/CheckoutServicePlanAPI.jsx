import React, { useState } from "react";
import axios from "axios";
import urlJoin from "url-join";
import loaderGif from "../public/assets/loader.gif";

const EXAMPLE_MAIN_URL = window.location.origin;

export const CheckoutServicePlanAPI = () => {
    const [servicePlan, setServicePlan] = useState(null);
    const [planLoading, setPlanLoading] = useState(false);

    const fetchServicePlan = async () => {
        setPlanLoading(true);
        setServicePlan(null);
        try {
            const { data } = await axios.post(
                urlJoin(EXAMPLE_MAIN_URL, "/api/checkout/getServicePlan")
            );
            setServicePlan(data);
            console.log("Service Plan Response:", data);
        } catch (e) {
            console.error("Error fetching service plan:", e);
            setServicePlan({ error: e.message });
        } finally {
            setPlanLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 transition-all hover:shadow-lg">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-semibold text-gray-900">
                    Checkout Service Plan
                </h3>
                <span className="px-3 py-1 bg-green-600 text-white rounded text-xs font-semibold">
                    POST
                </span>
            </div>

            <p className="text-sm text-blue-600 font-mono bg-gray-50 px-3 py-2 rounded-md mb-3 break-all">
                /api/checkout/getServicePlan
            </p>
            <p className="text-sm text-gray-600 leading-relaxed mb-5">
                Get service plan and rates for checkout from delivery partner
            </p>

            <button
                onClick={fetchServicePlan}
                disabled={planLoading}
                className={`w-full py-3 px-5 rounded-lg text-base font-semibold transition-all mb-5 ${planLoading
                        ? "bg-gray-400 cursor-not-allowed opacity-70"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
            >
                {planLoading ? (
                    <span className="flex items-center justify-center gap-2">
                        <img src={loaderGif} alt="Loading" className="w-5 h-5" />
                        Loading...
                    </span>
                ) : (
                    "🚀 Test API"
                )}
            </button>

            {servicePlan && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-300">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-semibold text-gray-700">Response:</span>
                        {servicePlan.error ? (
                            <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">
                                Error
                            </span>
                        ) : (
                            <span className="px-2.5 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                                Success
                            </span>
                        )}
                    </div>
                    <pre className="bg-white p-3 rounded-md text-xs leading-relaxed overflow-auto max-h-96 border border-gray-200 font-mono">
                        {JSON.stringify(servicePlan, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};
