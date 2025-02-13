import "dotenv/config";

import connectDB from "./config/db";
import app from "./app";

console.log("Starting server...");

(async () => {
  try {
    await connectDB();
    app.listen(3000, () => {
      console.log("Server running. Use our API on port: 3000");
    });
  } catch (error: any) {
    console.error("Failed to start the server:", error.message);
    process.exit(1);
  }
})();
