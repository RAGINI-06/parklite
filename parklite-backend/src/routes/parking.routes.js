
const express = require("express");
const parkingController = require("../controllers/parking.controller");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/auth.middleware");

const router = express.Router();

// Public parking search and details
router.get("/", parkingController.listParkingLots);

router.get(
  "/:id/availability",
  parkingController.checkAvailability
);

router.get("/:id", parkingController.getParkingLot);

// Admin-only management
router.post(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  parkingController.createParkingLot
);

router.patch(
  "/:id",
  authenticateToken,
  authorizeRoles("admin"),
  parkingController.updateParkingLot
);

router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("admin"),
  parkingController.deactivateParkingLot
);

module.exports = router;
