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
 *           example: "Thaliana"
 *         age:
 *           type: string
 *           enum: [Młody, Dorosły, Stary]
 *           example: "Dorosły"
 *         archetype:
 *           type: string
 *           example: "Warrior"
 *         race:
 *           type: string
 *           example: "Elf"
 *         RPGSystem:
 *           type: string
 *           example: "Year Zero Engine"
 *         attributes:
 *           type: object
 *           properties:
 *             Strength: { type: object, properties: { value: { type: number, example: 4 } } }
 *             Agility: { type: object, properties: { value: { type: number, example: 5 } } }
 *             Wits: { type: object, properties: { value: { type: number, example: 3 } } }
 *             Empathy: { type: object, properties: { value: { type: number, example: 2 } } }
 *         skills:
 *           type: object
 *           properties:
 *             Craft: { type: object, properties: { value: { type: number, example: 2 } } }
 *             Endure: { type: object, properties: { value: { type: number, example: 4 } } }
 *             Fight: { type: object, properties: { value: { type: number, example: 5 } } }
 *             Sneak: { type: object, properties: { value: { type: number, example: 3 } } }
 *             Move: { type: object, properties: { value: { type: number, example: 2 } } }
 *             Shoot: { type: object, properties: { value: { type: number, example: 4 } } }
 *             Scout: { type: object, properties: { value: { type: number, example: 1 } } }
 *             Comprehend: { type: object, properties: { value: { type: number, example: 3 } } }
 *             Survive: { type: object, properties: { value: { type: number, example: 2 } } }
 *             Manipulate: { type: object, properties: { value: { type: number, example: 3 } } }
 *             SenseEmotion: { type: object, properties: { value: { type: number, example: 2 } } }
 *             Heal: { type: object, properties: { value: { type: number, example: 1 } } }
 *         bigDream:
 *           type: string
 *           example: "Zostać największym wojownikiem królestwa."
 *           description: "Opcjonalne - Marzenie bohatera."
 *         appearance:
 *           type: string
 *           example: "Wysoki elf o srebrnych włosach i bliznach po bitwach."
 *           description: "Opcjonalne - Opis wyglądu."
 *         additionalSkills:
 *           type: array
 *           description: "Opcjonalne - Dodatkowe umiejętności, które bohater nabył."
 *           items:
 *             type: object
 *             properties:
 *               displayName: { type: string, example: "Alchemy" }
 *               value: { type: number, example: 3 }
 *               linkedAttribute: { type: string, enum: ["Strength", "Agility", "Wits", "Empathy"], example: "Wits" }
 *         talents:
 *           type: array
 *           description: "Opcjonalne - Lista talentów bohatera."
 *           items:
 *             type: object
 *             properties:
 *               id: { type: string, example: "talent-1" }
 *               name: { type: string, example: "Master Tactician" }
 *               description: { type: string, example: "Bohater potrafi przewidywać ruchy wroga." }
 *         items:
 *           type: array
 *           description: "Opcjonalne - Przedmioty posiadane przez bohatera."
 *           items:
 *             type: object
 *             properties:
 *               id: { type: string, example: "item-1" }
 *               name: { type: string, example: "Magic Sword" }
 *               type: { type: string, enum: ["Weapon", "Armor", "Gear"], example: "Weapon" }
 *               description: { type: string, example: "Miecz wykuty przez elfickich kowali." }
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

/**
 * @swagger
 * /characters:
 *   get:
 *     summary: Get all characters for the authenticated user
 *     tags: [Characters]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of characters
 *       401:
 *         description: Unauthorized
 */
router.get("/", protect, getAllCharacters);

/**
 * @swagger
 * /characters/{id}:
 *   get:
 *     summary: Get a character by ID
 *     tags: [Characters]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "65f3c0d9c5d6e521b0d3a8f6"
 *     responses:
 *       200:
 *         description: Successfully retrieved character
 *       404:
 *         description: Character not found
 */
router.get("/:id", protect, getCharacter);

/**
 * @swagger
 * /characters/{id}:
 *   patch:
 *     summary: Update a character
 *     tags: [Characters]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "65f3c0d9c5d6e521b0d3a8f6"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               skills:
 *                 type: object
 *                 properties:
 *                   Fight:
 *                     type: object
 *                     properties:
 *                       value:
 *                         type: number
 *                         example: 6
 *               wounds:
 *                 type: object
 *                 properties:
 *                   Damage:
 *                     type: object
 *                     properties:
 *                       current:
 *                         type: number
 *                         example: 2
 *     responses:
 *       200:
 *         description: Successfully updated character
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Character not found
 */
router.patch("/:id", protect, updateCharacter);

/**
 * @swagger
 * /characters/{id}:
 *   delete:
 *     summary: Delete a character
 *     tags: [Characters]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "65f3c0d9c5d6e521b0d3a8f6"
 *     responses:
 *       200:
 *         description: Successfully deleted character
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Character not found
 */
router.delete("/:id", protect, deleteCharacter);

router.get("/", protect, getAllCharacters);

export default router;
