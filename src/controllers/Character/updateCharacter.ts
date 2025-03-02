import { RequestHandler } from "express";
import Character from "../../models/Character.js";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware.js";

export const updateCharacter: RequestHandler = async (
  req: AuthenticatedRequest,
  res,
  next
): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Fetch the character from the database
    const character = await Character.findById(id);
    if (!character) {
      res.status(404).json({ message: "Character not found" });
      return;
    }

    // Check if the user is the Owner or Game Master
    const isOwner = character.owner.toString() === req.user?.id;
    const isGameMaster = character.GameMaster === req.user?.id;

    if (!isOwner && !isGameMaster) {
      res.status(403).json({
        message: "Forbidden: You are not allowed to update this character.",
      });
      return;
    }

    // Fields that should NEVER be updated manually
    const protectedFields = ["_id", "owner", "createdAt", "updatedAt"];
    for (const field of Object.keys(updates)) {
      if (protectedFields.includes(field)) {
        res.status(400).json({
          message: `Field '${field}' cannot be updated manually.`,
        });
        return;
      }
    }

    // ✅ Preserve `displayName` while updating nested fields
    if (updates.attributes) {
      character.attributes = {
        ...character.attributes, // Preserve existing
        ...updates.attributes, // Apply new updates
      };
    }

    if (updates.skills) {
      character.skills = {
        ...character.skills,
        ...updates.skills,
      };
    }

    if (updates.wounds) {
      for (const woundType of Object.keys(updates.wounds) as Array<
        keyof typeof character.wounds
      >) {
        if (character.wounds[woundType]) {
          character.wounds[woundType] = {
            ...character.wounds[woundType], // Preserve displayName
            ...updates.wounds[woundType], // Apply new value
          };
        }
      }
    }

    if (updates.states) {
      character.states = {
        ...character.states,
        ...updates.states,
      };
    }

    if (updates.items) {
      character.items = {
        Weapons: updates.items.Weapons || character.items.Weapons,
        Armor: updates.items.Armor || character.items.Armor,
        Gears: updates.items.Gears || character.items.Gears,
      };
    }

    // ✅ Save and return the updated character
    await character.save();

    // ✅ Structuring response to maintain correct order
    const formattedResponse = {
      message: "Character updated successfully",
      character: {
        _id: character._id,
        name: character.name,
        age: character.age,
        archetype: character.archetype,
        race: character.race,
        RPGSystem: character.RPGSystem,
        appearance: character.appearance,
        bigDream: character.bigDream,
        willpower: character.willpower,
        attributes: character.attributes,
        wounds: character.wounds,
        states: character.states,
        skills: character.skills,
        additionalSkills: character.additionalSkills,
        talents: character.talents,
        items: character.items,
        GameMaster: character.GameMaster,
        owner: character.owner,
        createdAt: character.createdAt,
        updatedAt: character.updatedAt,
        __v: character.__v,
      },
    };

    res.json(formattedResponse);
  } catch (error) {
    next(error);
  }
};
