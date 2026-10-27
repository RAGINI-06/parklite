
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const parkingRoutes = require("./routes/parking.routes");
const bookingRoutes = require("./routes/booking.routes");
const sessionRoutes = require("./routes/session.routes");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://parklite.vercel.app",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header, such as health checks.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/parking-lots", parkingRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/parking-sessions", sessionRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((error, req, res, next) => {
  console.error(error);

  res.status(error.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : error.message,
  });
});

module.exports = app;
