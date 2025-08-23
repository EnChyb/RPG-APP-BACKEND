import express, { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import cors from "cors";
//import path from "path";
//import { fileURLToPath } from "url";
import { setupSwagger } from "./config/swagger.js"; // Import Swaggera

import authRouter from "./routes/authRoutes.js";
import characterRoutes from "./routes/characterRoutes.js";
import dataRouter from "./routes/dataRoutes.js";
import eventRouter from "./routes/eventRoutes.js";
import editEquipmentRoutes from "./routes/editEquipment.js";

const app = express();
const formatsLogger = app.get("env") === "development" ? "dev" : "short";

app.use(morgan(formatsLogger));

const corsOptions = {
  origin: [
    "http://localhost:5100",
    "http://localhost:8081",
    "http://localhost:3000",
  ],
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "Location"],
  credentials: true,
};

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

app.use(cors(corsOptions));
app.use(express.json());
//app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

setupSwagger(app); // 🔥 Dodaj Swaggera tutaj

app.use("/api/auth", authRouter);
app.use("/api/characters", characterRoutes);
app.use("/api/data", dataRouter);
app.use("/api/events", eventRouter);
app.use("/api", editEquipmentRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({ message: "Not found" });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res
    .status(err.status || 500)
    .json({ message: err.message || "Internal Server Error" });
});

export default app;
