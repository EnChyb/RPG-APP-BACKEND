// src/sockets/utils.ts
import { SocketContext } from "./types.js";
import Event, { IEvent } from "../models/Event.js";

// --- Broadcasters ---

export const broadcastUserListUpdate = (ctx: SocketContext, roomCode: string) => {
    const roomState = ctx.gameRooms.get(roomCode);
    if (roomState) {
        const usersList = roomState.participants.map(p => ({
            id: p.userId,
            firstName: p.firstName,
            lastName: p.lastName,
            email: p.email,
            avatar: p.avatar,
            roomRole: p.roomRole,
        }));
        ctx.io.to(roomCode).emit("update_room_users", { users: usersList });
    }
};

export const broadcastActiveCards = (ctx: SocketContext, roomCode: string) => {
    const activeCards = ctx.activeCardsByRoom.get(roomCode) || new Map();
    ctx.io.to(roomCode).emit("update_active_cards", Object.fromEntries(activeCards.entries()));
};

export const broadcastActiveNpcs = (ctx: SocketContext, roomCode: string) => {
    const activeNpcs = ctx.activeNpcsByRoom.get(roomCode) || new Map();
    ctx.io.to(roomCode).emit("update_active_npcs", Object.fromEntries(activeNpcs.entries()));
};

export const broadcastActiveMonsters = (ctx: SocketContext, roomCode: string) => {
    const activeMonsters = ctx.activeMonstersByRoom.get(roomCode) || new Map();
    ctx.io.to(roomCode).emit("update_active_monsters", Object.fromEntries(activeMonsters.entries()));
};

export const broadcastEventUpdate = (ctx: SocketContext, roomCode: string) => {
    const event = ctx.activeEventByRoom.get(roomCode);
    if (event) {
        ctx.io.to(roomCode).emit("event_updated", event);
    }
};

// --- Logic Helpers ---

export const handleUserLeave = (ctx: SocketContext, roomCode: string) => {
    const roomState = ctx.gameRooms.get(roomCode);
    if (!roomState) return;

    const leavingUserId = ctx.socket.data.user?._id.toString();
    const wasRoomMaster = roomState.roomMasterId === ctx.socket.id;

    // Usuń uczestnika z listy
    roomState.participants = roomState.participants.filter(p => p.socketId !== ctx.socket.id);

    // Jeśli pokój jest pusty, usuń go
    if (roomState.participants.length === 0) {
        ctx.gameRooms.delete(roomCode);
        ctx.activeCardsByRoom.delete(roomCode);
        ctx.activeNpcsByRoom.delete(roomCode);
        ctx.activeMonstersByRoom.delete(roomCode);
        ctx.activeEventByRoom.delete(roomCode); // Clean up event too
        console.log(`Room ${roomCode} is now empty and has been closed.`);
        return;
    }

    // Jeśli MPG opuścił pokój, wybierz nowego
    if (wasRoomMaster) {
        const newMaster = roomState.participants[0];
        if (newMaster) {
            newMaster.roomRole = 'RoomMaster';
            roomState.roomMasterId = newMaster.socketId;
            console.log(`Room Master left ${roomCode}. New master is ${newMaster.userId}.`);
            ctx.io.to(roomCode).emit("new_room_master", { userId: newMaster.userId });
        }
    }

    // Usuń aktywne karty, NPC i potwory tego użytkownika
    if (leavingUserId) {
        const roomCards = ctx.activeCardsByRoom.get(roomCode);
        if (roomCards?.has(leavingUserId)) {
            roomCards.delete(leavingUserId);
            broadcastActiveCards(ctx, roomCode);
        }
        const roomNpcs = ctx.activeNpcsByRoom.get(roomCode);
        if (roomNpcs?.has(leavingUserId)) {
            roomNpcs.delete(leavingUserId);
            broadcastActiveNpcs(ctx, roomCode);
        }
        const roomMonsters = ctx.activeMonstersByRoom.get(roomCode);
        if (roomMonsters?.has(leavingUserId)) {
            roomMonsters.delete(leavingUserId);
            broadcastActiveMonsters(ctx, roomCode);
        }
    }

    // Poinformuj wszystkich o wyjściu użytkownika i zaktualizuj listę
    ctx.io.to(roomCode).emit("user_left", { userId: leavingUserId });
    broadcastUserListUpdate(ctx, roomCode);
};

export const advanceTurn = async (ctx: SocketContext, event: IEvent) => {
    let nextIndex = event.currentTurnIndex + 1;
    let isNewRound = false;

    if (nextIndex >= event.turnOrder.length) {
        event.round += 1;
        nextIndex = 0;
        isNewRound = true;

        event.participants.forEach((p) => {
            p.mainActions = 1;
            p.fastActions = 1;
        });
    }
    event.currentTurnIndex = nextIndex;

    let skippedCount = 0;
    while (skippedCount < event.turnOrder.length) {
        const currentId = event.turnOrder[event.currentTurnIndex].toString();
        const participantToCheck = event.participants.find(p => p.characterId.toString() === currentId);

        if (participantToCheck && participantToCheck.mainActions === 0 && participantToCheck.fastActions === 0) {
            if (event.currentTurnIndex === event.turnOrder.length - 1) {
                event.round += 1;
                isNewRound = true;
                event.participants.forEach(p => {
                    p.mainActions = 1;
                    p.fastActions = 1;
                });
                event.currentTurnIndex = 0;
                break;
            }

            event.currentTurnIndex = (event.currentTurnIndex + 1) % event.turnOrder.length;
            skippedCount++;
        } else {
            break;
        }
    }

    event.participants.forEach(p => p.canReact = false);

    await Event.findByIdAndUpdate(event._id, {
        round: event.round,
        currentTurnIndex: event.currentTurnIndex,
        participants: event.participants,
    });

    broadcastEventUpdate(ctx, event.roomCode);
};