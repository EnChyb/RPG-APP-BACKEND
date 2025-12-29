// src/sockets/handlers/combatHandler.ts
import Character from "../../models/Character.js";
import Event from "../../models/Event.js";
import {
    DeclareAttackPayload,
    IncomingAttackPayload,
    SocketContext,
    WaiveReactionPayload
} from "../types.js";
import { broadcastEventUpdate } from "../utils.js";

export const registerCombatHandlers = (ctx: SocketContext) => {
    const { socket, io, activeEventByRoom } = ctx;

    socket.on("select_targets_for_reaction", async (data: { roomCode: string; eventId: string; targetCharacterIds: string[] }) => {
        const { roomCode, eventId, targetCharacterIds } = data;
        const event = activeEventByRoom.get(roomCode);

        if (!event || event._id.toString() !== eventId) return;

        event.participants.forEach(p => {
            p.canReact = targetCharacterIds.includes(p.characterId.toString());
        });

        broadcastEventUpdate(ctx, roomCode);
    });

    socket.on("waive_reaction", async (data: WaiveReactionPayload) => {
        const { roomCode, eventId, characterId } = data;
        const event = activeEventByRoom.get(roomCode);

        if (!event || event._id.toString() !== eventId) return;

        const participant = event.participants.find(p => p.characterId.toString() === characterId);

        if (participant && participant.canReact) {
            participant.canReact = false;

            await Event.findByIdAndUpdate(eventId, { participants: event.participants });
            broadcastEventUpdate(ctx, roomCode);

            io.to(roomCode).emit("reaction_waived_notification", {
                characterName: participant.characterName
            });
        }
    });

    socket.on("declare_attack", async (data: DeclareAttackPayload) => {
        const { roomCode, eventId, attackerId, targetId, hits, hitLocation } = data;
        const event = activeEventByRoom.get(roomCode);

        if (!event || event._id.toString() !== eventId) return;

        const attackerPart = event.participants.find(p => p.characterId.toString() === attackerId);
        const targetPart = event.participants.find(p => p.characterId.toString() === targetId);

        if (!attackerPart || !targetPart) {
            socket.emit("error", { message: "Attacker or Target not found in event" });
            return;
        }

        targetPart.canReact = true;

        await Event.findByIdAndUpdate(eventId, { participants: event.participants });
        broadcastEventUpdate(ctx, roomCode);

        // Pobranie avatara z bazy danych
        const attackerCharacter = await Character.findById(attackerId).select('avatar').lean();

        const alertPayload: IncomingAttackPayload = {
            ...data,
            attackerName: attackerPart.characterName,
            attackerAvatar: attackerCharacter?.avatar || ""
        };

        io.to(roomCode).emit("incoming_attack_alert", alertPayload);

        console.log(`Attack declared in ${roomCode}: ${attackerPart.characterName} -> ${targetPart.characterName} (${hits} hits, location: ${hitLocation})`);
    });
};