// src/sockets/gameRoomSocket.ts
import { Server, Socket } from "socket.io";
import { socketAuthMiddleware } from "../middlewares/socketAuthMiddleware.js";
import Character, { ICharacter } from "../models/Character.js";

interface JoinRoomData {
    roomCode: string;
    userId: string;
    characterId?: string;
    isGM?: boolean;
    firstName?: string;
    lastName?: string;
    email?: string;
    avatar?: string;
    role?: string;
}

interface RollDiceData {
    roomCode: string;
    dice: string; // np. "d6", "d20"
    hidden?: boolean;
    userId: string;
}

interface ChatMessageData {
    roomCode: string;
    userId: string;
    message: string;
    id?: string;
}

interface DetailedDiceData {
    userId: string;
    userName: string;
    hero: {
        id: string;
        name: string;
        avatar: string;
        race: string;
        archetype: string;
    };
    testType: string;
    dicePool: {
        attribute: { size: number; value: number }[];
        skill: { size: number; value: number }[];
        weapon: { size: number; value: number }[];
    };
    push: boolean;
    totalSuccesses: number;
    failures: number;
    timestamp: string;
}

// NOWOŚĆ: Interfejs dla pełnych danych karty, które będziemy rozgłaszać
interface HeroCardFull {
    _id: string;
    name: string;
    avatar: string;
    race: string;
    archetype: string;
    age: 'Young' | 'Adult' | 'Old';
    // Można dodać więcej pól w razie potrzeby
}

