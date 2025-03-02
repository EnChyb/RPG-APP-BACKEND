import express, { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// import passport from "./middleware/passportConfig.js";

import authRouter from "./routes/authRoutes.js";
// import userRouter from "./routes/api/user.js";

// import authenticateToken from "./middleware/authenticateToken.js";

// import "./middleware/googlePassportConfig.js";

const app = express();

const formatsLogger = app.get("env") === "development" ? "dev" : "short";

app.use(morgan(formatsLogger));

const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:3000"],
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "Location"],
  credentials: true,
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors(corsOptions));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
// app.use(passport.initialize());

// ROUTING
app.use("/api/auth", authRouter);
// app.use("/user", authenticateToken, userRouter);

// MIDDLEWARE - ERRORS
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: "Not found" });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res
    .status(err.status || 500)
    .json({ message: err.message || "Internal Server Error" });
});

export default app;
