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

    // ✅ Parse JSON data if using FormData
    if (req.body.data) {
      const parsedData = JSON.parse(req.body.data);
      req.body = {
        ...parsedData,
        avatar: req.body.avatar || parsedData.avatar, // avatar from uploadAvatar middleware
      };
    }

    const updates = req.body;

    const character = await Character.findById(id);
    if (!character) {
      res.status(404).json({ message: "Character not found" });
      return;
    }

    const isOwner = character.owner.toString() === req.user?.id;
    const isGameMaster = character.GameMaster === req.user?.id;

    if (!isOwner && !isGameMaster) {
      res.status(403).json({
        message: "Forbidden: You are not allowed to update this character.",
      });
      return;
    }

    // Block protected fields
    const protectedFields = ["_id", "owner", "createdAt", "updatedAt"];
    for (const field of Object.keys(updates)) {
      if (protectedFields.includes(field)) {
        res.status(400).json({
          message: `Field '${field}' cannot be updated manually.`,
        });
        return;
      }
    }

    // ✅ Update avatar only if provided (from middleware)
    // if (updates.avatar) {
    //   character.avatar = updates.avatar;
    // }

    // ✅ Handle avatar from middleware or direct URL
if (updates.avatar) {
  if (typeof updates.avatar === "string") {
    // validate the URL format
    const isValidUrl = /^https:\/\/.*\.(jpeg|jpg|png)$/.test(updates.avatar);
    if (!isValidUrl) {
      res.status(400).json({ message: "Invalid avatar URL format." });
      return;
    }

    character.avatar = updates.avatar;
  } else {
    res.status(400).json({ message: "Avatar must be a URL string." });
    return;
  }
}


    // ✅ Simple fields
    if (updates.name) character.name = updates.name;
    if (updates.age) character.age = updates.age;
    if (updates.archetype) character.archetype = updates.archetype;
    if (updates.race) character.race = updates.race;
    if (updates.appearance) character.appearance = updates.appearance;
    if (updates.bigDream) character.bigDream = updates.bigDream;

    // ✅ Preserve displayName where needed
    if (updates.attributes) {
      character.attributes = {
        ...character.attributes,
        ...updates.attributes,
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
            ...character.wounds[woundType],
            ...updates.wounds[woundType],
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
        weapons: updates.items.weapons ?? character.items.weapons,
        armor: updates.items.armor ?? character.items.armor,
        gears: updates.items.gears ?? character.items.gears,
      };
    }

    await character.save();

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
        avatar: character.avatar, // ✅ included in response
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