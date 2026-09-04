import "dotenv/config";

import app from "./app.js";
import connectDatabase from "./config/db.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(
        `DevBoard API running on http://localhost:${PORT}`,
      );
    });
  } catch (error) {
    console.error(
      "Failed to start DevBoard API:",
      error.message,
    );

    process.exit(1);
  }
}

startServer();