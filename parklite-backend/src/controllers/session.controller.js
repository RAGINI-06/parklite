
const sessionService = require("../services/session.service");

function validId(id) {
  return /^[1-9]\d*$/.test(String(id)) &&
    Number.isSafeInteger(Number(id));
}

// POST /api/parking-sessions/entry
async function vehicleEntry(req, res, next) {
  try {
    const { bookingId } = req.body || {};

    if (!validId(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "A valid bookingId is required.",
      });
    }

    const session = await sessionService.recordEntry(bookingId);

    return res.status(201).json({
      success: true,
      message: "Vehicle entry recorded.",
      session,
    });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/parking-sessions/:id/exit
async function vehicleExit(req, res, next) {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid session ID.",
      });
    }

    const session = await sessionService.recordExit(req.params.id);

    return res.json({
      success: true,
      message: "Vehicle exit recorded.",
      session,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/parking-sessions/active
async function activeSessions(req, res, next) {
  try {
    const sessions = await sessionService.getActiveSessions();

    return res.json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/parking-sessions/my
async function mySessions(req, res, next) {
  try {
    const sessions = await sessionService.getMySessions(req.user.id);

    return res.json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  vehicleEntry,
  vehicleExit,
  activeSessions,
  mySessions,
};
