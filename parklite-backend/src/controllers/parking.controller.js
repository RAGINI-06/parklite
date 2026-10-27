
const parkingService = require("../services/parking.service");

function validId(id) {
  return /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id));
}

function parseOptionalPrice(value) {
  if (value === undefined) return { valid: true };

  if (
    value === "" ||
    !/^\d+(\.\d{1,2})?$/.test(String(value)) ||
    !Number.isFinite(Number(value)) ||
    Number(value) < 0
  ) {
    return { valid: false };
  }

  return { valid: true, value: Number(value) };
}

function validateLotBody(body, partial = false) {
  const fields = [
    ["name", 150],
    ["address", 1000],
    ["city", 100],
  ];

  for (const [field, maxLength] of fields) {
    if (!partial || body[field] !== undefined) {
      if (
        typeof body[field] !== "string" ||
        body[field].trim().length === 0 ||
        body[field].trim().length > maxLength
      ) {
        return `${field} must be a non-empty string of at most ${maxLength} characters.`;
      }
    }
  }

  if (!partial || body.totalCapacity !== undefined) {
    if (
      !Number.isSafeInteger(body.totalCapacity) ||
      body.totalCapacity < 1
    ) {
      return "totalCapacity must be a positive integer.";
    }
  }

  if (!partial || body.hourlyRate !== undefined) {
    if (
      typeof body.hourlyRate !== "number" ||
      !Number.isFinite(body.hourlyRate) ||
      body.hourlyRate < 0 ||
      Math.round(body.hourlyRate * 100) !== body.hourlyRate * 100
    ) {
      return "hourlyRate must be a non-negative number with at most two decimal places.";
    }
  }

  return null;
}

// GET /api/parking-lots
async function listParkingLots(req, res, next) {
  try {
    const { search = "", city = "", availableOnly = "false" } = req.query;

    if (
      typeof search !== "string" ||
      search.length > 100 ||
      typeof city !== "string" ||
      city.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Search or city filter is invalid.",
      });
    }

    if (!["true", "false"].includes(availableOnly)) {
      return res.status(400).json({
        success: false,
        message: "availableOnly must be true or false.",
      });
    }

    const min = parseOptionalPrice(req.query.minPrice);
    const max = parseOptionalPrice(req.query.maxPrice);

    if (!min.valid || !max.valid) {
      return res.status(400).json({
        success: false,
        message: "Price filters must be non-negative numbers.",
      });
    }

    if (
      min.value !== undefined &&
      max.value !== undefined &&
      min.value > max.value
    ) {
      return res.status(400).json({
        success: false,
        message: "minPrice cannot exceed maxPrice.",
      });
    }

    const parkingLots = await parkingService.getParkingLots({
      search: search.trim(),
      city: city.trim(),
      minPrice: min.value,
      maxPrice: max.value,
      availableOnly: availableOnly === "true",
    });

    return res.json({
      success: true,
      count: parkingLots.length,
      parkingLots,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/parking-lots/:id
async function getParkingLot(req, res, next) {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid parking lot ID.",
      });
    }

    const parkingLot = await parkingService.getParkingLotById(
      req.params.id
    );

    if (!parkingLot) {
      return res.status(404).json({
        success: false,
        message: "Parking location not found.",
      });
    }

    return res.json({ success: true, parkingLot });
  } catch (error) {
    next(error);
  }
}

// GET /api/parking-lots/:id/availability
async function checkAvailability(req, res, next) {
  try {
    const { id } = req.params;
    const { startTime, endTime } = req.query;

    if (!validId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid parking lot ID.",
      });
    }

    if (typeof startTime !== "string" || typeof endTime !== "string") {
      return res.status(400).json({
        success: false,
        message: "startTime and endTime are required ISO date strings.",
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      !/[zZ]|[+-]\d{2}:\d{2}$/.test(startTime) ||
      !/[zZ]|[+-]\d{2}:\d{2}$/.test(endTime) ||
      end <= start ||
      end - start > 7 * 24 * 60 * 60 * 1000
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide valid timezone-aware dates. End time must be after start time, and the interval cannot exceed 7 days.",
      });
    }

    const availability = await parkingService.getAvailability(
      id,
      start.toISOString(),
      end.toISOString()
    );

    if (!availability) {
      return res.status(404).json({
        success: false,
        message: "Parking location not found.",
      });
    }

    return res.json({ success: true, availability });
  } catch (error) {
    next(error);
  }
}

// POST /api/parking-lots — admin only
async function createParkingLot(req, res, next) {
  try {
    const errorMessage = validateLotBody(req.body || {});

    if (errorMessage) {
      return res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }

    const parkingLot = await parkingService.createParkingLot({
      name: req.body.name.trim(),
      address: req.body.address.trim(),
      city: req.body.city.trim(),
      totalCapacity: req.body.totalCapacity,
      hourlyRate: req.body.hourlyRate,
    });

    return res.status(201).json({
      success: true,
      message: "Parking location created.",
      parkingLot,
    });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/parking-lots/:id — admin only
async function updateParkingLot(req, res, next) {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid parking lot ID.",
      });
    }

    const body = req.body || {};

    if (
      Object.keys(body).length === 0 ||
      Object.keys(body).some(
        (key) =>
          !["name", "address", "city", "totalCapacity", "hourlyRate"].includes(key)
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide valid fields to update.",
      });
    }

    const errorMessage = validateLotBody(body, true);

    if (errorMessage) {
      return res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }

    const parkingLot = await parkingService.updateParkingLot(
      req.params.id,
      {
        ...body,
        name: body.name?.trim(),
        address: body.address?.trim(),
        city: body.city?.trim(),
      }
    );

    if (!parkingLot) {
      return res.status(404).json({
        success: false,
        message: "Active parking location not found.",
      });
    }

    return res.json({
      success: true,
      message: "Parking location updated.",
      parkingLot,
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/parking-lots/:id — soft delete, admin only
async function deactivateParkingLot(req, res, next) {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid parking lot ID.",
      });
    }

    const parkingLot = await parkingService.deactivateParkingLot(
      req.params.id
    );

    if (!parkingLot) {
      return res.status(404).json({
        success: false,
        message: "Active parking location not found.",
      });
    }

    return res.json({
      success: true,
      message: "Parking location deactivated.",
      parkingLot,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listParkingLots,
  getParkingLot,
  checkAvailability,
  createParkingLot,
  updateParkingLot,
  deactivateParkingLot,
};
