import React, { useState, useEffect } from "react";
import { useParams } from 'react-router-dom';
import "./style/home.css";
import greenDot from "../public/assets/green-dot.svg";
import grayDot from "../public/assets/grey-dot.svg";
import DEFAULT_NO_IMAGE from "../public/assets/default_icon_listing.png";
import loaderGif from "../public/assets/loader.gif";
import axios from "axios";
import urlJoin from "url-join";

const EXAMPLE_MAIN_URL = window.location.origin;

export const Home = () => {
  const [pageLoading, setPageLoading] = useState(false);
  const [productList, setProductList] = useState([]);
  const [courierSchemes, setCourierSchemes] = useState(null);
  const [schemesLoading, setSchemesLoading] = useState(false);
  const [servicePlan, setServicePlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const DOC_URL_PATH = "/help/docs/sdk/latest/platform/company/catalog/#getProducts";
  const DOC_APP_URL_PATH = "/help/docs/sdk/latest/platform/application/catalog#getAppProducts";
  const { application_id, company_id } = useParams();
  const documentationUrl = 'https://api.fynd.com'

  useEffect(() => {
    isApplicationLaunch() ? fetchApplicationProducts() : fetchProducts();
    fetchCourierPartnerSchemes();
  }, [application_id]);

  const fetchProducts = async () => {
    setPageLoading(true);
    try {
      const { data } = await axios.get(urlJoin(EXAMPLE_MAIN_URL, '/api/products'), {
        headers: {
          "x-company-id": company_id,
        }
      });
      setProductList(data.items);
    } catch (e) {
      console.error("Error fetching products:", e);
    } finally {
      setPageLoading(false);
    }
  };

  const fetchApplicationProducts = async () => {
    setPageLoading(true);
    try {
      const { data } = await axios.get(urlJoin(EXAMPLE_MAIN_URL, `/api/products/application/${application_id}`), {
        headers: {
          "x-company-id": company_id,
        }
      })
      setProductList(data.items);
    } catch (e) {
      console.error("Error fetching application products:", e);
    } finally {
      setPageLoading(false);
    }
  };

  const fetchCourierPartnerSchemes = async () => {
    setSchemesLoading(true);
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


  const productProfileImage = (media) => {
    if (!media || !media.length) {
      return DEFAULT_NO_IMAGE;
    }
    const profileImg = media.find(m => m.type === "image");
    return profileImg?.url || DEFAULT_NO_IMAGE;
  };

  const getDocumentPageLink = () => {
    return documentationUrl
      .replace("api", "partners")
      .concat(isApplicationLaunch() ? DOC_APP_URL_PATH : DOC_URL_PATH);
  };

  const isApplicationLaunch = () => !!application_id;

  return (
    <>
      {pageLoading ? (
        <div className="loader" data-testid="loader">
          <img src={loaderGif} alt="loader GIF" />
        </div>
      ) : (
        <div className="products-container">
          <div className="title">
            This is an example extension home page user interface.
          </div>

          <div className="section">
            <div className="heading">
              <span>Example {isApplicationLaunch() ? 'Application API' : 'Platform API'}</span> :
              <a href={getDocumentPageLink()} target="_blank" rel="noopener noreferrer">
                {isApplicationLaunch() ? 'getAppProducts' : 'getProducts'}
              </a>
            </div>
            <div className="description">
              This is an illustrative Platform API call to fetch the list of products
              in this company. Check your extension folder's 'server.js'
              file to know how to call Platform API and start calling API you
              require.
            </div>
          </div>

          <div className="section">
            <div className="heading">
              <span>Courier Partner Schemes API</span> :
              <span> /apibasic/test_basic_route</span>
            </div>
            <div className="description">
              This fetches courier partner schemes using the Partner API.
            </div>
            {schemesLoading ? (
              <div className="loader" style={{ marginTop: '10px' }}>
                <img src={loaderGif} alt="loader GIF" style={{ width: '30px', height: '30px' }} />
              </div>
            ) : (
              <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <pre style={{ margin: 0, fontSize: '12px', overflow: 'auto' }}>
                  {courierSchemes ? JSON.stringify(courierSchemes, null, 2) : 'No data available'}
                </pre>
              </div>
            )}
          </div>

          <div className="section">
            <div className="heading">
              <span>Checkout Service Plan API</span> :
              <span> POST /api/checkout/getServicePlan</span>
            </div>
            <div className="description">
              This endpoint returns service plan information. Click the button below to test it.
            </div>
            <button
              onClick={fetchServicePlan}
              disabled={planLoading}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                backgroundColor: '#2874f0',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: planLoading ? 'not-allowed' : 'pointer',
                opacity: planLoading ? 0.6 : 1
              }}
            >
              {planLoading ? 'Loading...' : 'Test Service Plan API'}
            </button>
            {planLoading ? (
              <div className="loader" style={{ marginTop: '10px' }}>
                <img src={loaderGif} alt="loader GIF" style={{ width: '30px', height: '30px' }} />
              </div>
            ) : servicePlan ? (
              <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <pre style={{ margin: 0, fontSize: '12px', overflow: 'auto' }}>
                  {JSON.stringify(servicePlan, null, 2)}
                </pre>
              </div>
            ) : null}
          </div>

          <div>
            {productList.map((product, index) => (
              <div className="product-list-container flex-row" key={`product-${product.name}-${index}`}>
                <img className="mr-r-12" src={product.is_active ? greenDot : grayDot} alt="status" />
                <div className="card-avatar mr-r-12">
                  <img src={productProfileImage(product.media)} alt={product.name} />
                </div>
                <div className="flex-column">
                  <div className="flex-row">
                    <div className="product-name" data-testid={`product-name-${product.id}`}>
                      {product.name}
                    </div>
                    <div className="product-item-code">|</div>
                    {product.item_code && (
                      <span className="product-item-code">
                        Item Code:
                        <span className="cl-RoyalBlue" data-testid={`product-item-code-${product.id}`}>
                          {product.item_code}
                        </span>
                      </span>
                    )}
                  </div>
                  {product.brand && (
                    <div className="product-brand-name" data-testid={`product-brand-name-${product.id}`}>
                      {product.brand.name}
                    </div>
                  )}
                  {product.category_slug && (
                    <div className="product-category" data-testid={`product-category-slug-${product.id}`}>
                      Category: <span>{product.category_slug}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
