import React, { useState } from "react";
import axios from "axios";
import urlJoin from "url-join";
import loaderGif from "../public/assets/loader.gif";

const EXAMPLE_MAIN_URL = window.location.origin;

export const CourierSchemesAPI = () => {
    const [courierSchemes, setCourierSchemes] = useState(null);
    const [schemesLoading, setSchemesLoading] = useState(false);

    const fetchCourierPartnerSchemes = async () => {
        setSchemesLoading(true);
        setCourierSchemes(null);
        try {
            const { data } = await axios.get(
                urlJoin(EXAMPLE_MAIN_URL, "/apibasic/test_basic_route")
            );
            setCourierSchemes(data);
            console.log("Courier Partner Schemes:", data);
        } catch (e) {
            console.error("Error fetching courier partner schemes:", e);
            setCourierSchemes({ error: e.message });
        } finally {
            setSchemesLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 transition-all hover:shadow-lg">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-semibold text-gray-900">
                    Courier Partner Schemes
                </h3>
                <span className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-semibold">
                    GET
                </span>
            </div>

            <p className="text-sm text-blue-600 font-mono bg-gray-50 px-3 py-2 rounded-md mb-3 break-all">
                /apibasic/test_basic_route
            </p>
            <p className="text-sm text-gray-600 leading-relaxed mb-5">
                Fetch courier partner schemes using the Partner API
            </p>

            <button
                onClick={fetchCourierPartnerSchemes}
                disabled={schemesLoading}
                className={`w-full py-3 px-5 rounded-lg text-base font-semibold transition-all mb-5 ${schemesLoading
                    ? "bg-gray-400 cursor-not-allowed opacity-70"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
            >
                {schemesLoading ? (
                    <span className="flex items-center justify-center gap-2">
                        <img src={loaderGif} alt="Loading" className="w-5 h-5" />
                        Loading...
                    </span>
                ) : (
                    "🚀 Test API"
                )}
            </button>

            {courierSchemes && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-300">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-semibold text-gray-700">Response:</span>
                        {courierSchemes.error ? (
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
                        {JSON.stringify(courierSchemes, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};
