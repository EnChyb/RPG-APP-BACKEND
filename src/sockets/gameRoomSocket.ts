// src/sockets/gameRoomSocket.ts
import { Server, Socket } from "socket.io";
import { socketAuthMiddleware } from "../middlewares/socketAuthMiddleware.js";

interface JoinRoomData {
    roomCode: string;
    userId: string;
    characterId?: string;
    isGM?: boolean;
}

interface RollDiceData {
    roomCode: string;
    dice: string; // np. "d6", "d20"
    hidden?: boolean;
    userId: string;
}

export function initGameRoomSocket(server: any) {
    const io = new Server(server, {
        cors: {
            origin: ["http://localhost:5173", "http://localhost:3000"],
            methods: ["GET", "POST"],
        },
    });

    // Mapa przechowująca informacje, który socket pełni rolę GM w danym pokoju
    const roomGMs: Map<string, string> = new Map();

    // Używamy middleware autoryzacji – wywołuje socketAuthMiddleware z katalogu middlewares
    io.use(socketAuthMiddleware);

    io.on("connection", (socket: Socket) => {
        console.log("Nowe połączenie socket: ", socket.id);

        socket.on("join_room", (data: JoinRoomData) => {
            const { roomCode, userId, characterId, isGM } = data;

            // Weryfikujemy, czy userId z eventu zgadza się z danymi z tokena
            if (socket.data.user._id.toString() !== userId) {
                socket.emit("error", { message: "Authorization error: UserId does not match" });
                return;
            }

            // Walidacja formatu kodu pokoju (np. "NazwaGry-KOD:12345-123456")
            const roomCodePattern = /^.+-KOD:\d{5}-\d{6}$/;
            if (!roomCodePattern.test(roomCode)) {
                socket.emit("error", { message: "Incorrect room code format" });
                return;
            }

            if (isGM) {
                // GM tworzy pokój – zapisujemy socket.id dla danego pokoju
                roomGMs.set(roomCode, socket.id);
                socket.join(roomCode);
                console.log(`GM (user ${userId}) created a room ${roomCode}`);
                socket.emit("room_created", { roomCode });
            } else {
                // Gracz próbuje dołączyć – najpierw sprawdzamy, czy pokój istnieje
                if (!roomGMs.has(roomCode)) {
                    socket.emit("error", { message: "Room does not exist or GM is not connected" });
                    return;
                }
                socket.join(roomCode);
                console.log(`Player ${userId} joined the room ${roomCode}`);
                socket.emit("room_joined", { roomCode });
                // Informujemy innych uczestników pokoju
                socket.to(roomCode).emit("user_joined", { userId, characterId });
            }
        });

        socket.on("roll_dice", (data: RollDiceData) => {
            const { roomCode, dice, hidden, userId } = data;

            if (socket.data.user._id.toString() !== userId) {
                socket.emit("error", { message: "Authorization error: UserId does not match" });
                return;
            }

            const sides = parseInt(dice.substring(1));
            if (isNaN(sides) || sides <= 0) {
                socket.emit("error", { message: "Incorrect dice format" });
                return;
            }
            const result = Math.floor(Math.random() * sides) + 1;
            console.log(`User ${userId} roll ${dice} and obtained ${result} in the room ${roomCode}`);

            if (hidden) {
                const gmSocketId = roomGMs.get(roomCode);
                if (gmSocketId) {
                    io.to(gmSocketId).emit("dice_result_hidden", { userId, dice, result });
                } else {
                    socket.emit("error", { message: "No GM in the room" });
                }
            } else {
                io.to(roomCode).emit("dice_result", { userId, dice, result });
            }
        });

        socket.on("disconnect", () => {
            console.log("Socket disconnected: ", socket.id);
            // Jeśli socket był GM, usuwamy go z mapy
            for (const [room, gmSocketId] of roomGMs.entries()) {
                if (gmSocketId === socket.id) {
                    roomGMs.delete(room);
                    io.to(room).emit("gm_disconnected", { message: "GM disconnected" });
                }
            }
        });
    });

    return io;
}
