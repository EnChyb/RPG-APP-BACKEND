import express, { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import cors from "cors";
// import passport from "./middleware/passportConfig.js";

// import authRouter from "./routes/api/auth.js";
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

app.use(cors(corsOptions));
app.use(express.json());
// app.use(passport.initialize());

// ROUTING
// app.use("/auth", authRouter);
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
