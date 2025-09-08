// src/controllers/Character/transferCharacter.ts
import { RequestHandler } from "express";
import Character from "../../models/Character.js";
import User from "../../models/User.js";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware.js";

interface TransferBody {
    targetEmail: string;
}

export const transferCharacter: RequestHandler = async (
    req: AuthenticatedRequest,
    res,
    next
): Promise<void> => {
    try {
        const { id } = req.params;
        const { targetEmail } = req.body as TransferBody;
        const sourceUserId = req.user?.id;

        if (!targetEmail) {
            res.status(400).json({ message: "Target user email is required" });
            return;
        }

        // 1. Znajdź docelowego użytkownika
        const targetUser = await User.findOne({ email: targetEmail });
        if (!targetUser) {
            res.status(404).json({ message: "Target user not found" });
            return;
        }

        if (targetUser._id.toString() === sourceUserId) {
            res.status(400).json({ message: "Cannot transfer character to yourself" });
            return;
        }

        // 2. Znajdź oryginalną postać
        const originalCharacter = await Character.findById(id).lean();
        if (!originalCharacter) {
            res.status(404).json({ message: "Character not found" });
            return;
        }

        // 3. Sprawdź, czy requestujący jest właścicielem
        if (originalCharacter.owner.toString() !== sourceUserId) {
            res.status(403).json({
                message: "Forbidden: You can only transfer your own characters.",
            });
            return;
        }

        // 4. Utwórz kopię, usuwając _id w bezpieczny sposób
        const { _id, ...characterDataToCopy } = originalCharacter;

        const newCharacter = new Character({
            ...characterDataToCopy,
            owner: targetUser._id, // Zmień właściciela na docelowego użytkownika
        });

        await newCharacter.save();

        res.status(201).json({
            message: "Character transferred successfully",
            newCharacter,
        });
    } catch (error) {
        next(error);
    }
};
