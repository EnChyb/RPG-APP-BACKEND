// src/sockets/handlers/chatHandler.ts
import { ChatMessageData, DetailedDiceData, SocketContext } from "../types.js";

export const registerChatHandlers = (ctx: SocketContext) => {
    const { socket, io } = ctx;

    socket.on("chat_message", (data: ChatMessageData) => {
        const { roomCode, userId, message } = data;
        if (socket.data.user._id.toString() !== userId) {
            socket.emit("error", { message: "Authorization error: UserId does not match" });
            return;
        }
        const messageData = { ...data, id: data.id || Math.random().toString(36).slice(2, 9) };
        console.log(`User ${userId} sent message in room ${roomCode}: ${message}`);
        io.to(roomCode).emit("chat_message", messageData);
    });

    socket.on("detailed_dice_roll", (payload: DetailedDiceData) => {
        const roomCode = socket.data.roomCode as string;
        if (!roomCode) {
            socket.emit("error", { message: "Not in any room" });
            return;
        }
        console.log(`Detailed roll by ${payload.userId} in ${roomCode}`, payload);
        io.to(roomCode).emit("detailed_dice_roll", payload);
    });
};