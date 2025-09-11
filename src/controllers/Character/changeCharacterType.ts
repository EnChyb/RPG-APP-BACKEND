// src/controllers/Character/changeCharacterType.ts
import { RequestHandler } from "express";
import Character from "../../models/Character.js";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware.js";

interface ChangeTypeBody {
    newType: "Hero" | "NPC" | "Monster";
    race?: string;
    archetype?: string;
    species?: string;
}

export const changeCharacterType: RequestHandler = async (
    req: AuthenticatedRequest,
    res,
    next
): Promise<void> => {
    try {
        const { id } = req.params;
        const { newType, race, archetype, species } = req.body as ChangeTypeBody;
        const userId = req.user?.id;

        const character = await Character.findById(id);

        if (!character) {
            res.status(404).json({ message: "Character not found" });
            return;
        }

        if (character.owner.toString() !== userId) {
            res.status(403).json({ message: "Forbidden: Not your character" });
            return;
        }

        character.characterType = newType;

        // Logika czyszczenia pól w zależności od nowego typu
        if (newType === "Monster") {
            if (!species) {
                res.status(400).json({ message: "Species is required for Monster type" });
                return;
            }
            character.species = species;
            character.race = undefined;
            character.archetype = undefined;
            character.age = undefined;
        } else { // zmiana na Hero lub NPC
            if (!race || !archetype) {
                res.status(400).json({ message: "Race and Archetype are required for Hero/NPC type" });
                return;
            }
            character.race = race;
            character.archetype = archetype;
            character.species = undefined;
            if (!character.age) { // Ustaw domyślny wiek, jeśli nie istnieje
                character.age = { en: "Adult", pl: "Dorosły" };
            }
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

