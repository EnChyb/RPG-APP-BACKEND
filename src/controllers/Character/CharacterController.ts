import { RequestHandler } from "express";
import Character from "../../models/Character.js";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware.js";

export const createCharacter: RequestHandler = async (
  req: AuthenticatedRequest,
  res,
  next
) => {
  try {
    const skillToAttributeMap: Record<
      string,
      "Strength" | "Agility" | "Wits" | "Empathy"
    > = {
      Craft: "Strength",
      Endure: "Strength",
      Fight: "Strength",
      Sneak: "Agility",
      Move: "Agility",
      Shoot: "Agility",
      Scout: "Wits",
      Comprehend: "Wits",
      Survive: "Wits",
      Manipulate: "Empathy",
      SenseEmotion: "Empathy",
      Heal: "Empathy",
    };

    // Ensure skills have `linkedAttribute` before saving
    if (req.body.skills) {
      Object.keys(req.body.skills).forEach((skill) => {
        if (skillToAttributeMap[skill]) {
          req.body.skills[skill].linkedAttribute = skillToAttributeMap[skill];
        }
      });
    }

    const character = new Character({ ...req.body, owner: req.user?.id });
    await character.save();
    res.status(201).json({ message: "Character created", character });
  } catch (error) {
    next(error);
  }
};

export const getCharacter: RequestHandler = async (
  req: AuthenticatedRequest,
  res,
  next
) => {
  try {
    const character = await Character.findById(req.params.id).populate(
      "owner",
      "email"
    );
    if (!character) {
      res.status(404).json({ message: "Character not found" });
      return;
    }
    res.json(character);
  } catch (error) {
    next(error);
  }
};

export const updateCharacter: RequestHandler = async (
  req: AuthenticatedRequest,
  res,
  next
) => {
  try {
    const character = await Character.findById(req.params.id);
    if (!character) {
      res.status(404).json({ message: "Character not found" });
      return;
    }

    if (character.owner.toString() !== req.user?.id) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    Object.assign(character, req.body);
    await character.save();
    res.json({ message: "Character updated", character });
  } catch (error) {
    next(error);
  }
};

export const deleteCharacter: RequestHandler = async (
  req: AuthenticatedRequest,
  res,
  next
) => {
  try {
    const character = await Character.findById(req.params.id);
    if (!character) {
      res.status(404).json({ message: "Character not found" });
      return;
    }

    if (character.owner.toString() !== req.user?.id) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    await character.deleteOne();
    res.json({ message: "Character deleted" });
  } catch (error) {
    next(error);
  }
};

export const getAllCharacters: RequestHandler = async (
  req: AuthenticatedRequest,
  res,
  next
) => {
  try {
    const characters = await Character.find({ owner: req.user?.id });
    res.json(characters);
  } catch (error) {
    next(error);
  }
};
