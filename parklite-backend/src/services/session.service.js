
const { pool } = require("../config/db");

async function recordEntry(bookingId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `SELECT b.id, b.parking_lot_id, b.status, b.start_time,
              b.end_time, b.vehicle_number, pl.is_active
       FROM bookings b
       JOIN parking_lots pl ON pl.id = b.parking_lot_id
       WHERE b.id = $1
       FOR UPDATE OF b`,
      [bookingId]
    );

    const booking = result.rows[0];

    if (!booking || !booking.is_active) {
      const error = new Error("Booking or active parking location not found.");
      error.status = 404;
      throw error;
    }

    if (booking.status !== "confirmed") {
      const error = new Error("Only confirmed bookings can enter.");
      error.status = 409;
      throw error;
    }

    const now = Date.now();

    if (
      now < new Date(booking.start_time).getTime() ||
      now >= new Date(booking.end_time).getTime()
    ) {
      const error = new Error("Vehicle entry is outside the booking period.");
      error.status = 409;
      throw error;
    }

    const existing = await client.query(
      "SELECT id FROM parking_sessions WHERE booking_id = $1",
      [bookingId]
    );

    if (existing.rowCount > 0) {
      const error = new Error("A parking session already exists for this booking.");
      error.status = 409;
      throw error;
    }

    const sessionResult = await client.query(
      `INSERT INTO parking_sessions (booking_id)
       VALUES ($1)
       RETURNING id, booking_id, entry_time, status`,
      [bookingId]
    );

    await client.query("COMMIT");

    return {
      ...sessionResult.rows[0],
      vehicleNumber: booking.vehicle_number,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function recordExit(sessionId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `SELECT ps.id, ps.booking_id, ps.entry_time, ps.status,
              b.parking_lot_id, pl.hourly_rate
       FROM parking_sessions ps
       JOIN bookings b ON b.id = ps.booking_id
       JOIN parking_lots pl ON pl.id = b.parking_lot_id
       WHERE ps.id = $1
       FOR UPDATE OF ps`,
      [sessionId]
    );

    const session = result.rows[0];

    if (!session) {
      const error = new Error("Parking session not found.");
      error.status = 404;
      throw error;
    }

    if (session.status !== "active") {
      const error = new Error("This parking session has already ended.");
      error.status = 409;
      throw error;
    }

    const entryTime = new Date(session.entry_time);
    const exitTime = new Date();

    const durationMs = exitTime.getTime() - entryTime.getTime();
    const durationMinutes = Math.ceil(durationMs / 60000);
    const billableHours = Math.max(1, Math.ceil(durationMs / 3600000));

    const finalAmount = Number(
      (billableHours * Number(session.hourly_rate)).toFixed(2)
    );

    const update = await client.query(
      `UPDATE parking_sessions
       SET exit_time = $2,
           duration_minutes = $3,
           final_amount = $4,
           status = 'completed',
           updated_at = NOW()
       WHERE id = $1 AND status = 'active'
       RETURNING id, booking_id, entry_time, exit_time,
                 duration_minutes, final_amount, status`,
      [sessionId, exitTime.toISOString(), durationMinutes, finalAmount]
    );

    await client.query("COMMIT");
    return update.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getActiveSessions() {
  const result = await pool.query(
    `SELECT ps.id, ps.booking_id, ps.entry_time, ps.status,
            b.booking_reference, b.vehicle_number,
            pl.name AS parking_name
     FROM parking_sessions ps
     JOIN bookings b ON b.id = ps.booking_id
     JOIN parking_lots pl ON pl.id = b.parking_lot_id
     WHERE ps.status = 'active'
     ORDER BY ps.entry_time ASC`
  );

  return result.rows;
}

async function getMySessions(userId) {
  const result = await pool.query(
    `SELECT ps.id, ps.booking_id, ps.entry_time, ps.exit_time,
            ps.duration_minutes, ps.final_amount, ps.status,
            b.booking_reference, b.vehicle_number,
            pl.name AS parking_name
     FROM parking_sessions ps
     JOIN bookings b ON b.id = ps.booking_id
     JOIN parking_lots pl ON pl.id = b.parking_lot_id
     WHERE b.user_id = $1
     ORDER BY ps.entry_time DESC`,
    [userId]
  );

  return result.rows;
}

module.exports = {
  recordEntry,
  recordExit,
  getActiveSessions,
  getMySessions,
};
