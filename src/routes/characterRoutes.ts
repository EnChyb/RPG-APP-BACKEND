import express from "express";
import {
  createCharacter,
  getCharacter,
  updateCharacter,
  deleteCharacter,
  getAllCharacters,
} from "../controllers/Character/CharacterController.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createCharacter);
router.get("/:id", protect, getCharacter);
router.patch("/:id", protect, updateCharacter);
router.delete("/:id", protect, deleteCharacter);
router.get("/", protect, getAllCharacters);

export default router;
