async function handleShipmentUpdateEvent(
  eventName,
  payload,
  companyId,
  applicationId
) {
  try {
    // Extract shipment data from payload structure
    // FDK payload structure: { payload: { shipment: {...} }, company_id, application_id, ... }
    console.log("shipment update event received");
    const shipment = payload?.payload?.shipment || payload?.shipment;
    const shipmentId = shipment?.shipment_id || shipment?.id;
    const orderId = shipment?.order_id || payload?.order_id;
    const actualCompanyId = payload?.company_id || companyId;
    const actualApplicationId = payload?.application_id || applicationId;

    logger.info("Fynd shipment updated webhook received", {
      eventName,
      shipmentId,
      orderId,
      applicationId: actualApplicationId,
      companyId: actualCompanyId,
      shipmentStatus: shipment?.status || shipment?.shipment_status?.status,
      timestamp: new Date().toISOString(),
    });

    // Check if this is a dp_assigned status update
    const shipmentStatus =
      shipment?.shipment_status?.status || shipment?.status;
    console.log("shipmentStatus", shipmentStatus);

    // Sync shipmentStatus to fynd_status field if order exists in shipment collection
    if (
      shipmentStatus &&
      orderId &&
      forwardShipmentStatus.includes(shipmentStatus)
    ) {
      try {
        const updatedShipment = await shipments.findOneAndUpdate(
          { fynd_order_id: orderId },
          { $set: { fynd_status: shipmentStatus } },
          { new: true }
        );

        if (updatedShipment) {
          logger.info("Successfully synced shipmentStatus to fynd_status", {
            fyndOrderId: orderId,
            shipmentStatus,
            mongoShipmentId: updatedShipment._id,
            shop: updatedShipment.shop,
          });
        } else {
          logger.debug(
            "Shipment not found in database for fynd_status update",
            {
              fyndOrderId: orderId,
              shipmentStatus,
              message: "No shipment found with this fynd_order_id",
            }
          );
        }
      } catch (statusSyncError) {
        logger.error("Error syncing shipmentStatus to fynd_status", {
          fyndOrderId: orderId,
          shipmentStatus,
          error: statusSyncError.message,
          stack: statusSyncError.stack,
        });
        // Don't throw - continue processing webhook
      }
    }

    // store shipment id in database
    if (
      (shipmentStatus === "bag_confirmed" ||
        shipmentStatus === "dp_assigned") &&
      shipmentId
    ) {
      await shipments.findOneAndUpdate(
        { fynd_order_id: orderId },
        { $set: { fynd_shipment_id: shipmentId } }
      );
      logger.info("Fynd shipment ID stored", {
        shipmentId,
        orderId,
      });
    }

    // if(shipmentStatus === 'bag_packed') {
    //   try {
    //     const payloadFilePath = path.join(__dirname, 'payloads', 'shipment-update.json');

    //     // Read existing file or initialize as empty array
    //     let payloadArray = [];
    //     if (fs.existsSync(payloadFilePath)) {
    //       const fileContent = fs.readFileSync(payloadFilePath, 'utf8');
    //       try {
    //         payloadArray = JSON.parse(fileContent);
    //         if (!Array.isArray(payloadArray)) {
    //           payloadArray = [];
    //         }
    //       } catch (parseError) {
    //         logger.warn('Error parsing shipment-update.json, initializing as empty array', {
    //           error: parseError.message
    //         });
    //         payloadArray = [];
    //       }
    //     }

    //     // Use the payload as-is, or construct it if needed
    //     // The payload should already have the structure: { event, company_id, application_id, contains, payload }
    //     const payloadEntry = payload?.event ? payload : {
    //       event: {
    //         trace_id: [Date.now().toString()],
    //         name: eventName || 'shipment',
    //         type: 'update',
    //         version: '1',
    //         created_timestamp: Date.now(),
    //         id: `bag_packed_${Date.now()}`,
    //         category: 'application',
    //         referer: 'uat.fyndx1.de'
    //       },
    //       company_id: actualCompanyId,
    //       application_id: actualApplicationId,
    //       contains: ['shipment'],
    //       payload: {
    //         shipment: shipment
    //       }
    //     };

    //     // Append the new payload to the array
    //     payloadArray.push(payloadEntry);

    //     // Write back to file
    //     fs.writeFileSync(payloadFilePath, JSON.stringify(payloadArray, null, 2), 'utf8');

    //     logger.info('Appended bag_packed payload to shipment-update.json', {
    //       shipmentId,
    //       fyndOrderId: orderId,
    //       companyId: actualCompanyId,
    //       totalPayloads: payloadArray.length
    //     });
    //   } catch (fileError) {
    //     logger.error('Error writing payload to shipment-update.json', {
    //       shipmentId,
    //       fyndOrderId: orderId,
    //       error: fileError.message,
    //       stack: fileError.stack
    //     });
    //     // Don't throw - continue processing webhook
    //   }
    // }

    if (shipmentStatus === "bag_confirmed") {
      logger.info(
        "Processing bag_confirmed status - updating shipment invoice id",
        {
          shipmentId,
          fyndOrderId: orderId,
          companyId: actualCompanyId,
          applicationId: actualApplicationId,
        }
      );

      try {
        // Find shipment in database by fynd_order_id and fynd_shipment_id
        const dbShipment = await shipments.findOne({
          fynd_order_id: orderId,
        });

        if (!dbShipment) {
          logger.warn("Shipment not found in database for invoice ID update", {
            fyndShipmentId: shipmentId,
            fyndOrderId: orderId,
            message:
              "No shipment found with this fynd_order_id and fynd_shipment_id. Make sure the shipment was created during fulfillment.",
          });
        } else {
          // Get invoice ID: use fulfillment_id if available, otherwise use fulfillment_order_id
          const invoiceId =
            dbShipment.fulfillment_id || dbShipment.fulfillment_order_id;

          if (!invoiceId) {
            logger.warn(
              "No fulfillment_id or fulfillment_order_id found for invoice ID update",
              {
                fyndShipmentId: shipmentId,
                fyndOrderId: orderId,
                mongoShipmentId: dbShipment._id,
                shop: dbShipment.shop,
              }
            );
          } else {
            // Update invoice ID on Fynd platform
            const updateResult = await updateShipmentInvoiceId(
              shipmentId,
              actualCompanyId,
              invoiceId,
              "bag_invoiced"
            );

            if (updateResult.success) {
              logger.info(
                "Successfully updated shipment invoice ID on Fynd platform",
                {
                  fyndShipmentId: shipmentId,
                  fyndOrderId: orderId,
                  mongoShipmentId: dbShipment._id,
                  shop: dbShipment.shop,
                  invoiceId,
                  usedFulfillmentId: !!dbShipment.fulfillment_id,
                }
              );
            } else {
              logger.error(
                "Failed to update shipment invoice ID on Fynd platform",
                {
                  fyndShipmentId: shipmentId,
                  fyndOrderId: orderId,
                  mongoShipmentId: dbShipment._id,
                  shop: dbShipment.shop,
                  invoiceId,
                  error: updateResult.error,
                }
              );
            }
          }
        }
      } catch (invoiceError) {
        logger.error(
          "Error processing bag_confirmed status update for invoice ID",
          {
            fyndShipmentId: shipmentId,
            fyndOrderId: orderId,
            error: invoiceError.message,
            stack: invoiceError.stack,
          }
        );
        // Don't throw - continue processing webhook
      }
    } else if (shipmentStatus === "dp_assigned") {
      logger.info(
        "Processing dp_assigned status - updating delivery partner details",
        {
          shipmentId,
          fyndOrderId: orderId,
          companyId: actualCompanyId,
          applicationId: actualApplicationId,
        }
      );

      try {
        // Extract delivery partner details
        const dpDetails =
          shipment?.dp_details || shipment?.delivery_partner_details;

        if (!dpDetails) {
          logger.warn("No dp_details found in dp_assigned shipment update", {
            shipmentId,
            fyndOrderId: orderId,
          });
        } else {
          // If track_url is null, try to get it from bags[0].meta.tracking_url
          if (
            !dpDetails.track_url &&
            shipment?.bags &&
            Array.isArray(shipment.bags) &&
            shipment.bags.length > 0
          ) {
            const trackingUrlFromBag = shipment.bags[0]?.meta?.tracking_url;
            if (trackingUrlFromBag) {
              dpDetails.track_url = trackingUrlFromBag;
              logger.info(
                "Using tracking_url from bags[0].meta.tracking_url as fallback",
                {
                  shipmentId,
                  fyndOrderId: orderId,
                  trackingUrl: trackingUrlFromBag,
                }
              );
            }
          }
          // Store dp_details in our shipment collection using fynd_order_id
          const updatedShipment = await updateDeliveryPartnerDetails(
            orderId,
            dpDetails
          );

          if (updatedShipment) {
            logger.info(
              "Successfully stored dp_details in shipment collection",
              {
                fyndShipmentId: shipmentId,
                fyndOrderId: orderId,
                mongoShipmentId: updatedShipment._id,
                shop: updatedShipment.shop,
                hasTrackUrl: !!dpDetails.track_url,
                hasAwbNo: !!dpDetails.awb_no,
                courierPartner:
                  dpDetails.name || dpDetails.courier_partner_slug,
              }
            );

            // Update Shopify fulfillment with tracking information if fulfillment exists
            if (
              updatedShipment.fulfillment_id &&
              (dpDetails.track_url || dpDetails.awb_no)
            ) {
              try {
                // Get shop details to retrieve access token
                const shop = await stores.findOne({
                  shop: updatedShipment.shop,
                });

                if (!shop || !shop.shopifyToken) {
                  logger.error(
                    "Shop details or access token not found for Shopify tracking update",
                    {
                      shop: updatedShipment.shop,
                      fulfillmentId: updatedShipment.fulfillment_id,
                    }
                  );
                } else {
                  // Prepare tracking info for Shopify
                  const trackingInfo = {
                    company:
                      dpDetails.name ||
                      dpDetails.courier_partner_slug ||
                      "fynd-logistics",
                    number:
                      `fynd-${orderId}-${dpDetails.awb_no}` ||
                      `fynd-${orderId}`,
                    url: dpDetails.track_url || null,
                  };

                  // Update Shopify fulfillment tracking
                  const shopifyResult = await updateFulfillmentTracking(
                    updatedShipment.shop,
                    shop.shopifyToken,
                    updatedShipment.fulfillment_id,
                    trackingInfo
                  );

                  if (
                    shopifyResult?.fulfillmentTrackingInfoUpdateV2?.userErrors
                      ?.length > 0
                  ) {
                    logger.error(
                      "Failed to update Shopify fulfillment tracking",
                      {
                        shipmentId,
                        fulfillmentId: updatedShipment.fulfillment_id,
                        errors:
                          shopifyResult.fulfillmentTrackingInfoUpdateV2
                            .userErrors,
                      }
                    );
                  } else {
                    logger.info(
                      "Successfully updated Shopify fulfillment tracking",
                      {
                        shipmentId,
                        fulfillmentId: updatedShipment.fulfillment_id,
                        trackingNumber: trackingInfo.number,
                        trackingUrl: trackingInfo.url,
                        courierCompany: trackingInfo.company,
                      }
                    );
                  }
                }
              } catch (shopifyError) {
                logger.error("Error updating Shopify fulfillment tracking", {
                  shipmentId,
                  fulfillmentId: updatedShipment.fulfillment_id,
                  error: shopifyError.message,
                  stack: shopifyError.stack,
                });
                // Don't throw - we want to continue even if Shopify update fails
              }
            } else {
              logger.info(
                "Skipping Shopify tracking update - no fulfillment_id or tracking info",
                {
                  shipmentId,
                  hasFulfillmentId: !!updatedShipment.fulfillment_id,
                  hasTrackUrl: !!dpDetails.track_url,
                  hasAwbNo: !!dpDetails.awb_no,
                }
              );
            }
          } else {
            logger.warn(
              "Shipment not found in database for dp_details update",
              {
                fyndShipmentId: shipmentId,
                fyndOrderId: orderId,
                message:
                  "No shipment found with this fynd_order_id. Make sure the shipment was created during fulfillment.",
              }
            );
          }
        }
      } catch (dpError) {
        logger.error("Error processing dp_assigned status update", {
          fyndShipmentId: shipmentId,
          fyndOrderId: orderId,
          error: dpError.message,
          stack: dpError.stack,
        });
        // Don't throw - continue processing webhook
      }
    } else if (
      shipmentStatus === "return_dp_assigned" ||
      shipmentStatus === "return_bag_picked" ||
      shipmentStatus === "return_bag_delivered"
    ) {
      logger.info(
        "Processing return shipment status - updating delivery partner details for return",
        {
          shipmentId,
          shipmentStatus,
          fyndOrderId: orderId,
          companyId: actualCompanyId,
          applicationId: actualApplicationId,
        }
      );

      try {
        // Extract delivery partner details
        const dpDetails =
          shipment?.dp_details || shipment?.delivery_partner_details;

        if (!dpDetails) {
          logger.warn(
            "No dp_details found in return_dp_assigned shipment update",
            {
              shipmentId,
              fyndOrderId: orderId,
            }
          );
        } else {
          // Check if this is a return shipment by finding return record with matching fynd_return_shipment_id
          const returnRecord = await returns.findOne({
            fynd_return_shipment_id: shipmentId,
          });

          if (!returnRecord) {
            logger.warn(
              "Return record not found for return_dp_assigned shipment update",
              {
                shipmentId,
                fyndOrderId: orderId,
                message:
                  "No return found with this fynd_return_shipment_id. This might be a forward shipment or return was not properly tracked.",
              }
            );
          } else {
            // Store dp_details in our returns collection using fynd_return_shipment_id
            const updatedReturn = await updateReturnDeliveryPartnerDetails(
              shipmentId,
              dpDetails
            );

            if (updatedReturn) {
              logger.info(
                "Successfully stored dp_details in return collection",
                {
                  fyndReturnShipmentId: shipmentId,
                  returnId: updatedReturn._id,
                  shop: updatedReturn.shop,
                  hasTrackUrl: !!dpDetails.track_url,
                  hasAwbNo: !!dpDetails.awb_no,
                  courierPartner:
                    dpDetails.name || dpDetails.courier_partner_slug,
                }
              );

              // Update Shopify return with tracking information if return exists and tracking info is available
              if (
                (updatedReturn.shopify_return_id ||
                  updatedReturn.shopify_return_gid) &&
                (dpDetails.track_url || dpDetails.awb_no)
              ) {
                try {
                  // Get shop details to retrieve access token
                  const shop = await stores.findOne({
                    shop: updatedReturn.shop,
                  });

                  if (!shop || !shop.shopifyToken) {
                    logger.error(
                      "Shop details or access token not found for Shopify return tracking update",
                      {
                        shop: updatedReturn.shop,
                        returnId: updatedReturn._id,
                        shopifyReturnId: updatedReturn.shopify_return_id,
                        shopifyReturnGid: updatedReturn.shopify_return_gid,
                      }
                    );
                  } else {
                    // Prepare tracking info for Shopify
                    const trackingInfo = {
                      company:
                        dpDetails.name ||
                        dpDetails.courier_partner_slug ||
                        "fynd-logistics",
                      number: dpDetails.awb_no
                        ? `fynd-${orderId}-${dpDetails.awb_no}`
                        : `fynd-${orderId}`,
                      url: dpDetails.track_url || null,
                    };

                    // Use shopify_return_gid if available, otherwise construct from shopify_return_id
                    const returnId =
                      updatedReturn.shopify_return_gid ||
                      `gid://shopify/Return/${updatedReturn.shopify_return_id}`;

                    // Update Shopify return tracking
                    const shopifyResult = await updateReturnTracking(
                      updatedReturn.shop,
                      shop.shopifyToken,
                      returnId,
                      trackingInfo
                    );

                    if (!shopifyResult.success) {
                      logger.error("Failed to update Shopify return tracking", {
                        fyndReturnShipmentId: shipmentId,
                        returnId: updatedReturn._id,
                        shopifyReturnId: returnId,
                        error: shopifyResult.error,
                        errors: shopifyResult.errors,
                      });
                    } else {
                      logger.info(
                        "Successfully updated Shopify return tracking",
                        {
                          fyndReturnShipmentId: shipmentId,
                          returnId: updatedReturn._id,
                          shopifyReturnId: returnId,
                          trackingNumber: trackingInfo.number,
                          trackingUrl: trackingInfo.url,
                          courierCompany: trackingInfo.company,
                        }
                      );
                    }
                  }
                } catch (shopifyError) {
                  logger.error("Error updating Shopify return tracking", {
                    fyndReturnShipmentId: shipmentId,
                    returnId: updatedReturn._id,
                    error: shopifyError.message,
                    stack: shopifyError.stack,
                  });
                  // Don't throw - we want to continue even if Shopify update fails
                }
              } else {
                logger.info(
                  "Skipping Shopify return tracking update - no shopify_return_id/gid or tracking info",
                  {
                    fyndReturnShipmentId: shipmentId,
                    returnId: updatedReturn._id,
                    hasShopifyReturnId: !!updatedReturn.shopify_return_id,
                    hasShopifyReturnGid: !!updatedReturn.shopify_return_gid,
                    hasTrackUrl: !!dpDetails.track_url,
                    hasAwbNo: !!dpDetails.awb_no,
                  }
                );
              }
            } else {
              logger.warn("Failed to update return with dp_details", {
                fyndReturnShipmentId: shipmentId,
                returnId: returnRecord._id,
              });
            }
          }
        }
      } catch (returnDpError) {
        logger.error("Error processing return_dp_assigned status update", {
          fyndReturnShipmentId: shipmentId,
          fyndOrderId: orderId,
          error: returnDpError.message,
          stack: returnDpError.stack,
        });
        // Don't throw - continue processing webhook
      }
    }

    // invoice and shipping label urls
    // Check if pdf_media exists in affiliate_details.shipment_meta
    const affiliateDetails = shipment?.affiliate_details;
    const pdfMediaArray = affiliateDetails?.shipment_meta?.pdf_media;

    if (
      pdfMediaArray &&
      Array.isArray(pdfMediaArray) &&
      pdfMediaArray.length > 0 &&
      shipmentStatus === "return_dp_assigned"
    ) {
      logger.info("Processing pdf_media for return shipment", {
        shipmentId,
        fyndOrderId: orderId,
        companyId: actualCompanyId,
        applicationId: actualApplicationId,
        pdfMediaCount: pdfMediaArray.length,
      });

      try {
        const updatedReturn = await updateReturnPdfMedia(
          shipmentId,
          pdfMediaArray
        );

        if (updatedReturn) {
          logger.info("Successfully updated pdf_media in return collection", {
            fyndReturnShipmentId: shipmentId,
            returnId: updatedReturn._id,
            shop: updatedReturn.shop,
            mediaTypes: Object.keys(updatedReturn.pdf_media || {}),
            mediaCount: Object.keys(updatedReturn.pdf_media || {}).length,
          });
        } else {
          logger.warn("Return not found in database for pdf_media update", {
            fyndReturnShipmentId: shipmentId,
            fyndOrderId: orderId,
            message: "No return found with this fynd_return_shipment_id.",
          });
        }
      } catch (pdfMediaError) {
        logger.error("Error processing pdf_media update for return", {
          fyndReturnShipmentId: shipmentId,
          fyndOrderId: orderId,
          error: pdfMediaError.message,
          stack: pdfMediaError.stack,
        });
        // Don't throw - continue processing webhook
      }
    } else if (
      pdfMediaArray &&
      Array.isArray(pdfMediaArray) &&
      pdfMediaArray.length > 0 &&
      !shipmentStatus.includes("return")
    ) {
      logger.info("Processing pdf_media from shipment update", {
        shipmentId,
        fyndOrderId: orderId,
        companyId: actualCompanyId,
        applicationId: actualApplicationId,
        pdfMediaCount: pdfMediaArray.length,
      });

      try {
        const updatedShipment = await updatePdfMedia(orderId, pdfMediaArray);

        if (updatedShipment) {
          logger.info("Successfully updated pdf_media in shipment collection", {
            fyndShipmentId: shipmentId,
            fyndOrderId: orderId,
            mongoShipmentId: updatedShipment._id,
            shop: updatedShipment.shop,
            mediaTypes: Object.keys(updatedShipment.pdf_media || {}),
            mediaCount: Object.keys(updatedShipment.pdf_media || {}).length,
          });
        } else {
          logger.warn("Shipment not found in database for pdf_media update", {
            fyndShipmentId: shipmentId,
            fyndOrderId: orderId,
            message:
              "No shipment found with this fynd_order_id. Make sure the shipment was created during fulfillment.",
          });
        }
      } catch (pdfMediaError) {
        logger.error("Error processing pdf_media update", {
          fyndShipmentId: shipmentId,
          fyndOrderId: orderId,
          error: pdfMediaError.message,
          stack: pdfMediaError.stack,
        });
        // Don't throw - continue processing webhook
      }
    } else {
      logger.debug("No pdf_media found in affiliate_details.shipment_meta", {
        shipmentId,
        fyndOrderId: orderId,
        hasAffiliateDetails: !!affiliateDetails,
        hasShipmentMeta: !!affiliateDetails?.shipment_meta,
        hasPdfMedia: !!pdfMediaArray,
      });
    }

    return { success: true, message: "Shipment update event processed" };
  } catch (error) {
    logger.error("Error handling shipment update event", {
      error: error.message,
      stack: error.stack,
      eventName,
      companyId,
      applicationId,
    });
    throw error;
  }
}
