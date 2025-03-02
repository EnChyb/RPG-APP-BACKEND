import express from "express";
import {
  createCharacter,
  getCharacter,
  updateCharacter,
  deleteCharacter,
  getAllCharacters,
} from "../controllers/Character/index.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Character:
 *       type: object
 *       required:
 *         - name
 *         - age
 *         - archetype
 *         - race
 *         - RPGSystem
 *         - attributes
 *         - skills
 *       properties:
 *         name:
 *           type: string
 *           example: "Bjorn"
 *         age:
 *           type: string
 *           enum: ["Young", "Adult", "Old"]
 *           example: "Adult"
 *         archetype:
 *           type: string
 *           example: "Warrior"
 *         race:
 *           type: string
 *           example: "Human"
 *         RPGSystem:
 *           type: string
 *           example: "Year Zero Engine"
 *         appearance:
 *           type: string
 *           example: "A burly, tall man with long red hair and a thick beard."
 *         bigDream:
 *           type: string
 *           example: "To become the greatest warrior in history."
 *         attributes:
 *           type: object
 *           properties:
 *             Strength: { type: object, properties: { value: { type: number, example: 5 } } }
 *             Agility: { type: object, properties: { value: { type: number, example: 3 } } }
 *             Wits: { type: object, properties: { value: { type: number, example: 2 } } }
 *             Empathy: { type: object, properties: { value: { type: number, example: 1 } } }
 *         skills:
 *           type: object
 *           properties:
 *             Craft: { type: object, properties: { value: { type: number, example: 0 }, linkedAttribute: { type: string, example: "Strength" } } }
 *             Endure: { type: object, properties: { value: { type: number, example: 4 }, linkedAttribute: { type: string, example: "Strength" } } }
 *             Fight: { type: object, properties: { value: { type: number, example: 5 }, linkedAttribute: { type: string, example: "Strength" } } }
 *             Sneak: { type: object, properties: { value: { type: number, example: 0 }, linkedAttribute: { type: string, example: "Agility" } } }
 *             Move: { type: object, properties: { value: { type: number, example: 3 }, linkedAttribute: { type: string, example: "Agility" } } }
 *             Shoot: { type: object, properties: { value: { type: number, example: 2 }, linkedAttribute: { type: string, example: "Agility" } } }
 *             Scout: { type: object, properties: { value: { type: number, example: 2 }, linkedAttribute: { type: string, example: "Wits" } } }
 *             Comprehend: { type: object, properties: { value: { type: number, example: 2 }, linkedAttribute: { type: string, example: "Wits" } } }
 *             Survive: { type: object, properties: { value: { type: number, example: 3 }, linkedAttribute: { type: string, example: "Wits" } } }
 *             Manipulate: { type: object, properties: { value: { type: number, example: 1 }, linkedAttribute: { type: string, example: "Empathy" } } }
 *             SenseEmotion: { type: object, properties: { value: { type: number, example: 2 }, linkedAttribute: { type: string, example: "Empathy" } } }
 *             Heal: { type: object, properties: { value: { type: number, example: 1 }, linkedAttribute: { type: string, example: "Empathy" } } }
 *         additionalSkills:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               displayName: { type: string, example: "Music" }
 *               value: { type: number, example: 1 }
 *               linkedAttribute: { type: string, example: "Empathy" }
 *         talents:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id: { type: string, example: "talent-1" }
 *               name: { type: string, example: "Berserker" }
 *               description: { type: string, example: "Entering a battle rage grants additional damage." }
 *         items:
 *           type: object
 *           properties:
 *             Weapons:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: string, example: "item-1" }
 *                   name: { type: string, example: "Great Axe" }
 *                   type: { type: string, example: "Weapon" }
 *                   description: { type: string, example: "A massive battle axe with a two-handed blade." }
 *             Armor:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: string, example: "item-2" }
 *                   name: { type: string, example: "Light Armor" }
 *                   type: { type: string, example: "Armor" }
 *                   description: { type: string, example: "Leather armor providing protection against light attacks." }
 *             Gears:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: string, example: "item-3" }
 *                   name: { type: string, example: "War Horn" }
 *                   type: { type: string, example: "Gear" }
 *                   description: { type: string, example: "A powerful horn used for signaling and intimidating enemies." }
 */

/**
 * @swagger
 * /characters:
 *   post:
 *     summary: Create a new character
 *     tags: [Characters]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Character'
 *     responses:
 *       201:
 *         description: Character created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post("/", protect, createCharacter);

router.get("/", protect, getAllCharacters);
router.get("/:id", protect, getCharacter);
router.patch("/:id", protect, updateCharacter);
router.delete("/:id", protect, deleteCharacter);

export default router;
