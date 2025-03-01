import { RequestHandler } from "express";
import Character from "../../models/Character.js";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware.js";

export const createCharacter: RequestHandler = async (
  req: AuthenticatedRequest,
  res,
  next
): Promise<void> => {
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

    // Ensure required RPGSystem
    if (!req.body.RPGSystem) {
      req.body.RPGSystem = "Year Zero Engine";
    }

    // Check if all predefined skills are provided
    if (!req.body.skills) {
      res
        .status(400)
        .json({ message: "Missing required skills in request body" });
      return;
    }

    for (const skill of Object.keys(skillToAttributeMap)) {
      if (
        !req.body.skills[skill] ||
        req.body.skills[skill].value === undefined
      ) {
        res.status(400).json({
          message: `Missing value for skill: ${skill}. All predefined skills require a numeric value.`,
        });
        return;
      }

      req.body.skills[skill].linkedAttribute = skillToAttributeMap[skill];
      req.body.skills[skill].displayName = skill;
    }

    // Ensure additional skills are properly structured
    if (!Array.isArray(req.body.additionalSkills)) {
      req.body.additionalSkills = [];
    } else {
      try {
        req.body.additionalSkills = req.body.additionalSkills.map(
          (skill: {
            displayName?: string;
            value?: number;
            linkedAttribute?: string;
          }) => {
            if (
              !skill.displayName ||
              skill.value === undefined ||
              !skill.linkedAttribute
            ) {
              throw new Error(
                "Each additional skill must include displayName, value, and linkedAttribute"
              );
            }
            return {
              displayName: skill.displayName,
              value: skill.value,
              linkedAttribute: skill.linkedAttribute as
                | "Strength"
                | "Agility"
                | "Wits"
                | "Empathy",
            };
          }
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        res.status(400).json({ message: errorMessage });
        return;
      }
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
