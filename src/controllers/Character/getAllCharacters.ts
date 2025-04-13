import { RequestHandler } from "express";
import Character from "../../models/Character.js";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware.js";

export const getAllCharacters: RequestHandler = async (
  req: AuthenticatedRequest,
  res,
  next
) => {
  try {
    const characters = await Character.find({ owner: req.user?.id })
      .populate("owner", "email role") // Get owner details
      .lean(); // Convert to plain JS object for manipulation

    if (!characters.length) {
      res.status(404).json({ message: "No characters found for this user" });
      return;
    }

    // Function to clean `_id` from nested arrays
    const cleanNestedArray = (array: any[]) =>
      array ? array.map(({ _id, ...rest }) => rest) : [];

    // Ensure ordered structure for each character
    const orderedCharacters = characters.map((character) => ({
      _id: character._id,
      name: character.name,
      age: character.age,
      archetype: character.archetype,
      race: character.race,
      avatar: character.avatar,
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
    }));

    res.json(orderedCharacters);
  } catch (error) {
    next(error);
  }
};
