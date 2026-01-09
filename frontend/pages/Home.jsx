import React, { useState } from "react";
import { useParams } from 'react-router-dom';
import "./style/home.css";
import loaderGif from "../public/assets/loader.gif";
import axios from "axios";
import urlJoin from "url-join";

const EXAMPLE_MAIN_URL = window.location.origin;

export const Home = () => {
  const { company_id } = useParams();
  const [courierSchemes, setCourierSchemes] = useState(null);
  const [schemesLoading, setSchemesLoading] = useState(false);
  const [servicePlan, setServicePlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);

  const fetchCourierPartnerSchemes = async () => {
    setSchemesLoading(true);
    setCourierSchemes(null);
    try {
      const { data } = await axios.get(urlJoin(EXAMPLE_MAIN_URL, '/apibasic/test_basic_route'));
      setCourierSchemes(data);
      console.log("Courier Partner Schemes:", data);
    } catch (e) {
      console.error("Error fetching courier partner schemes:", e);
      setCourierSchemes({ error: e.message });
    } finally {
      setSchemesLoading(false);
    }
  };

  const fetchServicePlan = async () => {
    setPlanLoading(true);
    setServicePlan(null);
    try {
      const { data } = await axios.post(urlJoin(EXAMPLE_MAIN_URL, '/api/checkout/getServicePlan'));
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
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>🚚 Logistics Extension Dashboard</h1>
        <p style={styles.subtitle}>Test and manage your logistics APIs</p>
      </div>

      {/* Configuration Button */}
      <div style={styles.configSection}>
        <a href={`/company/${company_id}/configuration`} style={styles.configButton}>
          📝 Manage Configuration
        </a>
      </div>

      {/* API Cards Grid */}
      <div style={styles.grid}>
        {/* Courier Partner Schemes API Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Courier Partner Schemes</h3>
            <span style={styles.badge}>GET</span>
          </div>

          <p style={styles.endpoint}>/apibasic/test_basic_route</p>
          <p style={styles.description}>
            Fetch courier partner schemes using the Partner API
          </p>

          <button
            onClick={fetchCourierPartnerSchemes}
            disabled={schemesLoading}
            style={{
              ...styles.button,
              ...(schemesLoading ? styles.buttonDisabled : {}),
            }}
          >
            {schemesLoading ? (
              <span style={styles.buttonContent}>
                <img src={loaderGif} alt="Loading" style={styles.buttonLoader} />
                Loading...
              </span>
            ) : (
              "🚀 Test API"
            )}
          </button>

          {courierSchemes && (
            <div style={styles.responseBox}>
              <div style={styles.responseHeader}>
                <span style={styles.responseTitle}>Response:</span>
                {courierSchemes.error && (
                  <span style={styles.errorBadge}>Error</span>
                )}
                {!courierSchemes.error && (
                  <span style={styles.successBadge}>Success</span>
                )}
              </div>
              <pre style={styles.codeBlock}>
                {JSON.stringify(courierSchemes, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Service Plan API Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Checkout Service Plan</h3>
            <span style={{ ...styles.badge, backgroundColor: "#28a745" }}>POST</span>
          </div>

          <p style={styles.endpoint}>/api/checkout/getServicePlan</p>
          <p style={styles.description}>
            Get service plan and rates for checkout from delivery partner
          </p>

          <button
            onClick={fetchServicePlan}
            disabled={planLoading}
            style={{
              ...styles.button,
              ...(planLoading ? styles.buttonDisabled : {}),
            }}
          >
            {planLoading ? (
              <span style={styles.buttonContent}>
                <img src={loaderGif} alt="Loading" style={styles.buttonLoader} />
                Loading...
              </span>
            ) : (
              "🚀 Test API"
            )}
          </button>

          {servicePlan && (
            <div style={styles.responseBox}>
              <div style={styles.responseHeader}>
                <span style={styles.responseTitle}>Response:</span>
                {servicePlan.error && (
                  <span style={styles.errorBadge}>Error</span>
                )}
                {!servicePlan.error && (
                  <span style={styles.successBadge}>Success</span>
                )}
              </div>
              <pre style={styles.codeBlock}>
                {JSON.stringify(servicePlan, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div style={styles.infoBox}>
        <h4 style={styles.infoTitle}>ℹ️ How to Use</h4>
        <ul style={styles.infoList}>
          <li>Click <strong>Manage Configuration</strong> to set up your delivery partner credentials</li>
          <li>Click <strong>Test API</strong> buttons above to test each endpoint</li>
          <li>Responses will appear below each card</li>
          <li>Check browser console for detailed logs</li>
        </ul>
      </div>
    </div>
  );
};

// Styles
const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "30px 20px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  header: {
    textAlign: "center",
    marginBottom: "40px",
  },
  title: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#1a1a1a",
    margin: "0 0 10px 0",
  },
  subtitle: {
    fontSize: "16px",
    color: "#666",
    margin: 0,
  },
  configSection: {
    textAlign: "center",
    marginBottom: "40px",
  },
  configButton: {
    display: "inline-block",
    padding: "12px 30px",
    backgroundColor: "#2874f0",
    color: "white",
    textDecoration: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    boxShadow: "0 2px 8px rgba(40, 116, 240, 0.3)",
    transition: "all 0.3s ease",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
    gap: "30px",
    marginBottom: "40px",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
    border: "1px solid #e0e0e0",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  cardTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1a1a1a",
    margin: 0,
  },
  badge: {
    padding: "4px 12px",
    backgroundColor: "#2874f0",
    color: "white",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "600",
  },
  endpoint: {
    fontSize: "14px",
    color: "#0066cc",
    fontFamily: "monospace",
    backgroundColor: "#f5f7fa",
    padding: "8px 12px",
    borderRadius: "6px",
    marginBottom: "12px",
    wordBreak: "break-all",
  },
  description: {
    fontSize: "14px",
    color: "#666",
    lineHeight: "1.6",
    marginBottom: "20px",
  },
  button: {
    width: "100%",
    padding: "12px 20px",
    backgroundColor: "#2874f0",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    marginBottom: "20px",
  },
  buttonDisabled: {
    backgroundColor: "#b0b0b0",
    cursor: "not-allowed",
    opacity: 0.7,
  },
  buttonContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  buttonLoader: {
    width: "20px",
    height: "20px",
  },
  responseBox: {
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
    padding: "16px",
    border: "1px solid #dee2e6",
  },
  responseHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  responseTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#495057",
  },
  successBadge: {
    padding: "4px 10px",
    backgroundColor: "#d4edda",
    color: "#155724",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "600",
  },
  errorBadge: {
    padding: "4px 10px",
    backgroundColor: "#f8d7da",
    color: "#721c24",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "600",
  },
  codeBlock: {
    backgroundColor: "#fff",
    padding: "12px",
    borderRadius: "6px",
    fontSize: "12px",
    lineHeight: "1.5",
    overflow: "auto",
    maxHeight: "400px",
    margin: 0,
    border: "1px solid #e9ecef",
    fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace",
  },
  infoBox: {
    backgroundColor: "#e7f3ff",
    borderLeft: "4px solid #2874f0",
    borderRadius: "8px",
    padding: "20px",
  },
  infoTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1a1a1a",
    marginTop: 0,
    marginBottom: "12px",
  },
  infoList: {
    fontSize: "14px",
    color: "#495057",
    lineHeight: "1.8",
    margin: 0,
    paddingLeft: "20px",
  },
};
