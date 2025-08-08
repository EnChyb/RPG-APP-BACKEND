// src/routes/eventRoutes.ts
import express from "express";
import protect from "../middlewares/authMiddleware.js";
import { createEvent } from "../controllers/Event/index.js";

const router = express.Router();

/**
 * @swagger
 * /events:
 * post:
 * summary: Create a new event in a game room
 * tags: [Events]
 * security:
 * - BearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - name
 * - type
 * - roomCode
 * - participants
 * properties:
 * name:
 * type: string
 * example: "Obrona karczmy 'Pod pijanym smokiem'"
 * type:
 * type: string
 * enum: ["Encounter", "Conflict"]
 * example: "Conflict"
 * roomCode:
 * type: string
 * example: "MojaGra-KOD:12345-678901"
 * participants:
 * type: array
 * items:
 * type: object
 * properties:
 * characterId:
 * type: string
 * example: "60d0fe4f5311236168a109ca"
 * side:
 * type: string
 * enum: ["A", "B"]
 * example: "A"
 * responses:
 * 201:
 * description: Event created successfully.
 * 400:
 * description: Invalid request data.
 * 403:
 * description: Only the Room Master can create events.
 * 404:
 * description: Room not found or character not found.
 */
router.post("/", protect, createEvent);

// W przyszłości dodamy tu inne trasy, np. do aktualizacji, pobierania i usuwania eventów.
// router.get("/:roomCode", protect, getActiveEventForRoom);
// router.patch("/:eventId", protect, updateEvent);

export default router;
