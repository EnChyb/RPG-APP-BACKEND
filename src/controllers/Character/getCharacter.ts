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
      .lean(); // Convert to plain JS object

    if (!character) {
      res.status(404).json({ message: "Character not found" });
      return;
    }

    // Clean helper to remove _id while preserving hand
    const cleanItems = (items: any[]) =>
      items?.map(({ _id, ...rest }) => rest) ?? [];

    const cleanedWeapons = character.items?.weapons?.map((weapon) => {
      const { _id, ...rest } = weapon;
      return {
        ...rest,
        hand: weapon.hand ?? (weapon.grip === 2 ? "both" : undefined), // preserve or infer 'hand'
      };
    }) ?? [];

    const orderedCharacter = {
      _id: character._id,
      name: character.name,
      age: character.age,
      archetype: character.archetype,
      race: character.race,
      avatar: character.avatar,
      RPGSystem: character.RPGSystem,
      appearance: character.appearance,
      history: character.history,
      bigDream: character.bigDream,
      owner: character.owner,

      willpower: character.willpower,
      attributes: character.attributes,
      wounds: character.wounds,
      states: character.states,

      skills: character.skills,
      additionalSkills: cleanItems(character.additionalSkills),
      talents: cleanItems(character.talents),

      items: {
        weapons: cleanedWeapons,
        armor: cleanItems(character.items?.armor),
        gears: cleanItems(character.items?.gears),
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