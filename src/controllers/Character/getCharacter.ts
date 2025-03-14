import { RequestHandler } from "express";
import Character from "../../models/Character.js";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware.js";

export const getCharacter: RequestHandler = async (
  req: AuthenticatedRequest,
  res,
  next
) => {
  try {
    const character = await Character.findById(req.params.id)
      .populate("owner", "email role") // Include email & role for the owner
      .lean(); // Convert to a plain JS object

    if (!character) {
      res.status(404).json({ message: "Character not found" });
      return;
    }

    // Remove `_id` from nested arrays
    const cleanNestedArray = (array: any[]) =>
      array ? array.map(({ _id, ...rest }) => rest) : [];

    // Ensure a defined field order
    const orderedCharacter = {
      _id: character._id,
      name: character.name,
      age: character.age,
      archetype: character.archetype,
      race: character.race,
      RPGSystem: character.RPGSystem,
      appearance: character.appearance,
      bigDream: character.bigDream,
      owner: character.owner,

      willpower: character.willpower,
      attributes: character.attributes,
      wounds: character.wounds,
      states: character.states,

      skills: character.skills,
      additionalSkills: cleanNestedArray(character.additionalSkills),
      talents: cleanNestedArray(character.talents),

      items: {
        Weapons: cleanNestedArray(character.items?.Weapons),
        Armor: cleanNestedArray(character.items?.Armor),
        Gears: cleanNestedArray(character.items?.Gears),
      },

      GameMaster: character.GameMaster,
      createdAt: character.createdAt,
      updatedAt: character.updatedAt,
    };

    res.json(orderedCharacter);
  } catch (error) {
    next(error);
  }
};