export function initGameRoomSocket(server: any) {
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

    // Mapa przechowująca informacje, który socket pełni rolę GM w danym pokoju
    const roomGMs: Map<string, string> = new Map();
    // NOWOŚĆ: Struktura do przechowywania aktywnych kart bohaterów
    // Klucz główny: roomCode, Wartość: Mapa { userId -> HeroCardFull }
    const activeCardsByRoom: Map<string, Map<string, HeroCardFull>> = new Map();

    // Używamy middleware autoryzacji – wywołuje socketAuthMiddleware z katalogu middlewares
    io.use(socketAuthMiddleware);

    io.on("connection", (socket: Socket) => {
        console.log("Nowe połączenie socket: ", socket.id);

        // NOWOŚĆ: Funkcja pomocnicza do rozgłaszania aktualizacji aktywnych kart
        const broadcastActiveCards = (roomCode: string) => {
            const activeCards = activeCardsByRoom.get(roomCode) || new Map();
            // Konwertujemy mapę na obiekt, bo jest to łatwiejsze do przetworzenia w Reduxie
            const cardsObject = Object.fromEntries(activeCards.entries());
            io.to(roomCode).emit("update_active_cards", cardsObject);
        };

        socket.on("join_room", (data: JoinRoomData) => {
            const { roomCode, userId, isGM } = data;

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

            socket.data.roomCode = roomCode;
            socket.join(roomCode);

            // ZMIANA: Inicjalizujemy mapę dla pokoju, jeśli jeszcze nie istnieje
            if (!activeCardsByRoom.has(roomCode)) {
                activeCardsByRoom.set(roomCode, new Map());
            }

            const userData = {
                userId: socket.data.user._id.toString(),
                firstName: socket.data.user.firstName,
                lastName: socket.data.user.lastName,
                email: socket.data.user.email,
                avatar: socket.data.user.avatar,
                role: socket.data.user.role
            };
            if (isGM) {
                // GM tworzy pokój – zapisujemy socket.id dla danego pokoju
                roomGMs.set(roomCode, socket.id);
                console.log(`GM (user ${userId}) created a room ${roomCode}`);
                socket.emit("room_created", { roomCode, userData });
                // socket.to(roomCode).emit("user_joined", userData);
            } else {
                // Gracz próbuje dołączyć – najpierw sprawdzamy, czy pokój istnieje
                if (!roomGMs.has(roomCode)) {
                    socket.emit("error", { message: "Room does not exist or GM is not connected" });
                    return;
                }
                console.log(`Player ${userId} joined the room ${roomCode}`);
                socket.emit("room_joined", { roomCode, userData });
                socket.to(roomCode).emit("user_joined", userData);
            }
            // Pobieramy listę socketów w pokoju i wysyłamy aktualizację
            setTimeout(() => {
                const clients = Array.from(io.sockets.adapter.rooms.get(roomCode) || []);
                const usersList = clients.map(clientId => {
                    const clientSocket = io.sockets.sockets.get(clientId);
                    return {
                        id: clientSocket?.data.user._id.toString() || "",
                        firstName: clientSocket?.data.user.firstName,
                        lastName: clientSocket?.data.user.lastName,
                        email: clientSocket?.data.user.email,
                        avatar: clientSocket?.data.user.avatar,
                        role: clientSocket?.data.user.role,
                    };
                });
                io.to(roomCode).emit("update_room_users", { users: usersList });
                // ZMIANA: Wysyłamy nowemu użytkownikowi listę aktywnych kart
                broadcastActiveCards(roomCode);
            }, 500);
        });

        // Nowy handler do obsługi wiadomości czatu
        socket.on("chat_message", (data: ChatMessageData) => {
            const { roomCode, userId, message } = data;
            if (socket.data.user._id.toString() !== userId) {
                socket.emit("error", { message: "Authorization error: UserId does not match" });
                return;
            }
            // Mona uzupełnić id wiadomości tutaj.
            const messageData = { ...data, id: data.id || Math.random().toString(36).slice(2, 9) };
            console.log(`User ${userId} sent message in room ${roomCode}: ${message}`);
            // Rozsyłamy wiadomość do wszystkich uczestników pokoju
            io.to(roomCode).emit("chat_message", messageData);
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
            console.log(`Roll ${dice} by ${userId} in ${roomCode}: ${result}`);

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

        socket.on("detailed_dice_roll", (payload: DetailedDiceData) => {
            // a) Upewniamy się, że socket.data.roomCode jest ustawione
            const roomCode = socket.data.roomCode as string;
            if (!roomCode) {
                socket.emit("error", { message: "Not in any room" });
                return;
            }
            console.log(`Detailed roll by ${payload.userId} in ${roomCode}`, payload);
            console.log(`User ${payload.userId} performed a detailed dice roll in room ${roomCode}:`, payload);
            // b) Rozsyłamy do wszystkich w tym samym roomCode
            io.to(roomCode).emit("detailed_dice_roll", payload);
        });

        // NOWOŚĆ: Handler wyboru aktywnej karty
        socket.on("select_active_card", async (data: { roomCode: string; characterId: string }) => {
            const { roomCode, characterId } = data;
            const userId = socket.data.user._id.toString();
            const roomCards = activeCardsByRoom.get(roomCode);

            if (!roomCards) return; // Pokój nie istnieje

            try {
                // ZMIANA: Dodajemy typowanie do wyniku zapytania
                const character: ICharacter | null = await Character.findById(characterId).lean();
                if (!character) {
                    socket.emit("error", { message: "Character not found" });
                    return;
                }

                // ZMIANA: Używamy pola `owner` zamiast `user`
                if (character.owner.toString() !== userId) {
                    socket.emit("error", { message: "You can only select your own character" });
                    return;
                }

                // ZMIANA: Poprawione tworzenie obiektu z obsługą pól opcjonalnych
                const cardData: HeroCardFull = {
                    _id: character._id.toString(),
                    name: character.name,
                    avatar: character.avatar,
                    race: character.race || "", // Domyślna wartość, jeśli pole jest undefined
                    archetype: character.archetype || "", // Domyślna wartość
                    age: character.age?.en || 'Adult', // Domyślna wartość 'Adult'
                };

                roomCards.set(userId, cardData);
                broadcastActiveCards(roomCode);
            } catch (error) {
                console.error("Error selecting character:", error); // Lepsze logowanie błędów
                socket.emit("error", { message: "Error selecting character" });
            }
        });

        // NOWOŚĆ: Handler odznaczenia aktywnej karty
        socket.on("clear_active_card", (data: { roomCode: string }) => {
            const { roomCode } = data;
            const userId = socket.data.user._id.toString();
            const roomCards = activeCardsByRoom.get(roomCode);

            if (roomCards && roomCards.has(userId)) {
                roomCards.delete(userId);
                broadcastActiveCards(roomCode);
            }
        });

        // ———————— NEW: leave_room ————————
        socket.on("leave_room", (data: { roomCode: string; userId: string }) => {
            const { roomCode, userId } = data;
            if (socket.data.user._id.toString() !== userId) {
                socket.emit("error", { message: "Authorization error: UserId does not match" });
                return;
            }
            socket.leave(roomCode);
            io.to(roomCode).emit("user_left", { userId });
            // update users list
            setTimeout(() => {
                const clients = Array.from(io.sockets.adapter.rooms.get(roomCode) || []);
                const usersList = clients.map(clientId => {
                    const clientSocket = io.sockets.sockets.get(clientId);
                    return {
                        id: clientSocket?.data.user._id.toString() || "",
                        firstName: clientSocket?.data.user.firstName,
                        lastName: clientSocket?.data.user.lastName,
                        email: clientSocket?.data.user.email,
                        avatar: clientSocket?.data.user.avatar,
                        role: clientSocket?.data.user.role,
                    };
                });
                io.to(roomCode).emit("update_room_users", { users: usersList });
            }, 200);
        });

        // ———————— NEW: delete_room ————————
        socket.on("delete_room", (data: { roomCode: string }) => {
            const { roomCode } = data;
            const gmSocketId = roomGMs.get(roomCode);
            if (socket.id !== gmSocketId) {
                socket.emit("error", { message: "Only GM can delete room" });
                return;
            }
            io.to(roomCode).emit("room_deleted");
            // force everyone to leave
            const clients = Array.from(io.sockets.adapter.rooms.get(roomCode) || []);
            clients.forEach(clientId => {
                const clientSocket = io.sockets.sockets.get(clientId);
                clientSocket?.leave(roomCode);
            });
            roomGMs.delete(roomCode);
            // ZMIANA: Czyścimy też aktywne karty dla usuniętego pokoju
            activeCardsByRoom.delete(roomCode);
        });

        // socket.on("disconnect", () => {
        //     console.log("Socket disconnected: ", socket.id);
        //     // Jeśli socket był GM, usuwamy go z mapy
        //     for (const [room, gmSocketId] of roomGMs.entries()) {
        //         if (gmSocketId === socket.id) {
        //             roomGMs.delete(room);
        //             io.to(room).emit("gm_disconnected", { message: "GM disconnected" });
        //         }
        //     }
        //     // Aktualizacja listy użytkowników dla wszystkich pokoi, do których należał socket
        //     socket.rooms.forEach(roomCode => {
        //         if (roomCode === socket.id) return;
        //         const clients = Array.from(io.sockets.adapter.rooms.get(roomCode) || []);
        //         const usersList = clients.map(clientId => {
        //             const clientSocket = io.sockets.sockets.get(clientId);
        //             return {
        //                 id: clientSocket?.data.user._id.toString() || "",
        //                 firstName: clientSocket?.data.user.firstName,
        //                 lastName: clientSocket?.data.user.lastName,
        //                 email: clientSocket?.data.user.email,
        //                 avatar: clientSocket?.data.user.avatar,
        //                 role: clientSocket?.data.user.role,
        //             };
        //         });
        //         io.to(roomCode).emit("update_room_users", { users: usersList });
        //     });
        // });
        socket.on("disconnect", () => {
            console.log("Socket disconnected: ", socket.id);
            const userId = socket.data.user?._id.toString();

            // ZMIANA: Logika czyszczenia po rozłączeniu
            socket.rooms.forEach(roomCode => {
                if (roomCode === socket.id) return;

                // Jeśli GM się rozłącza
                if (roomGMs.get(roomCode) === socket.id) {
                    roomGMs.delete(roomCode);
                    io.to(roomCode).emit("gm_disconnected", { message: "GM disconnected" });
                }

                // Jeśli użytkownik miał aktywną kartę, usuwamy ją
                const roomCards = activeCardsByRoom.get(roomCode);
                if (userId && roomCards && roomCards.has(userId)) {
                    roomCards.delete(userId);
                    broadcastActiveCards(roomCode);
                }

                // Aktualizujemy listę użytkowników
                const clients = Array.from(io.sockets.adapter.rooms.get(roomCode) || []);
                const usersList = clients.map(clientId => {
                    const clientSocket = io.sockets.sockets.get(clientId);
                    if (!clientSocket) return null;
                    return {
                        id: clientSocket.data.user._id.toString(),
                        firstName: clientSocket.data.user.firstName,
                        lastName: clientSocket.data.user.lastName,
                        email: clientSocket.data.user.email,
                        avatar: clientSocket.data.user.avatar,
                        role: clientSocket.data.user.role,
                    };
                }).filter(u => u !== null);

                io.to(roomCode).emit("update_room_users", { users: usersList });
            });
        });
    });

    return io;
}
