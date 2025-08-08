// src/controllers/Event/createEvent.ts
import { RequestHandler, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware.js";
import Event, { IEventParticipant } from "../../models/Event.js";
import Character from "../../models/Character.js";
import mongoose from "mongoose";

interface CreateEventBody {
    name: string;
    type: 'Encounter' | 'Conflict';
    roomCode: string;
    participants: Array<{
        characterId: string;
        side: 'A' | 'B';
    }>;
}

// Poprawiono sygnaturę funkcji, aby była zgodna z typem RequestHandler
export const createEvent: RequestHandler = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const { name, type, roomCode, participants: participantInputs }: CreateEventBody = req.body;
    const userId = req.user?.id;

    if (!userId) {
        // Używamy `res.status().json()` i `return`, aby zakończyć wykonanie funkcji
        res.status(401).json({ message: "Unauthorized: User not found." });
        return;
    }

    if (!name || !type || !roomCode || !participantInputs || participantInputs.length === 0) {
        res.status(400).json({ message: "Missing required fields for event creation." });
        return;
    }

    try {
        const characterIds = participantInputs.map(p => p.characterId);
        const characters = await Character.find({
            '_id': { $in: characterIds }
        }).lean();

        if (characters.length !== characterIds.length) {
            res.status(404).json({ message: "One or more characters not found." });
            return;
        }

        // Upewniamy się, że `characterId` jest typu ObjectId
        const eventParticipants: IEventParticipant[] = participantInputs.map(input => {
            const character = characters.find(c => c._id.toString() === input.characterId);
            if (!character) {
                throw new Error(`Character with id ${input.characterId} not found after initial fetch.`);
            }
            return {
                characterId: new mongoose.Types.ObjectId(character._id), // Jawna konwersja
                characterName: character.name,
                characterAvatar: character.avatar,
                characterType: character.characterType,
                ownerId: new mongoose.Types.ObjectId(character.owner), // Jawna konwersja
                side: input.side,
                status: 'Active',
            };
        });

        const newEvent = new Event({
            name,
            type,
            roomCode,
            createdBy: new mongoose.Types.ObjectId(userId),
            status: 'Pending',
            participants: eventParticipants,
        });

        await newEvent.save();

        res.status(201).json(newEvent);

    } catch (error) {
        next(error);
    }
};
