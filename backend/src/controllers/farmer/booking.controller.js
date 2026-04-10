import * as BookingService from '../../services/booking.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { bookingCreateSchema, pricePreviewSchema } from '../../schema/booking.schema.js';

/**
 * Handle price preview request.
 */
export const getPricePreview = async (req, res) => {
  try {
    const validatedData = pricePreviewSchema.parse(req.body);
    const pricing = await BookingService.calculateBookingPrice(
      validatedData.serviceType,
      validatedData.landSize,
      validatedData.zoneId,
      validatedData.farmerLatitude,
      validatedData.farmerLongitude
    );
    return sendSuccess(res, {
      basePrice: pricing.basePrice,
      distanceKm: pricing.distanceKm,
      distanceCharge: pricing.distanceCharge,
      fuelSurcharge: pricing.fuelSurcharge,
      totalPrice: pricing.totalPrice,
      zoneName: pricing.zoneName,
      airDistance: pricing.airDistance,
      roadDistance: pricing.roadDistance
    }, "Price preview calculated");
  } catch (error) {
    if (error.name === 'ZodError') {
      return sendError(res, error.issues[0].message, 400, "VALIDATION_ERROR");
    }
    return sendError(res, error.message, 400);
  }
};

/**
 * Handle new booking creation.
 */
export const createBooking = async (req, res) => {
  try {
    const validatedData = bookingCreateSchema.parse(req.body);
    const farmerId = req.user.id;
    const booking = await BookingService.createBookingRequest(farmerId, validatedData);
    return sendSuccess(res, booking, "Booking scheduled successfully", 201);
  } catch (error) {
    if (error.name === 'ZodError') {
      return sendError(res, error.issues[0].message, 400, "VALIDATION_ERROR");
    }
    return sendError(res, error.message, 500);
  }
};

/**
 * List all bookings for the logged-in farmer.
 */
export const listBookings = async (req, res) => {
  try {
    const farmerId = req.user.id;
    const { page, limit, status, search } = req.query;
    const data = await BookingService.getFarmerBookings(farmerId, { page, limit, status, search });
    return sendSuccess(res, data, "Farmer bookings retrieved");
  } catch (error) {
    return sendError(res, error.message);
  }
};

/**
 * Get details for a specific booking.
 */
export const getBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const farmerId = req.user.id;
    const booking = await BookingService.getBookingById(id, farmerId);
    if (!booking) {
      return sendError(res, "Booking not found or access denied", 404, "NOT_FOUND");
    }
    return sendSuccess(res, booking, "Booking details retrieved");
  } catch (error) {
    return sendError(res, error.message);
  }
};
