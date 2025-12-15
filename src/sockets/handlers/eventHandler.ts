// src/sockets/handlers/eventHandler.ts
import Event from "../../models/Event.js";
import Character from "../../models/Character.js";
import {
    StartEventData,
    SubmitInitiativeData,
    UseActionPayload,
    EndMyTurnPayload,
    SocketContext
} from "../types.js";
import { advanceTurn, broadcastEventUpdate } from "../utils.js";

export const registerEventHandlers = (ctx: SocketContext) => {
    const { socket, io, activeEventByRoom, gameRooms } = ctx;

    socket.on("start_event", async (data: StartEventData) => {
        const { roomCode, event } = data;
        const roomState = gameRooms.get(roomCode);

        if (!roomState || roomState.roomMasterId !== socket.id) {
            return socket.emit("error", { message: "Only the Room Master can start an event." });
        }

        activeEventByRoom.set(roomCode, event);
        console.log(`Event "${event.name}" started in room ${roomCode}`);

        io.to(roomCode).emit("event_started", event);

        if (event.type === 'Conflict') {
            io.to(roomCode).emit("request_initiative_roll", { eventId: event._id });
        }
    });

    socket.on("submit_initiative", async (data: SubmitInitiativeData) => {
        const { roomCode, eventId, characterId, initiative } = data;
        const event = activeEventByRoom.get(roomCode);

        if (!event || event._id.toString() !== eventId) return;

        const participant = event.participants.find(p => p.characterId.toString() === characterId);
        if (participant) {
            participant.initiative = initiative;
        }

        const allHaveRolled = event.participants.every(p => typeof p.initiative === 'number');

        if (allHaveRolled) {
            console.log(`All participants have rolled initiative for event ${eventId}. Sorting...`);
            const charIds = event.participants.map(p => p.characterId);
            const characters = await Character.find({ '_id': { $in: charIds } }).lean();

            const statsMap = new Map(characters.map(c => [
                c._id.toString(),
                {
                    move: c.skills.Move?.value ?? 0,
                    agility: c.attributes.Agility.value,
                    type: c.characterType,
                }
            ]));

            event.participants.sort((a, b) => {
                const initiativeDiff = (a.initiative ?? 99) - (b.initiative ?? 99);
                if (initiativeDiff !== 0) return initiativeDiff;

                const statsA = statsMap.get(a.characterId.toString());
                const statsB = statsMap.get(b.characterId.toString());
                if (!statsA || !statsB) return 0;

                const moveDiff = statsB.move - statsA.move;
                if (moveDiff !== 0) return moveDiff;

                const agilityDiff = statsB.agility - statsA.agility;
                if (agilityDiff !== 0) return agilityDiff;

                const typeOrder = { 'Hero': 1, 'NPC': 2, 'Monster': 3 };
                const typeDiff = (typeOrder[statsA.type] || 2) - (typeOrder[statsB.type] || 2);
                if (typeDiff !== 0) return typeDiff;

                return Math.random() - 0.5;
            });

            event.turnOrder = event.participants.map(p => p.characterId);
            event.currentTurnIndex = 0;
            event.status = 'Active';

            console.log(`Turn order established:`, event.turnOrder.map(id => id.toString()));

            await Event.findByIdAndUpdate(eventId, {
                participants: event.participants,
                turnOrder: event.turnOrder,
                status: 'Active'
            });
        }
        broadcastEventUpdate(ctx, roomCode);
    });

    socket.on("request_next_round", async (data: { roomCode: string }) => {
        const { roomCode } = data;
        const event = activeEventByRoom.get(roomCode);
        const roomState = gameRooms.get(roomCode);
        if (!event || !roomState || roomState.roomMasterId !== socket.id) return;
        await advanceTurn(ctx, event);
    });

    socket.on("end_my_turn", async (data: EndMyTurnPayload) => {
        const { roomCode, eventId, characterId } = data;
        const event = activeEventByRoom.get(roomCode);
        if (!event || event._id.toString() !== eventId) return;

        const activeId = event.turnOrder[event.currentTurnIndex].toString();
        if (activeId !== characterId) {
            return socket.emit("error", { message: "Not your turn." });
        }
        await advanceTurn(ctx, event);
    });

    socket.on("use_action", async (data: UseActionPayload) => {
        const { roomCode, eventId, characterId, actionType, isReaction } = data;
        const event = activeEventByRoom.get(roomCode);
        if (!event || event._id.toString() !== eventId) return;

        const participant = event.participants.find(p => p.characterId.toString() === characterId);
        if (!participant) return;

        if (actionType === 'main' && participant.mainActions > 0) {
            participant.mainActions--;
        } else if (actionType === 'fast' && participant.fastActions > 0) {
            participant.fastActions--;
        } else if (actionType === 'special' && participant.specialActions > 0) {
            participant.specialActions--;
        }

        const isCurrentTurn = event.turnOrder[event.currentTurnIndex].toString() === characterId;
        const isOutOfActions = participant.mainActions === 0 && participant.fastActions === 0;
        const reactionIsPending = event.participants.some(p => p.canReact && p.characterId.toString() !== characterId);

        if (isCurrentTurn && !isReaction && isOutOfActions && !reactionIsPending) {
            await advanceTurn(ctx, event);
        } else {
            await Event.findByIdAndUpdate(eventId, { participants: event.participants });
            broadcastEventUpdate(ctx, roomCode);
        }
    });

    socket.on("request_next_turn", async (data: { roomCode: string }) => {
        const { roomCode } = data;
        const event = activeEventByRoom.get(roomCode);
        const roomState = gameRooms.get(roomCode);
        if (!event || !roomState || roomState.roomMasterId !== socket.id) return;

        event.turn += 1;
        event.round = 1;
        event.currentTurnIndex = 0;

        event.participants.forEach(p => {
            p.mainActions = 1;
            p.fastActions = 1;
            p.specialActions = 0;
            p.canReact = false;
        });

        await Event.findByIdAndUpdate(event._id, {
            turn: event.turn,
            round: event.round,
            currentTurnIndex: event.currentTurnIndex,
            participants: event.participants,
        });

        broadcastEventUpdate(ctx, roomCode);
    });

    socket.on("end_event", async (data: { roomCode: string }) => {
        const { roomCode } = data;
        const event = activeEventByRoom.get(roomCode);
        const roomState = gameRooms.get(roomCode);

        if (!event || !roomState || roomState.roomMasterId !== socket.id) return;

        await Event.findByIdAndUpdate(event._id, { status: 'Resolved' });
        activeEventByRoom.delete(roomCode);

        io.to(roomCode).emit("event_ended", { eventId: event._id.toString() });
        console.log(`Event "${event.name}" ended in room ${roomCode}`);
    });
};