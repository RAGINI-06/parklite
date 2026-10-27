
const { pool } = require("../config/db");
const crypto = require("crypto");
const {
  generateQRToken,
  generateBookingQR,
} = require("./qr.service");

// Create a new parking booking
async function createBooking(userId, data) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Lock the parking lot to prevent concurrent overbooking.
    const lotResult = await client.query(
      `SELECT id, name, total_capacity, hourly_rate, is_active
       FROM parking_lots
       WHERE id = $1
       FOR UPDATE`,
      [data.parkingLotId]
    );

    const lot = lotResult.rows[0];

    if (!lot || !lot.is_active) {
      const error = new Error(
        "Parking location not found or inactive."
      );
      error.status = 404;
      throw error;
    }

    // Count confirmed bookings overlapping the requested time.
    const occupiedResult = await client.query(
      `SELECT COUNT(*)::INTEGER AS occupied
       FROM bookings
       WHERE parking_lot_id = $1
         AND status = 'confirmed'
         AND start_time < $3
         AND end_time > $2`,
      [data.parkingLotId, data.startTime, data.endTime]
    );

    const occupied = occupiedResult.rows[0].occupied;

    if (occupied >= lot.total_capacity) {
      const error = new Error(
        "No parking spaces are available for this time period."
      );
      error.status = 409;
      throw error;
    }

    // Calculate the amount, charging for each started hour.
    const durationMs =
      new Date(data.endTime).getTime() -
      new Date(data.startTime).getTime();

    const billableHours = Math.ceil(
      durationMs / (60 * 60 * 1000)
    );

    const hourlyRate = Number(lot.hourly_rate);

    const estimatedAmount = Number(
      (billableHours * hourlyRate).toFixed(2)
    );

    // Generate a unique booking reference and QR token.
    const bookingReference = `PKL-${crypto
      .randomUUID()
      .replace(/-/g, "")
      .slice(0, 12)
      .toUpperCase()}`;

    const qrToken = generateQRToken();

    // Save the booking and QR token in the database.
    const bookingResult = await client.query(
      `INSERT INTO bookings (
         booking_reference,
         user_id,
         parking_lot_id,
         vehicle_number,
         start_time,
         end_time,
         estimated_amount,
         status,
         qr_token
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'confirmed', $8)
       RETURNING
         id,
         booking_reference,
         user_id,
         parking_lot_id,
         vehicle_number,
         start_time,
         end_time,
         estimated_amount,
         status,
         created_at,
         qr_token`,
      [
        bookingReference,
        userId,
        data.parkingLotId,
        data.vehicleNumber,
        data.startTime,
        data.endTime,
        estimatedAmount,
        qrToken,
      ]
    );

    const booking = bookingResult.rows[0];

    // Generate the QR image from the saved token.
    const qrCode = await generateBookingQR(booking.qr_token);

    await client.query("COMMIT");

    // Never expose the raw QR token in the API response.
    const { qr_token, ...safeBooking } = booking;

    return {
      ...safeBooking,
      parking_name: lot.name,
      qrCode,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Get all bookings belonging to the logged-in user

async function getUserBookings(userId) {
  const result = await pool.query(
    `SELECT
       b.id,
       b.booking_reference,
       b.parking_lot_id,
       pl.name AS parking_name,
       pl.address,
       pl.city,
       b.vehicle_number,
       b.start_time,
       b.end_time,
       b.estimated_amount,
       b.status,
       b.created_at,
       b.qr_token
     FROM bookings b
     JOIN parking_lots pl ON pl.id = b.parking_lot_id
     WHERE b.user_id = $1
     ORDER BY b.created_at DESC`,
    [userId]
  );

  // Generate a QR image for every booking using its saved token.
  const bookings = await Promise.all(
    result.rows.map(async (booking) => {
      const { qr_token, ...safeBooking } = booking;

      const qrCode = qr_token
        ? await generateBookingQR(qr_token)
        : null;

      return {
        ...safeBooking,
        qrCode,
      };
    })
  );

  return bookings;
}


// Get one booking belonging to the logged-in user
async function getBookingById(bookingId, userId) {
  const result = await pool.query(
    `SELECT
       b.id,
       b.booking_reference,
       b.user_id,
       b.parking_lot_id,
       pl.name AS parking_name,
       pl.address,
       pl.city,
       b.vehicle_number,
       b.start_time,
       b.end_time,
       b.estimated_amount,
       b.status,
       b.created_at,
       b.qr_token
     FROM bookings b
     JOIN parking_lots pl ON pl.id = b.parking_lot_id
     WHERE b.id = $1 AND b.user_id = $2`,
    [bookingId, userId]
  );

  const booking = result.rows[0];

  if (!booking) {
    return null;
  }

  // Generate the QR image for this booking.
  const qrCode = booking.qr_token
    ? await generateBookingQR(booking.qr_token)
    : null;

  // Do not expose the raw QR token.
  const { qr_token, ...safeBooking } = booking;

  return {
    ...safeBooking,
    qrCode,
  };
}

// Cancel a confirmed booking
async function cancelBooking(bookingId, userId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Lock the booking and verify ownership.
    const bookingResult = await client.query(
      `SELECT id, parking_lot_id, status, start_time
       FROM bookings
       WHERE id = $1 AND user_id = $2
       FOR UPDATE`,
      [bookingId, userId]
    );

    const booking = bookingResult.rows[0];

    if (!booking) {
      const error = new Error("Booking not found.");
      error.status = 404;
      throw error;
    }

    if (booking.status !== "confirmed") {
      const error = new Error(
        "Only confirmed bookings can be cancelled."
      );
      error.status = 409;
      throw error;
    }

    if (new Date(booking.start_time).getTime() <= Date.now()) {
      const error = new Error(
        "Bookings cannot be cancelled after their start time."
      );
      error.status = 409;
      throw error;
    }

    const result = await client.query(
      `UPDATE bookings
       SET status = 'cancelled'
       WHERE id = $1 AND user_id = $2
       RETURNING id, booking_reference, status`,
      [bookingId, userId]
    );

    await client.query("COMMIT");

    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
};
