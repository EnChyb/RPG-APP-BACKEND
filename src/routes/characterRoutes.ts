// src/routes/characterRoutes.ts
import express from "express";
import {
  createCharacter,
  getCharacter,
  updateCharacter,
  deleteCharacter,
  getAllCharacters,
  uploadAvatarOnly,
  changeCharacterType,
  transferCharacter,
} from "../controllers/Character/index.js";
import protect from "../middlewares/authMiddleware.js";
import uploadAvatar from "../middlewares/avatarMiddleware.js";

const router = express.Router();

// Create a new character
router.post("/", protect, uploadAvatar, createCharacter);

// Get all characters for the authenticated user
router.get("/", protect, getAllCharacters);

// Get a specific character by ID
router.get("/:id", protect, getCharacter);

// Update an existing character
router.patch("/:id", protect, uploadAvatar, updateCharacter);

// Delete a character
router.delete("/:id", protect, deleteCharacter);

router.post("/upload-avatar", protect, uploadAvatar, uploadAvatarOnly);
// router.use("/:id/equipment", editEquipmentRoutes);

// Change the type of a character (Hero/NPC/Monster)
router.patch("/:id/change-type", protect, changeCharacterType);

// Transfer (copy) a character to another user
router.post("/:id/transfer", protect, transferCharacter);

export default router;