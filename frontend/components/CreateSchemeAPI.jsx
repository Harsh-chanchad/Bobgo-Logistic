import React, { useState } from "react";
import axios from "axios";
import urlJoin from "url-join";
import loaderGif from "../public/assets/loader.gif";

const EXAMPLE_MAIN_URL = window.location.origin;

export const CreateSchemeAPI = () => {
    const [createSchemeResponse, setCreateSchemeResponse] = useState(null);
    const [createSchemeLoading, setCreateSchemeLoading] = useState(false);

    const createServiceScheme = async () => {
        setCreateSchemeLoading(true);
        setCreateSchemeResponse(null);
        try {
            const { data } = await axios.post(
                urlJoin(EXAMPLE_MAIN_URL, "/apibasic/scheme")
            );
            setCreateSchemeResponse(data);
            console.log("✅ Service Scheme Created:", data);
        } catch (e) {
            console.error("❌ Error creating service scheme:", e);
            setCreateSchemeResponse({
                error: e.response?.data?.message || e.message,
            });
        } finally {
            setCreateSchemeLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 transition-all hover:shadow-lg">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-semibold text-gray-900">
                    Create Service Scheme
                </h3>
                <span className="px-3 py-1 bg-green-600 text-white rounded text-xs font-semibold">
                    POST
                </span>
            </div>

            <p className="text-sm text-blue-600 font-mono bg-gray-50 px-3 py-2 rounded-md mb-3 break-all">
                /apibasic/scheme
            </p>
            <p className="text-sm text-gray-600 leading-relaxed mb-5">
                Create a new courier partner scheme/service plan programmatically
            </p>

            <button
                onClick={createServiceScheme}
                disabled={createSchemeLoading}
                className={`w-full py-3 px-5 rounded-lg text-base font-semibold transition-all mb-5 ${createSchemeLoading
                    ? "bg-gray-400 cursor-not-allowed opacity-70"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
            >
                {createSchemeLoading ? (
                    <span className="flex items-center justify-center gap-2">
                        <img src={loaderGif} alt="Loading" className="w-5 h-5" />
                        Creating...
                    </span>
                ) : (
                    "✨ Create Scheme"
                )}
            </button>

            {createSchemeResponse && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-300">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-semibold text-gray-700">Response:</span>
                        {createSchemeResponse.error ? (
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
                        {JSON.stringify(createSchemeResponse, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};
