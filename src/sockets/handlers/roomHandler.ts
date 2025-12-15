// src/sockets/handlers/roomHandler.ts
import { JoinRoomData, RoomParticipant, GameRoomState, SocketContext } from "../types.js";
import {
    broadcastUserListUpdate,
    broadcastActiveCards,
    broadcastActiveNpcs,
    broadcastActiveMonsters,
    handleUserLeave
} from "../utils.js";

export const registerRoomHandlers = (ctx: SocketContext) => {
    const { socket, io, gameRooms, activeCardsByRoom, activeNpcsByRoom, activeMonstersByRoom } = ctx;

    socket.on("join_room", (data: JoinRoomData) => {
        const { roomCode, userId } = data;

        if (socket.data.user._id.toString() !== userId) {
            socket.emit("error", { message: "Authorization error: UserId does not match" });
            return;
        }

        const roomCodePattern = /^.+-KOD:\d{5}-\d{6}$/;
        if (!roomCodePattern.test(roomCode)) {
            socket.emit("error", { message: "Incorrect room code format" });
            return;
        }

        socket.join(roomCode);
        socket.data.roomCode = roomCode;

        const newParticipant: RoomParticipant = {
            socketId: socket.id,
            userId: socket.data.user._id.toString(),
            firstName: socket.data.user.firstName,
            lastName: socket.data.user.lastName,
            email: socket.data.user.email,
            avatar: socket.data.user.avatar,
            roomRole: 'Participant',
        };

        if (!activeCardsByRoom.has(roomCode)) activeCardsByRoom.set(roomCode, new Map());
        if (!activeNpcsByRoom.has(roomCode)) activeNpcsByRoom.set(roomCode, new Map());
        if (!activeMonstersByRoom.has(roomCode)) activeMonstersByRoom.set(roomCode, new Map());

        let roomState = gameRooms.get(roomCode);

        if (!roomState) {
            newParticipant.roomRole = 'RoomMaster';
            const newRoomState: GameRoomState = {
                roomMasterId: socket.id,
                participants: [newParticipant],
            };
            gameRooms.set(roomCode, newRoomState);
            console.log(`User ${userId} created room ${roomCode} and is now RoomMaster.`);
            socket.emit("room_created", { roomCode });
        } else {
            if (!roomState.participants.some(p => p.userId === userId)) {
                roomState.participants.push(newParticipant);
            }
            console.log(`User ${userId} joined room ${roomCode} as a Participant.`);
            socket.emit("room_joined", { roomCode });
        }

        broadcastUserListUpdate(ctx, roomCode);
        broadcastActiveCards(ctx, roomCode);
        broadcastActiveNpcs(ctx, roomCode);
        broadcastActiveMonsters(ctx, roomCode);
    });

    socket.on("transfer_room_master", (data: { roomCode: string, newMasterUserId: string }) => {
        const { roomCode, newMasterUserId } = data;
        const roomState = gameRooms.get(roomCode);

        if (!roomState || roomState.roomMasterId !== socket.id) {
            socket.emit("error", { message: "Only the Room Master can transfer the role." });
            return;
        }

        const oldMaster = roomState.participants.find(p => p.socketId === socket.id);
        const newMaster = roomState.participants.find(p => p.userId === newMasterUserId);

        if (!newMaster || !oldMaster || oldMaster === newMaster) {
            socket.emit("error", { message: "Invalid user to transfer role to." });
            return;
        }
        oldMaster.roomRole = 'Participant';
        newMaster.roomRole = 'RoomMaster';
        roomState.roomMasterId = newMaster.socketId;

        console.log(`Room Master role in ${roomCode} transferred from ${oldMaster.userId} to ${newMaster.userId}`);
        io.to(roomCode).emit("new_room_master", { userId: newMaster.userId });
        broadcastUserListUpdate(ctx, roomCode);
    });

    socket.on("leave_room", (data: { roomCode: string; userId: string }) => {
        const { roomCode, userId } = data;
        if (socket.data.user._id.toString() !== userId) {
            socket.emit("error", { message: "Authorization error: UserId does not match" });
            return;
        }
        handleUserLeave(ctx, roomCode);
        socket.leave(roomCode);
    });

    socket.on("delete_room", (data: { roomCode: string }) => {
        const { roomCode } = data;
        const roomState = gameRooms.get(roomCode);

        if (!roomState || roomState.roomMasterId !== socket.id) {
            socket.emit("error", { message: "Only the Room Master can delete the room." });
            return;
        }

        io.to(roomCode).emit("room_deleted");
        const clients = Array.from(io.sockets.adapter.rooms.get(roomCode) || []);
        clients.forEach(clientId => {
            const clientSocket = io.sockets.sockets.get(clientId);
            clientSocket?.leave(roomCode);
        });

        gameRooms.delete(roomCode);
        activeCardsByRoom.delete(roomCode);
        activeNpcsByRoom.delete(roomCode);
        activeMonstersByRoom.delete(roomCode);
        ctx.activeEventByRoom.delete(roomCode);

        console.log(`Room ${roomCode} deleted by Room Master.`);
    });

    socket.on("disconnect", () => {
        console.log("Socket disconnected: ", socket.id);
        socket.rooms.forEach(roomCode => {
            if (roomCode !== socket.id) {
                handleUserLeave(ctx, roomCode);
            }
        });
    });
};