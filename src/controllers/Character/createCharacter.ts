import { RequestHandler, Response, NextFunction } from "express";
import Character from "../../models/Character.js";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware.js";

const DEFAULT_AVATAR = "https://avatars-user-bucket.s3.eu-north-1.amazonaws.com/uploads/1745061241749-8bd8af78-47d2-4162-8b7e-07e4b0fc7561.jpg";

export const createCharacter: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {

    if (req.body.data) {
      const parsedData = JSON.parse(req.body.data);
      req.body = {
        ...parsedData,
        avatar: req.body.avatar, // this will come from uploadAvatar middleware
      };
    }

    // const characterAge = req.body.age || { en: "Adult", pl: "Dorosły" };

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
        req.body.skills[skill] = {
          value: 0,
          linkedAttribute: skillToAttributeMap[skill],
          displayName: skill,
        };
      } else {
        req.body.skills[skill].linkedAttribute = skillToAttributeMap[skill];
        req.body.skills[skill].displayName = skill;
      }
    }

    const wounds = {
      Damage: { current: 0, displayName: "Damage" },
      Fatigue: { current: 0, displayName: "Fatigue" },
      Confusion: { current: 0, displayName: "Confusion" },
      Doubt: { current: 0, displayName: "Doubt" },
    };

    // Automatyczne ustawienie States na false
    const states = {
      Hungry: false,
      Sleepy: false,
      Thirsty: false,
      Cold: false,
    };

    // Jeśli talents nie jest podane, ustaw pustą tablicę
    const talents = Array.isArray(req.body.talents) ? req.body.talents : [];

    // Jeśli items nie jest podane, ustaw domyślne puste sekcje
    const items = {
      weapons: req.body.items?.weapons ?? [],
      armor: req.body.items?.armor?.filter(Boolean) ?? [],
      gears: req.body.items?.gear?.filter(Boolean) ?? [],
    };

    // Ustaw domyślny avatar, jeśli brak przesłanego
    const characterAvatar = req.body.avatar || DEFAULT_AVATAR;

    const newCharacter = new Character({
      ...req.body,
      owner: req.user?.id,
      avatar: characterAvatar, // pobierze avatar z middleware jeśli zostanie załadowany i nie nadpisze avatara usera, tylko przypisze do character,
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
