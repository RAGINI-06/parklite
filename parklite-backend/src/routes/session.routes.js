
const express = require("express");
const controller = require("../controllers/session.controller");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authenticateToken);

router.post(
  "/entry",
  authorizeRoles("admin"),
  controller.vehicleEntry
);

router.patch(
  "/:id/exit",
  authorizeRoles("admin"),
  controller.vehicleExit
);

router.get(
  "/active",
  authorizeRoles("admin"),
  controller.activeSessions
);

router.get("/my", controller.mySessions);

module.exports = router;
