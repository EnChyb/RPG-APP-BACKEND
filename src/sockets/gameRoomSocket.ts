// src/sockets/gameRoomSocket.ts
import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { socketAuthMiddleware } from "../middlewares/socketAuthMiddleware.js";
import { GameRoomState, HeroCardFull, SocketContext } from "./types.js";
import { IEvent } from "../models/Event.js";

// Handlers Import
import { registerRoomHandlers } from "./handlers/roomHandler.js";
import { registerChatHandlers } from "./handlers/chatHandler.js";
import { registerCardHandlers } from "./handlers/cardHandler.js";
import { registerEventHandlers } from "./handlers/eventHandler.js";
import { registerCombatHandlers } from "./handlers/combatHandler.js";

export function initGameRoomSocket(server: HttpServer) {
    const io = new Server(server, {
        cors: {
            origin: [
                "http://localhost:5173",
                "http://localhost:8081",
                "http://localhost:3000",
            ],
            methods: ["GET", "POST", "PATCH", "DELETE"],
        },
    });

    // In-memory storage
    const gameRooms: Map<string, GameRoomState> = new Map();
    const activeCardsByRoom: Map<string, Map<string, HeroCardFull[]>> = new Map();
    const activeNpcsByRoom: Map<string, Map<string, HeroCardFull[]>> = new Map();
    const activeMonstersByRoom: Map<string, Map<string, HeroCardFull[]>> = new Map();
    const activeEventByRoom: Map<string, IEvent> = new Map();

    io.use(socketAuthMiddleware);

    io.on("connection", (socket: Socket) => {
        console.log("Nowe połączenie socket: ", socket.id);

        const context: SocketContext = {
            io,
            socket,
            gameRooms,
            activeCardsByRoom,
            activeNpcsByRoom,
            activeMonstersByRoom,
            activeEventByRoom
        };

        // Register handlers
        registerRoomHandlers(context);
        registerChatHandlers(context);
        registerCardHandlers(context);
        registerEventHandlers(context);
        registerCombatHandlers(context);
    });

    return io;
}
