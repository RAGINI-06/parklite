
const { pool } = require("../config/db");

async function getParkingLots(filters = {}) {
  const {
    search = "",
    city = "",
    minPrice,
    maxPrice,
    availableOnly = false,
  } = filters;

  const values = [];
  const conditions = ["pl.is_active = TRUE"];

  function addValue(value) {
    values.push(value);
    return `$${values.length}`;
  }

  if (search) {
    const p = addValue(`%${search}%`);
    conditions.push(
      `(pl.name ILIKE ${p} OR pl.address ILIKE ${p} OR pl.city ILIKE ${p})`
    );
  }

  if (city) {
    conditions.push(`pl.city ILIKE ${addValue(city)}`);
  }

  if (minPrice !== undefined) {
    conditions.push(`pl.hourly_rate >= ${addValue(minPrice)}`);
  }

  if (maxPrice !== undefined) {
    conditions.push(`pl.hourly_rate <= ${addValue(maxPrice)}`);
  }

  const availability = `
    GREATEST(
      pl.total_capacity - (
        SELECT COUNT(*)::INTEGER
        FROM bookings b
        WHERE b.parking_lot_id = pl.id
          AND b.status = 'confirmed'
          AND b.start_time < NOW() + INTERVAL '1 hour'
          AND b.end_time > NOW()
      ),
      0
    )
  `;

  if (availableOnly) {
    conditions.push(`(${availability}) > 0`);
  }

  const result = await pool.query(
    `SELECT
       pl.id,
       pl.name,
       pl.address,
       pl.city,
       pl.total_capacity,
       pl.hourly_rate,
       pl.is_active,
       pl.created_at,
       (${availability}) AS available_spaces
     FROM parking_lots pl
     WHERE ${conditions.join(" AND ")}
     ORDER BY pl.name ASC`,
    values
  );

  return result.rows;
}

async function getParkingLotById(id) {
  const result = await pool.query(
    `SELECT
       pl.id,
       pl.name,
       pl.address,
       pl.city,
       pl.total_capacity,
       pl.hourly_rate,
       pl.is_active,
       pl.created_at,
       GREATEST(
         pl.total_capacity - (
           SELECT COUNT(*)::INTEGER
           FROM bookings b
           WHERE b.parking_lot_id = pl.id
             AND b.status = 'confirmed'
             AND b.start_time < NOW() + INTERVAL '1 hour'
             AND b.end_time > NOW()
         ),
         0
       ) AS available_spaces
     FROM parking_lots pl
     WHERE pl.id = $1 AND pl.is_active = TRUE`,
    [id]
  );

  return result.rows[0] || null;
}

async function getAvailability(id, startTime, endTime) {
  const result = await pool.query(
    `SELECT
       pl.id,
       pl.name,
       pl.total_capacity,
       pl.hourly_rate,
       (
         SELECT COUNT(*)::INTEGER
         FROM bookings b
         WHERE b.parking_lot_id = pl.id
           AND b.status = 'confirmed'
           AND b.start_time < $3::timestamptz
           AND b.end_time > $2::timestamptz
       ) AS booked_spaces
     FROM parking_lots pl
     WHERE pl.id = $1 AND pl.is_active = TRUE`,
    [id, startTime, endTime]
  );

  const lot = result.rows[0];

  if (!lot) return null;

  const bookedSpaces = Number(lot.booked_spaces);
  const capacity = Number(lot.total_capacity);

  return {
    parkingLotId: lot.id,
    name: lot.name,
    totalCapacity: capacity,
    bookedSpaces,
    availableSpaces: Math.max(0, capacity - bookedSpaces),
    hourlyRate: Number(lot.hourly_rate),
    startTime,
    endTime,
  };
}

async function createParkingLot(data) {
  const result = await pool.query(
    `INSERT INTO parking_lots
       (name, address, city, total_capacity, hourly_rate)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, address, city, total_capacity,
               hourly_rate, is_active, created_at`,
    [
      data.name,
      data.address,
      data.city,
      data.totalCapacity,
      data.hourlyRate,
    ]
  );

  return result.rows[0];
}

async function updateParkingLot(id, data) {
  const result = await pool.query(
    `UPDATE parking_lots
     SET name = COALESCE($2, name),
         address = COALESCE($3, address),
         city = COALESCE($4, city),
         total_capacity = COALESCE($5, total_capacity),
         hourly_rate = COALESCE($6, hourly_rate),
         updated_at = NOW()
     WHERE id = $1 AND is_active = TRUE
     RETURNING id, name, address, city, total_capacity,
               hourly_rate, is_active, updated_at`,
    [
      id,
      data.name ?? null,
      data.address ?? null,
      data.city ?? null,
      data.totalCapacity ?? null,
      data.hourlyRate ?? null,
    ]
  );

  return result.rows[0] || null;
}

async function deactivateParkingLot(id) {
  const result = await pool.query(
    `UPDATE parking_lots
     SET is_active = FALSE, updated_at = NOW()
     WHERE id = $1 AND is_active = TRUE
     RETURNING id, name, is_active`,
    [id]
  );

  return result.rows[0] || null;
}

module.exports = {
  getParkingLots,
  getParkingLotById,
  getAvailability,
  createParkingLot,
  updateParkingLot,
  deactivateParkingLot,
};
