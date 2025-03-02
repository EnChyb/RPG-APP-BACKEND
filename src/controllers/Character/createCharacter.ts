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

    // Automatyczne wyliczanie limitów obrażeń na podstawie atrybutów
    const { Strength, Agility, Wits, Empathy } = req.body.attributes;
    const wounds = {
      Damage: { limit: Strength.value, current: 0, displayName: "Damage" },
      Fatigue: { limit: Agility.value, current: 0, displayName: "Fatigue" },
      Confusion: { limit: Wits.value, current: 0, displayName: "Confusion" },
      Doubt: { limit: Empathy.value, current: 0, displayName: "Doubt" },
    };

    // Automatyczne ustawienie States na false
    const states = {
      Hungry: false,
      Sleepy: false,
      Thirsty: false,
      Cold: false,
    };

    // Jeśli talents nie jest podane, ustaw pustą tablicę
    const talents =
      req.body.talents && Array.isArray(req.body.talents)
        ? req.body.talents
        : [];

    // Jeśli items nie jest podane, ustaw domyślne puste sekcje
    const items = {
      Weapons: req.body.items?.Weapons ?? [],
      Armor: req.body.items?.Armor ?? [],
      Gears: req.body.items?.Gears ?? [],
    };

    const newCharacter = new Character({
      ...req.body,
      owner: req.user?.id,
      willpower: { value: 0, displayName: "Willpower" }, // Automatycznie ustawiona wartość
      wounds, // Automatycznie obliczone wounds
      states, // Automatycznie ustawione states
      talents, // Jeśli podano, zapisuje się, jeśli nie, pozostaje puste
      items, // Jeśli podano, zapisuje się, jeśli nie, pozostaje puste
      GameMaster: "",
    });

    await newCharacter.save();
    res
      .status(201)
      .json({ message: "Character created", character: newCharacter });
  } catch (error) {
    next(error);
  }
};
