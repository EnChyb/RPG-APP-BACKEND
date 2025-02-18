import "dotenv/config";

import connectDB from "./config/db.js";
import app from "./app.js";

console.log("Starting server...");

const PORT = process.env.MAIN_PORT || 3000;

(async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running. Use our API on port: ${PORT}`);
    });
  } catch (error: any) {
    console.error("Failed to start the server:", error.message);
    process.exit(1);
  }
})();
