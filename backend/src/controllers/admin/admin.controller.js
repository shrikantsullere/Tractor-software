import * as adminService from '../../services/admin.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { updateFarmerStatusSchema } from '../../schema/farmer.schema.js';

/**
 * Get bookings for admin dashboard with pagination and filters.
 */
export const getBookings = async (req, res) => {
  try {
    const { page, limit, status, search } = req.query;
    const result = await adminService.getAllBookings({ page, limit, status, search });
    return sendSuccess(res, result, "Bookings retrieved successfully");
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**
 * Get specific booking details.
 */
export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await adminService.getBookingById(id);
    return sendSuccess(res, booking, "Booking details retrieved successfully");
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    return sendError(res, error.message, statusCode);
  }
};

/**
 * Get all payments and revenue stats.
 */
export const getPayments = async (req, res) => {
  try {
    const { page, limit, status, search } = req.query;
    const data = await adminService.getAllPayments({ page, limit, status, search });
    return sendSuccess(res, data, "Admin payment data retrieved successfully");
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**
 * Handle Admin Settlement.
 */
export const settleBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { method = 'cash' } = req.body;
    if (!bookingId) return sendError(res, "Booking ID is required", 400);

    const result = await adminService.settleBooking(bookingId, method);
    return sendSuccess(res, result, "Booking settled successfully");
  } catch (error) {
    const statusCode = error.message.includes('Already Paid') ? 400 : 
                       error.message.includes('not found') ? 404 : 500;
    return sendError(res, error.message, statusCode);
  }
};

/**
 * Get all farmers for management.
 */
export const getFarmers = async (req, res) => {
  try {
    const farmers = await adminService.getAllFarmers();
    return sendSuccess(res, farmers, "Farmers retrieved successfully");
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**
 * Update farmer account status.
 */
export const updateFarmerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = updateFarmerStatusSchema.parse(req.body);

    const result = await adminService.updateFarmerStatus(id, status);
    return sendSuccess(res, result, `Farmer status updated to ${status}`);
  } catch (error) {
    if (error.name === 'ZodError') {
      return sendError(res, error.errors[0].message, 400);
    }
    const statusCode = error.message.includes('not found') ? 404 : 500;
    return sendError(res, error.message, statusCode);
  }
};
/**
 * Get all operators for management.
 */
export const getOperators = async (req, res) => {
  try {
    const operators = await adminService.getAllOperators();
    return sendSuccess(res, operators, "Operators retrieved successfully");
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**
 * Create a new operator manually (Admin only).
 */
export const createOperator = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    
    if (!name || !email || !password) {
      return sendError(res, "Name, email, and password are required", 400);
    }

    const result = await adminService.createOperator({ name, email, password, phone });
    return sendSuccess(res, result, "Operator created successfully", 201);
  } catch (error) {
    const statusCode = error.message.includes('already exists') ? 400 : 500;
    return sendError(res, error.message, statusCode);
  }
};

/**
 * Delete an operator profile.
 */
export const deleteOperator = async (req, res) => {
  try {
    const { id } = req.params;
    await adminService.deleteOperator(id);
    return sendSuccess(res, null, "Operator deleted successfully");
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    return sendError(res, error.message, statusCode);
  }
};

/**
 * Tractor Management
 */

export const getTractors = async (req, res) => {
  try {
    const tractors = await adminService.getAllTractors();
    return sendSuccess(res, tractors, "Tractors retrieved successfully");
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const createTractor = async (req, res) => {
  try {
    const { name, model } = req.body;
    if (!name) return sendError(res, "Tractor name is required", 400);

    const result = await adminService.createTractor({ name, model });
    return sendSuccess(res, result, "Tractor created successfully", 201);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const updateTractor = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await adminService.updateTractor(id, req.body);
    return sendSuccess(res, result, "Tractor updated successfully");
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 
                       error.message.includes('maintenance') || error.message.includes('Invalid') ? 400 : 500;
    return sendError(res, error.message, statusCode);
  }
};
