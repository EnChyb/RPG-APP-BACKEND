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

    if (!req.body.RPGSystem) req.body.RPGSystem = "Year Zero Engine";
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
        res.status(400).json({ message: `Missing value for skill: ${skill}.` });
        return;
      }
      req.body.skills[skill].linkedAttribute = skillToAttributeMap[skill];
      req.body.skills[skill].displayName = skill;
    }

    const { Strength, Agility, Wits, Empathy } = req.body.attributes;
    req.body.wounds = {
      Damage: { limit: Strength.value, current: 0, displayName: "Damage" },
      Fatigue: { limit: Agility.value, current: 0, displayName: "Fatigue" },
      Confusion: { limit: Wits.value, current: 0, displayName: "Confusion" },
      Doubt: { limit: Empathy.value, current: 0, displayName: "Doubt" },
    };

    req.body.states = {
      Hungry: false,
      Sleepy: false,
      Thirsty: false,
      Cold: false,
    };

    const character = new Character({ ...req.body, owner: req.user?.id });
    await character.save();
    res.status(201).json({ message: "Character created", character });
  } catch (error) {
    next(error);
  }
};
