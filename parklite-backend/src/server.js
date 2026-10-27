
require("dotenv").config();

const app = require("./app");
const { pool, testDatabaseConnection } = require("./config/db");

const PORT = Number(process.env.PORT || 5000);

async function startServer() {
  try {
    await testDatabaseConnection();

    app.listen(PORT, () => {
      console.log(`ParkLite API running at http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error("Failed to start ParkLite:", error.message);
    await pool.end();
    process.exit(1);
  }
}

startServer();
