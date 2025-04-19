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
        avatar: req.body.avatar, // avatar from uploadAvatar middleware
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
    if (updates.avatar) {
      character.avatar = updates.avatar;
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
        weapons: updates.items.Weapons ?? character.items.weapons,
        armor: updates.items.Armor ?? character.items.armor,
        gears: updates.items.Gears ?? character.items.gears,
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




// import { RequestHandler } from "express";
// import Character from "../../models/Character.js";
// import { AuthenticatedRequest } from "../../middlewares/authMiddleware.js";

// export const updateCharacter: RequestHandler = async (
//   req: AuthenticatedRequest,
//   res,
//   next
// ): Promise<void> => {
//   try {
//     const { id } = req.params;
//     const updates = req.body;

//     // Fetch the character from the database
//     const character = await Character.findById(id);
//     if (!character) {
//       res.status(404).json({ message: "Character not found" });
//       return;
//     }

//     // Check if the user is the Owner or Game Master
//     const isOwner = character.owner.toString() === req.user?.id;
//     const isGameMaster = character.GameMaster === req.user?.id;

//     if (!isOwner && !isGameMaster) {
//       res.status(403).json({
//         message: "Forbidden: You are not allowed to update this character.",
//       });
//       return;
//     }

//     // Fields that should NEVER be updated manually
//     const protectedFields = ["_id", "owner", "createdAt", "updatedAt"];
//     for (const field of Object.keys(updates)) {
//       if (protectedFields.includes(field)) {
//         res.status(400).json({
//           message: `Field '${field}' cannot be updated manually.`,
//         });
//         return;
//       }
//     }
//     // Handle update avatar
//     // Ustaw nowy avatar tylko, jeśli został przesłany - sprawdzić czy konieczne, czy wystarczy middleware
//     if (req.body.avatar) {
//       character.avatar = req.body.avatar;
//     }

//     // ✅ Preserve `displayName` while updating nested fields
//     if (updates.attributes) {
//       character.attributes = {
//         ...character.attributes, // Preserve existing
//         ...updates.attributes, // Apply new updates
//       };
//     }

//     if (updates.skills) {
//       character.skills = {
//         ...character.skills,
//         ...updates.skills,
//       };
//     }

//     if (updates.wounds) {
//       for (const woundType of Object.keys(updates.wounds) as Array<
//         keyof typeof character.wounds
//       >) {
//         if (character.wounds[woundType]) {
//           character.wounds[woundType] = {
//             ...character.wounds[woundType], // Preserve displayName
//             ...updates.wounds[woundType], // Apply new value
//           };
//         }
//       }
//     }

//     if (updates.states) {
//       character.states = {
//         ...character.states,
//         ...updates.states,
//       };
//     }

//     if (updates.items) {
//       character.items = {
//         Weapons: updates.items.Weapons || character.items.Weapons,
//         Armor: updates.items.Armor || character.items.Armor,
//         Gears: updates.items.Gears || character.items.Gears,
//       };
//     }

//     //ZOSTAWIAM FRAGMENT DO PRZEMYŚLENIA, CZY NIE MOŻNA ZASTĄPIĆ LINIJEK 48-89
//     //TYM FRAGMENTEM KODU:
//     // const updatableFields = [
//     //   "attributes",
//     //   "skills",
//     //   "wounds",
//     //   "states",
//     //   "items",
//     // ];
//     // updatableFields.forEach((field) => {
//     //   if (updates[field]) {
//     //     character[field] = {
//     //       ...character[field],
//     //       ...updates[field],
//     //     };
//     //   }
//     // });

//     // ✅ Save and return the updated character
//     await character.save();

//     // ✅ Structuring response to maintain correct order
//     const formattedResponse = {
//       message: "Character updated successfully",
//       character: {
//         _id: character._id,
//         name: character.name,
//         age: character.age,
//         archetype: character.archetype,
//         race: character.race,
//         RPGSystem: character.RPGSystem,
//         appearance: character.appearance,
//         bigDream: character.bigDream,
//         willpower: character.willpower,
//         attributes: character.attributes,
//         wounds: character.wounds,
//         states: character.states,
//         skills: character.skills,
//         additionalSkills: character.additionalSkills,
//         talents: character.talents,
//         items: character.items,
//         GameMaster: character.GameMaster,
//         owner: character.owner,
//         createdAt: character.createdAt,
//         updatedAt: character.updatedAt,
//         __v: character.__v,
//       },
//     };

//     res.json(formattedResponse);
//   } catch (error) {
//     next(error);
//   }
// };
