import { RequestHandler } from "express";
import Character from "../../models/Character.js";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware.js";
import {ISkill} from "../../models/Character.js";

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
    console.log("🔵 Incoming updates:", JSON.stringify(updates, null, 2));

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
    const protectedFields = ["_id", "owner", "createdAt", "updatedAt", "age", "race", "archetype"];
    for (const field of Object.keys(updates)) {
      if (protectedFields.includes(field)) {
        res.status(400).json({
          message: `Field '${field}' cannot be updated manually.`,
        });
        return;
      }
    }

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
    if (updates.appearance) character.appearance = updates.appearance;
    if (updates.bigDream) character.bigDream = updates.bigDream;
    if (updates.history) character.history = updates.history;
    if (updates.gold) character.gold = updates.gold;
    if (updates.characterLevel) character.characterLevel = updates.characterLevel;
    if (updates.experiencePoints) character.experiencePoints = updates.experiencePoints;

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

    if (updates.additionalSkills && Array.isArray(updates.additionalSkills)) {
      const existingSkills = character.additionalSkills || [];
    
      const merged = updates.additionalSkills.map((newSkill: ISkill) => {
        const existing = existingSkills.find(
          (s: ISkill) => s.displayName.trim() === newSkill.displayName.trim()
        );
        return existing ? { ...existing, ...newSkill } : newSkill;
      });
    
      const unchanged = existingSkills.filter(
        (s: ISkill) =>
          !updates.additionalSkills.some(
            (u: ISkill) => u.displayName.trim() === s.displayName.trim()
          )
      );
    
      character.additionalSkills = [...unchanged, ...merged];
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
        weapons: Array.isArray(updates.items.weapons) && updates.items.weapons.length > 0
          ? updates.items.weapons
          : character.items.weapons,
        armor: Array.isArray(updates.items.armor) && updates.items.armor.length > 0
          ? updates.items.armor
          : character.items.armor,
        gears: Array.isArray(updates.items.gears) && updates.items.gears.length > 0
          ? updates.items.gears
          : character.items.gears,
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
        history: character.history,
        avatar: character.avatar, // ✅ included in response
        gold: character.gold,
        characterLevel: character.characterLevel,
        experiencePoints: character.experiencePoints,
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
  } catch (error: any) {
    console.error("🔴 Error updating character:", error);
    console.error("🔴 Full error object:", JSON.stringify(error, null, 2));
  
    if (error.name === "ValidationError") {
      // Mongoose ValidationError (e.g. missing required field, wrong format, etc.)
      res.status(400).json({
        message: "Validation failed.",
        errors: error.errors, // show exactly which fields failed
      });
    }
  
    if (error.name === "CastError") {
      // E.g. invalid ObjectId format
      res.status(400).json({
        message: "Invalid ID format.",
      });
    }
  
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message || "Something went wrong",
    });
  }
};