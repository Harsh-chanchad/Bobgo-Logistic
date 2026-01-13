import React from "react";
import { useParams } from "react-router-dom";
import { ServicePlans } from "../components/ServicePlans";
import { CourierSchemesAPI } from "../components/CourierSchemesAPI";
import { CheckoutServicePlanAPI } from "../components/CheckoutServicePlanAPI";
import { CreateSchemeAPI } from "../components/CreateSchemeAPI";

export const Home = () => {
  const { company_id } = useParams();

  return (
    <div className="max-w-[1440px] px-[30px] py-[24px] bg-[#f8f8f8]">

      {/* Service Plans Section */}
      <ServicePlans />


      {/* API Cards Grid */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
        <CourierSchemesAPI />
        <CheckoutServicePlanAPI />
      </div> */}

    </div>
  );
};
