
const express = require("express");
const { pool } = require("../config/db");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT current_database() AS database, NOW() AS time"
    );

    res.status(200).json({
      success: true,
      message: "ParkLite backend is running",
      database: result.rows[0].database,
      timestamp: result.rows[0].time,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
