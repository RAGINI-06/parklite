
const bookingService = require("../services/booking.service");

function validId(value) {
  return /^[1-9]\d*$/.test(String(value)) &&
    Number.isSafeInteger(Number(value));
}

function validDate(value) {
  if (
    typeof value !== "string" ||
    !/[zZ]|[+-]\d{2}:\d{2}$/.test(value)
  ) {
    return false;
  }

  return !Number.isNaN(Date.parse(value));
}

// POST /api/bookings
async function createBooking(req, res, next) {
  try {
    const {
      parkingLotId,
      vehicleNumber,
      startTime,
      endTime,
    } = req.body || {};

    if (!validId(String(parkingLotId ?? ""))) {
      return res.status(400).json({
        success: false,
        message: "A valid parkingLotId is required.",
      });
    }

    if (
      typeof vehicleNumber !== "string" ||
      !/^[A-Za-z0-9 -]{3,20}$/.test(vehicleNumber.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Vehicle number must contain 3–20 letters, digits, spaces, or hyphens.",
      });
    }

    if (!validDate(startTime) || !validDate(endTime)) {
      return res.status(400).json({
        success: false,
        message: "Provide valid timezone-aware startTime and endTime values.",
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = Date.now();
    const maxDuration = 7 * 24 * 60 * 60 * 1000;

    if (start.getTime() <= now) {
      return res.status(400).json({
        success: false,
        message: "Booking start time must be in the future.",
      });
    }

    if (
      end <= start ||
      end.getTime() - start.getTime() > maxDuration
    ) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time and the booking cannot exceed 7 days.",
      });
    }

    const booking = await bookingService.createBooking(
      req.user.id,
      {
        parkingLotId: Number(parkingLotId),
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      }
    );

    return res.status(201).json({
      success: true,
      message: "Parking booked successfully.",
      booking,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/bookings/my
async function getMyBookings(req, res, next) {
  try {
    const bookings = await bookingService.getUserBookings(req.user.id);

    return res.json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/bookings/:id
async function getBooking(req, res, next) {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    const booking = await bookingService.getBookingById(
      req.params.id,
      req.user.id
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    return res.json({ success: true, booking });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/bookings/:id/cancel
async function cancelBooking(req, res, next) {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    const booking = await bookingService.cancelBooking(
      req.params.id,
      req.user.id
    );

    return res.json({
      success: true,
      message: "Booking cancelled successfully.",
      booking,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createBooking,
  getMyBookings,
  getBooking,
  cancelBooking,
};
