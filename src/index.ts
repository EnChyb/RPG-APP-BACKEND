import "dotenv/config";
import { createServer } from "http";
import connectDB from "./config/db.js";
import app from "./app.js";
import { initGameRoomSocket } from "./sockets/gameRoomSocket.js";

console.log("Starting server...");

const PORT = process.env.MAIN_PORT || 3000;

(async () => {
  try {
    await connectDB();
    const server = createServer(app);
    initGameRoomSocket(server);
    server.listen(PORT, () => {
    // app.listen(PORT, () => {
      console.log(`Server running. Use our API on port: ${PORT}`);
    });
  } catch (error: any) {
    console.error("Failed to start the server:", error.message);
    process.exit(1);
  }
})();
