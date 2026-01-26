// src/sockets/handlers/combatHandler.ts
import Character from "../../models/Character.js";
import Event from "../../models/Event.js";
import {
    DeclareAttackPayload,
    IncomingAttackPayload,
    ResolveDefensePayload,
    SocketContext,
    WaiveReactionPayload
} from "../types.js";
import { broadcastEventUpdate, advanceTurn } from "../utils.js";

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

        const attackerCharacter = await Character.findById(attackerId).select('avatar').lean();

        const alertPayload: IncomingAttackPayload = {
            ...data,
            attackerName: attackerPart.characterName,
            attackerAvatar: attackerCharacter?.avatar || ""
        };

        io.to(roomCode).emit("incoming_attack_alert", alertPayload);

        console.log(`Attack declared in ${roomCode}: ${attackerPart.characterName} -> ${targetPart.characterName} (${hits} hits, location: ${hitLocation})`);
    });

    // HANDLER: Obsługa wyniku obrony
    socket.on("resolve_defense", async (data: ResolveDefensePayload) => {
        const { roomCode, eventId, defenderId, attackerId, outcome } = data;
        const event = activeEventByRoom.get(roomCode);

        if (!event || event._id.toString() !== eventId) return;

        const defenderPart = event.participants.find(p => p.characterId.toString() === defenderId);
        const attackerPart = event.participants.find(p => p.characterId.toString() === attackerId);

        if (!defenderPart || !attackerPart) {
            console.error(`Resolve Defense Error: Participants not found in room ${roomCode}`);
            return;
        }

        defenderPart.canReact = false;
        await Event.findByIdAndUpdate(eventId, { participants: event.participants });
        broadcastEventUpdate(ctx, roomCode);

        // Rozgłoszenie wyniku do pokoju (dzięki temu atakujący otrzyma dane i zaktualizuje swój modal)
        io.to(roomCode).emit("defense_resolved", {
            defenderId,
            attackerId,
            outcome
        });

        console.log(`Defense resolved in ${roomCode}: ${defenderPart.characterName} vs ${attackerPart.characterName}. Damage taken: ${outcome.damageTaken}`);

        // --- Automatyczne zakończenie tury po walce ---
        // Sprawdzamy, czy to tura atakującego i czy skończyły mu się akcje
        const currentTurnCharId = event.turnOrder[event.currentTurnIndex].toString();

        if (currentTurnCharId === attackerId) {
            const isOutOfActions = attackerPart.mainActions === 0 && attackerPart.fastActions === 0;
            // Sprawdzamy też, czy nie ma innych wiszących reakcji (rzadkie, ale możliwe w multi-ataku)
            const reactionIsPending = event.participants.some(p => p.canReact && p.characterId.toString() !== attackerId);

            if (isOutOfActions && !reactionIsPending) {
                console.log(`Attacker ${attackerPart.characterName} is out of actions after combat. Advancing turn...`);
                // Opóźnienie 5 sekund, aby gracze zdążyli zobaczyć wynik w modalu
                setTimeout(async () => {
                    // Pobieramy event ponownie, żeby mieć pewność co do aktualnego stanu
                    const currentEvent = activeEventByRoom.get(roomCode);
                    if (currentEvent && currentEvent._id.toString() === eventId) {
                        await advanceTurn(ctx, currentEvent);
                    }
                }, 5000);
            }
        }
    });
};