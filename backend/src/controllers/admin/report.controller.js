import * as reportService from '../../services/report.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

/**
 * Get revenue analytics report
 */
export const getRevenue = async (req, res) => {
  try {
    const { range } = req.query; // '7d', '30d', '1y'
    const report = await reportService.getRevenueReport(range);
    return sendSuccess(res, report, "Revenue report retrieved successfully");
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**
 * Get service usage analytics report
 */
export const getServiceUsage = async (req, res) => {
  try {
    const report = await reportService.getServiceUsageReport();
    return sendSuccess(res, report, "Service usage report retrieved successfully");
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**
 * Get fleet monitoring analytics report
 */
export const getFleet = async (req, res) => {
  try {
    const report = await reportService.getFleetReport();
    return sendSuccess(res, report, "Fleet report retrieved successfully");
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**
 * Get farmer growth analytics report
 */
export const getFarmers = async (req, res) => {
  try {
    const report = await reportService.getFarmerGrowthReport();
    return sendSuccess(res, report, "Farmer growth report retrieved successfully");
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};
