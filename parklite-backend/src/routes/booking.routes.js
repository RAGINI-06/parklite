
const express = require("express");
const bookingController = require("../controllers/booking.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authenticateToken);

router.post("/", bookingController.createBooking);
router.get("/my", bookingController.getMyBookings);
router.get("/:id", bookingController.getBooking);
router.patch("/:id/cancel", bookingController.cancelBooking);

module.exports = router;
