// src/routes/eventRoutes.ts
import express from "express";
import protect from "../middlewares/authMiddleware.js";
import { createEvent } from "../controllers/Event/index.js";

const router = express.Router();

router.post("/", protect, createEvent);

// W przyszłości dodamy tu inne trasy, np. do aktualizacji, pobierania i usuwania eventów.
// router.get("/:roomCode", protect, getActiveEventForRoom);
// router.patch("/:eventId", protect, updateEvent);

export default router;