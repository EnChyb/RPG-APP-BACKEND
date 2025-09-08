// src/controllers/Character/changeCharacterType.ts
import { RequestHandler } from "express";
import Character from "../../models/Character.js";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware.js";

interface ChangeTypeBody {
    characterType: "Hero" | "NPC" | "Monster";
}

export const changeCharacterType: RequestHandler = async (
    req: AuthenticatedRequest,
    res,
    next
): Promise<void> => {
    try {
        const { id } = req.params;
        const { characterType } = req.body as ChangeTypeBody;

        if (!characterType || !["Hero", "NPC", "Monster"].includes(characterType)) {
            res.status(400).json({ message: "Invalid or missing characterType" });
            return;
        }

        const character = await Character.findById(id);

        if (!character) {
            res.status(404).json({ message: "Character not found" });
            return;
        }

        if (character.owner.toString() !== req.user?.id) {
            res.status(403).json({
                message: "Forbidden: You are not allowed to modify this character.",
            });
            return;
        }

        character.characterType = characterType;

        // Logika czyszczenia pól w zależności od nowego typu
        if (characterType === "Monster") {
            character.archetype = undefined;
            character.race = undefined;
            character.age = undefined;
        } else {
            character.species = undefined;
        }

        await character.save();

        res.json({
            message: "Character type updated successfully",
            character,
        });
    } catch (error) {
        next(error);
    }
};

