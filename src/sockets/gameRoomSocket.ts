// src/sockets/gameRoomSocket.ts
import { Server, Socket } from "socket.io";
import { socketAuthMiddleware } from "../middlewares/socketAuthMiddleware.js";
import Character, { ICharacter } from "../models/Character.js";
import Event, { IEvent } from "../models/Event.js";

// Definicja ról w pokoju gry
type RoomRole = 'RoomMaster' | 'Participant';

// Interfejs uczestnika pokoju gry
interface RoomParticipant {
    socketId: string;
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string;
    roomRole: RoomRole;
}

// Interfejs dla stanu pokoju gry
interface GameRoomState {
    roomMasterId: string; // socket.id aktualnego MPG
    participants: RoomParticipant[];
}

interface JoinRoomData {
    roomCode: string;
    userId: string;
    characterId?: string;
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

interface HeroCardFull {
    _id: string;
    name: string;
    avatar: string;
    race: string;
    archetype: string;
    species: string;
    characterType: "Hero" | "NPC" | "Monster";
    age: 'Young' | 'Adult' | 'Old';
}

interface StartEventData {
    roomCode: string;
    event: IEvent; // Pełny obiekt eventu zwrócony z API
}

interface SubmitInitiativeData {
    roomCode: string;
    eventId: string;
    characterId: string;
    initiative: number;
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

    //  Główna struktura do zarządzania stanem wszystkich pokoi gry
    const gameRooms: Map<string, GameRoomState> = new Map();
    const activeCardsByRoom: Map<string, Map<string, HeroCardFull>> = new Map();
    const activeNpcsByRoom: Map<string, Map<string, HeroCardFull[]>> = new Map();
    const activeMonstersByRoom: Map<string, Map<string, HeroCardFull[]>> = new Map();
    const activeEventByRoom: Map<string, IEvent> = new Map();

    io.use(socketAuthMiddleware);

    io.on("connection", (socket: Socket) => {
        console.log("Nowe połączenie socket: ", socket.id);

        // Funkcja pomocnicza do wysyłania aktualizacji listy użytkowników
        const broadcastUserListUpdate = (roomCode: string) => {
            const roomState = gameRooms.get(roomCode);
            if (roomState) {
                const usersList = roomState.participants.map(p => ({
                    id: p.userId,
                    firstName: p.firstName,
                    lastName: p.lastName,
                    email: p.email,
                    avatar: p.avatar,
                    roomRole: p.roomRole,
                }));
                io.to(roomCode).emit("update_room_users", { users: usersList });
            }
        };

        // Funkcja pomocnicza do rozgłaszania aktualizacji aktywnych kart
        const broadcastActiveCards = (roomCode: string) => {
            const activeCards = activeCardsByRoom.get(roomCode) || new Map();
            io.to(roomCode).emit("update_active_cards", Object.fromEntries(activeCards.entries()));
        };
        const broadcastActiveNpcs = (roomCode: string) => {
            const activeNpcs = activeNpcsByRoom.get(roomCode) || new Map();
            io.to(roomCode).emit("update_active_npcs", Object.fromEntries(activeNpcs.entries()));
        };
        const broadcastActiveMonsters = (roomCode: string) => {
            const activeMonsters = activeMonstersByRoom.get(roomCode) || new Map();
            io.to(roomCode).emit("update_active_monsters", Object.fromEntries(activeMonsters.entries()));
        };

        const broadcastEventUpdate = (roomCode: string) => {
            const event = activeEventByRoom.get(roomCode);
            if (event) {
                io.to(roomCode).emit("event_updated", event);
            }
        };

        // Całkowicie przebudowany handler 'join_room'
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
                roomRole: 'Participant', // Domyślnie jest uczestnikiem
            };

            // Inicjalizacja map dla kart, NPC i potworów jeśli nie istnieją
            if (!activeCardsByRoom.has(roomCode)) activeCardsByRoom.set(roomCode, new Map());
            if (!activeNpcsByRoom.has(roomCode)) activeNpcsByRoom.set(roomCode, new Map());
            if (!activeMonstersByRoom.has(roomCode)) activeMonstersByRoom.set(roomCode, new Map());

            let roomState = gameRooms.get(roomCode);

            if (!roomState) {
                // Pokój nie istnieje - ten użytkownik go tworzy i zostaje MPG
                newParticipant.roomRole = 'RoomMaster';
                const newRoomState: GameRoomState = {
                    roomMasterId: socket.id,
                    participants: [newParticipant],
                };
                gameRooms.set(roomCode, newRoomState);
                console.log(`User ${userId} created room ${roomCode} and is now RoomMaster.`);
                socket.emit("room_created", { roomCode });
            } else {
                // Pokój już istnieje - dołącza jako UG
                // Sprawdź czy użytkownik już jest w pokoju
                if (roomState.participants.some(p => p.userId === userId)) {
                    console.log(`User ${userId} is already in room ${roomCode}. Reconnecting...`);
                    // Można tu obsłużyć logikę ponownego połączenia, np. aktualizując socketId
                } else {
                    roomState.participants.push(newParticipant);
                }
                console.log(`User ${userId} joined room ${roomCode} as a Participant.`);
                socket.emit("room_joined", { roomCode });
            }

            broadcastUserListUpdate(roomCode);
            broadcastActiveCards(roomCode);
            broadcastActiveNpcs(roomCode);
            broadcastActiveMonsters(roomCode);
        });

        // Handler do przekazywania roli MPG
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
            // Zamiana ról
            oldMaster.roomRole = 'Participant';
            newMaster.roomRole = 'RoomMaster';
            roomState.roomMasterId = newMaster.socketId;

            console.log(`Room Master role in ${roomCode} transferred from ${oldMaster.userId} to ${newMaster.userId}`);

            // Poinformuj wszystkich o zmianie
            io.to(roomCode).emit("new_room_master", { userId: newMaster.userId });
            broadcastUserListUpdate(roomCode);
        });

        // Handler 'leave_room'
        socket.on("leave_room", (data: { roomCode: string; userId: string }) => {
            const { roomCode, userId } = data;
            if (socket.data.user._id.toString() !== userId) {
                socket.emit("error", { message: "Authorization error: UserId does not match" });
                return;
            }
            handleUserLeave(socket, roomCode);
            socket.leave(roomCode);
        });

        // Handler 'delete_room'
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

            // Czyszczenie wszystkich danych związanych z pokojem
            gameRooms.delete(roomCode);
            activeCardsByRoom.delete(roomCode);
            activeNpcsByRoom.delete(roomCode);
            activeMonstersByRoom.delete(roomCode);

            console.log(`Room ${roomCode} deleted by Room Master.`);
        });

        // Handler 'disconnect'
        socket.on("disconnect", () => {
            console.log("Socket disconnected: ", socket.id);
            // Iterujemy po wszystkich pokojach, w których był użytkownik
            socket.rooms.forEach(roomCode => {
                if (roomCode !== socket.id) { // socket.io domyślnie tworzy pokój o id socketu
                    handleUserLeave(socket, roomCode);
                }
            });
        });

        // Funkcja pomocnicza do obsługi wyjścia/rozłączenia użytkownika
        const handleUserLeave = (socket: Socket, roomCode: string) => {
            const roomState = gameRooms.get(roomCode);
            if (!roomState) return;

            const leavingUserId = socket.data.user?._id.toString();
            const wasRoomMaster = roomState.roomMasterId === socket.id;

            // Usuń uczestnika z listy
            roomState.participants = roomState.participants.filter(p => p.socketId !== socket.id);

            // Jeśli pokój jest pusty, usuń go
            if (roomState.participants.length === 0) {
                gameRooms.delete(roomCode);
                activeCardsByRoom.delete(roomCode);
                activeNpcsByRoom.delete(roomCode);
                activeMonstersByRoom.delete(roomCode);
                console.log(`Room ${roomCode} is now empty and has been closed.`);
                return;
            }

            // Jeśli MPG opuścił pokój, wybierz nowego
            if (wasRoomMaster) {
                const newMaster = roomState.participants[0]; // Pierwszy na liście (najwcześniej dołączył)
                if (newMaster) {
                    newMaster.roomRole = 'RoomMaster';
                    roomState.roomMasterId = newMaster.socketId;
                    console.log(`Room Master left ${roomCode}. New master is ${newMaster.userId}.`);
                    io.to(roomCode).emit("new_room_master", { userId: newMaster.userId });
                }
            }

            // Usuń aktywne karty, NPC i potwory tego użytkownika
            const roomCards = activeCardsByRoom.get(roomCode);
            if (leavingUserId && roomCards?.has(leavingUserId)) {
                roomCards.delete(leavingUserId);
                broadcastActiveCards(roomCode);
            }
            const roomNpcs = activeNpcsByRoom.get(roomCode);
            if (leavingUserId && roomNpcs?.has(leavingUserId)) {
                roomNpcs.delete(leavingUserId);
                broadcastActiveNpcs(roomCode);
            }
            const roomMonsters = activeMonstersByRoom.get(roomCode);
            if (leavingUserId && roomMonsters?.has(leavingUserId)) {
                roomMonsters.delete(leavingUserId);
                broadcastActiveMonsters(roomCode);
            }

            // Poinformuj wszystkich o wyjściu użytkownika i zaktualizuj listę
            io.to(roomCode).emit("user_left", { userId: leavingUserId });
            broadcastUserListUpdate(roomCode);
        };

        // Handler do obsługi wiadomości czatu
        socket.on("chat_message", (data: ChatMessageData) => {
            const { roomCode, userId, message } = data;
            if (socket.data.user._id.toString() !== userId) {
                socket.emit("error", { message: "Authorization error: UserId does not match" });
                return;
            }
            const messageData = { ...data, id: data.id || Math.random().toString(36).slice(2, 9) };
            console.log(`User ${userId} sent message in room ${roomCode}: ${message}`);
            // Rozsyłamy wiadomość do wszystkich uczestników pokoju
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

        // Handler wyboru aktywnej karty
        socket.on("select_active_card", async (data: { roomCode: string; characterId: string }) => {
            const { roomCode, characterId } = data;
            const userId = socket.data.user._id.toString();
            const roomCards = activeCardsByRoom.get(roomCode);

            if (!roomCards) return;

            try {
                const character: ICharacter | null = await Character.findById(characterId).lean();
                if (!character) {
                    socket.emit("error", { message: "Character not found" });
                    return;
                }

                if (character.owner.toString() !== userId) {
                    socket.emit("error", { message: "You can only select your own character" });
                    return;
                }

                const cardData: HeroCardFull = {
                    _id: character._id.toString(),
                    name: character.name,
                    avatar: character.avatar,
                    race: character.race || "",
                    archetype: character.archetype || "",
                    species: character.species || "",
                    characterType: character.characterType,
                    age: character.age?.en || 'Adult',
                };

                roomCards.set(userId, cardData);
                broadcastActiveCards(roomCode);
            } catch (error) {
                console.error("Error selecting character:", error);
                socket.emit("error", { message: "Error selecting character" });
            }
        });

        // Handler odznaczenia aktywnej karty
        socket.on("clear_active_card", (data: { roomCode: string }) => {
            const { roomCode } = data;
            const userId = socket.data.user._id.toString();
            const roomCards = activeCardsByRoom.get(roomCode);

            if (roomCards && roomCards.has(userId)) {
                roomCards.delete(userId);
                broadcastActiveCards(roomCode);
            }
        });

        // HANDLER DLA NPC
        socket.on("select_npcs", async (data: { roomCode: string; characterIds: string[] }) => {
            const { roomCode, characterIds } = data;
            const userId = socket.data.user._id.toString();
            const roomNpcs = activeNpcsByRoom.get(roomCode);
            if (!roomNpcs) return;

            try {
                const characters = await Character.find({ '_id': { $in: characterIds }, characterType: 'NPC' }).lean();
                const cardData: HeroCardFull[] = characters.map(c => ({
                    _id: c._id.toString(), name: c.name, avatar: c.avatar,
                    race: c.race || '', archetype: c.archetype || '', species: c.species || '',
                    characterType: c.characterType, age: c.age?.en || 'Adult',
                }));
                roomNpcs.set(userId, cardData);
                broadcastActiveNpcs(roomCode);
            } catch (error) {
                socket.emit("error", { message: "Error selecting NPCs" });
            }
        });

        // HANDLER DLA POTWORÓW
        socket.on("select_monsters", async (data: { roomCode: string; characterIds: string[] }) => {
            const { roomCode, characterIds } = data;
            const userId = socket.data.user._id.toString();
            const roomMonsters = activeMonstersByRoom.get(roomCode);
            if (!roomMonsters) return;

            try {
                const characters = await Character.find({ '_id': { $in: characterIds }, characterType: 'Monster' }).lean();
                const cardData: HeroCardFull[] = characters.map(c => ({
                    _id: c._id.toString(), name: c.name, avatar: c.avatar,
                    race: c.race || '', archetype: c.archetype || '', species: c.species || '',
                    characterType: c.characterType, age: c.age?.en || 'Adult',
                }));
                roomMonsters.set(userId, cardData);
                broadcastActiveMonsters(roomCode);
            } catch (error) {
                socket.emit("error", { message: "Error selecting Monsters" });
            }
        });

        // ===============================================
        // NOWE HANDLERY ZDARZEŃ DLA EVENTÓW
        // ===============================================

        // 1. MPG informuje serwer o rozpoczęciu eventu
        socket.on("start_event", async (data: StartEventData) => {
            const { roomCode, event } = data;
            const roomState = gameRooms.get(roomCode);

            // Tylko MPG może rozpocząć event
            if (!roomState || roomState.roomMasterId !== socket.id) {
                return socket.emit("error", { message: "Only the Room Master can start an event." });
            }

            // Zapisz event jako aktywny dla tego pokoju
            activeEventByRoom.set(roomCode, event);
            console.log(`Event "${event.name}" started in room ${roomCode}`);

            // Poinformuj wszystkich w pokoju o rozpoczęciu eventu
            io.to(roomCode).emit("event_started", event);

            // Jeśli to konflikt, poproś o rzuty na inicjatywę
            if (event.type === 'Conflict') {
                io.to(roomCode).emit("request_initiative_roll", { eventId: event._id });
            }
        });

        // 2. Gracz przesyła swój wynik inicjatywy
        socket.on("submit_initiative", async (data: SubmitInitiativeData) => {
            const { roomCode, eventId, characterId, initiative } = data;
            const event = activeEventByRoom.get(roomCode);

            if (!event || event._id.toString() !== eventId) return;

            // Znajdź uczestnika i zaktualizuj jego inicjatywę
            const participant = event.participants.find(p => p.characterId.toString() === characterId);
            if (participant) {
                participant.initiative = initiative;
            }

            // Sprawdź, czy wszyscy rzucili na inicjatywę
            const allHaveRolled = event.participants.every(p => typeof p.initiative === 'number');

            if (allHaveRolled) {
                console.log(`All participants have rolled initiative for event ${eventId}. Sorting...`);
                // 1. Pobieranie pełne dane postaci, aby mieć dostęp do statystyk
                const charIds = event.participants.map(p => p.characterId);
                const characters = await Character.find({ '_id': { $in: charIds } }).lean();

                // 2. Stworzenie mapy statystyk dla łatwego dostępu
                const statsMap = new Map(characters.map(c => [
                    c._id.toString(),
                    {
                        move: c.skills.Move?.value ?? 0,
                        agility: c.attributes.Agility.value,
                        type: c.characterType,
                    }
                ]));
                // 3. Sortowanie uczestników malejąco po inicjatywie, aby ustalić kolejność
                event.participants.sort((a, b) => {
                    // Kryterium 1: Inicjatywa (im niższa, tym lepiej)
                    const initiativeDiff = (a.initiative ?? 99) - (b.initiative ?? 99);
                    if (initiativeDiff !== 0) return initiativeDiff;

                    const statsA = statsMap.get(a.characterId.toString());
                    const statsB = statsMap.get(b.characterId.toString());
                    if (!statsA || !statsB) return 0;

                    // Kryterium 2: Umiejętność Move (im wyższa, tym lepiej)
                    const moveDiff = statsB.move - statsA.move;
                    if (moveDiff !== 0) return moveDiff;

                    // Kryterium 3: Atrybut Agility (im wyższy, tym lepiej)
                    const agilityDiff = statsB.agility - statsA.agility;
                    if (agilityDiff !== 0) return agilityDiff;

                    // Kryterium 4: Typ postaci (Hero > NPC > Monster)
                    const typeOrder = { 'Hero': 1, 'NPC': 2, 'Monster': 3 };
                    const typeDiff = typeOrder[statsA.type] - typeOrder[statsB.type];
                    if (typeDiff !== 0) return typeDiff;

                    // Kryterium 5: Losowo
                    return Math.random() - 0.5;
                });

                // Zapisuje posortowaną kolejność ID postaci
                event.turnOrder = event.participants.map(p => p.characterId);
                event.currentTurnIndex = 0;
                event.status = 'Active';

                console.log(`Turn order established:`, event.turnOrder.map(id => id.toString()));

                // Zapisuje zmiany w bazie danych
                await Event.findByIdAndUpdate(eventId, {
                    participants: event.participants,
                    turnOrder: event.turnOrder,
                    status: 'Active'
                });
            }
            // Roześlij zaktualizowany stan eventu do wszystkich
            broadcastEventUpdate(roomCode);
        });

        // 3. MPG prosi o przejście do następnej tury
        socket.on("request_next_turn", async (data: { roomCode: string }) => {
            const { roomCode } = data;
            const event = activeEventByRoom.get(roomCode);
            const roomState = gameRooms.get(roomCode);

            if (!event || !roomState || roomState.roomMasterId !== socket.id) return;

            // Przesuń wskaźnik tury, zapętlając go na końcu
            event.currentTurnIndex = (event.currentTurnIndex + 1) % event.turnOrder.length;

            await Event.findByIdAndUpdate(event._id, { currentTurnIndex: event.currentTurnIndex });

            broadcastEventUpdate(roomCode);
        });

        // 4. MPG kończy event
        socket.on("end_event", async (data: { roomCode: string }) => {
            const { roomCode } = data;
            const event = activeEventByRoom.get(roomCode);
            const roomState = gameRooms.get(roomCode);

            if (!event || !roomState || roomState.roomMasterId !== socket.id) return;

            // Zaktualizuj status w bazie danych
            await Event.findByIdAndUpdate(event._id, { status: 'Resolved' });

            // Usuń event z pamięci serwera
            activeEventByRoom.delete(roomCode);

            // Poinformuj klientów o zakończeniu eventu
            io.to(roomCode).emit("event_ended", { eventId: event._id });
            console.log(`Event "${event.name}" ended in room ${roomCode}`);
        });

    });

    return io;
}

// // src/sockets/gameRoomSocket.ts
// import { Server, Socket } from "socket.io";
// import { socketAuthMiddleware } from "../middlewares/socketAuthMiddleware.js";
// import Character, { ICharacter } from "../models/Character.js";

// interface JoinRoomData {
//     roomCode: string;
//     userId: string;
//     characterId?: string;
//     isGM?: boolean;
//     firstName?: string;
//     lastName?: string;
//     email?: string;
//     avatar?: string;
//     role?: string;
// }

// interface RollDiceData {
//     roomCode: string;
//     dice: string; // np. "d6", "d20"
//     hidden?: boolean;
//     userId: string;
// }

// interface ChatMessageData {
//     roomCode: string;
//     userId: string;
//     message: string;
//     id?: string;
// }

// interface DetailedDiceData {
//     userId: string;
//     userName: string;
//     hero: {
//         id: string;
//         name: string;
//         avatar: string;
//         race: string;
//         archetype: string;
//     };
//     testType: string;
//     dicePool: {
//         attribute: { size: number; value: number }[];
//         skill: { size: number; value: number }[];
//         weapon: { size: number; value: number }[];
//     };
//     push: boolean;
//     totalSuccesses: number;
//     failures: number;
//     timestamp: string;
// }

// interface HeroCardFull {
//     _id: string;
//     name: string;
//     avatar: string;
//     race: string;
//     archetype: string;
//     species: string;
//     characterType: "Hero" | "NPC" | "Monster";
//     age: 'Young' | 'Adult' | 'Old';
// }

// export function initGameRoomSocket(server: any) {
//     const io = new Server(server, {
//         cors: {
//             origin: [
//                 "http://localhost:5173",
//                 "http://localhost:8081",
//                 "http://localhost:3000",
//             ],
//             methods: ["GET", "POST", "PATCH", "DELETE"],
//         },
//     });

//     // Mapa przechowująca informacje, który socket pełni rolę GM w danym pokoju
//     const roomGMs: Map<string, string> = new Map();
//     const activeCardsByRoom: Map<string, Map<string, HeroCardFull>> = new Map();
//     // NOWE STRUKTURY DANYCH
//     const activeNpcsByRoom: Map<string, Map<string, HeroCardFull[]>> = new Map();
//     const activeMonstersByRoom: Map<string, Map<string, HeroCardFull[]>> = new Map();

//     io.use(socketAuthMiddleware);

//     io.on("connection", (socket: Socket) => {
//         console.log("Nowe połączenie socket: ", socket.id);

//         // NOWOŚĆ: Funkcja pomocnicza do rozgłaszania aktualizacji aktywnych kart
//         const broadcastActiveCards = (roomCode: string) => {
//             const activeCards = activeCardsByRoom.get(roomCode) || new Map();
//             // Konwertujemy mapę na obiekt, bo jest to łatwiejsze do przetworzenia w Reduxie
//             const cardsObject = Object.fromEntries(activeCards.entries());
//             io.to(roomCode).emit("update_active_cards", cardsObject);
//         };
//         const broadcastActiveNpcs = (roomCode: string) => {
//             const activeNpcs = activeNpcsByRoom.get(roomCode) || new Map();
//             io.to(roomCode).emit("update_active_npcs", Object.fromEntries(activeNpcs.entries()));
//         };
//         const broadcastActiveMonsters = (roomCode: string) => {
//             const activeMonsters = activeMonstersByRoom.get(roomCode) || new Map();
//             io.to(roomCode).emit("update_active_monsters", Object.fromEntries(activeMonsters.entries()));
//         };

//         socket.on("join_room", (data: JoinRoomData) => {
//             const { roomCode, userId, isGM } = data;

//             // Weryfikujemy, czy userId z eventu zgadza się z danymi z tokena
//             if (socket.data.user._id.toString() !== userId) {
//                 socket.emit("error", { message: "Authorization error: UserId does not match" });
//                 return;
//             }

//             // Walidacja formatu kodu pokoju (np. "NazwaGry-KOD:12345-123456")
//             const roomCodePattern = /^.+-KOD:\d{5}-\d{6}$/;
//             if (!roomCodePattern.test(roomCode)) {
//                 socket.emit("error", { message: "Incorrect room code format" });
//                 return;
//             }

//             socket.data.roomCode = roomCode;
//             socket.join(roomCode);

//             // ZMIANA: Inicjalizujemy mapę dla pokoju, jeśli jeszcze nie istnieje
//             if (!activeCardsByRoom.has(roomCode)) {
//                 activeCardsByRoom.set(roomCode, new Map());
//             }

//             const userData = {
//                 userId: socket.data.user._id.toString(),
//                 firstName: socket.data.user.firstName,
//                 lastName: socket.data.user.lastName,
//                 email: socket.data.user.email,
//                 avatar: socket.data.user.avatar,
//                 role: socket.data.user.role
//             };
//             if (isGM) {
//                 // GM tworzy pokój – zapisujemy socket.id dla danego pokoju
//                 roomGMs.set(roomCode, socket.id);
//                 console.log(`GM (user ${userId}) created a room ${roomCode}`);
//                 socket.emit("room_created", { roomCode, userData });
//                 // socket.to(roomCode).emit("user_joined", userData);
//             } else {
//                 // Gracz próbuje dołączyć – najpierw sprawdzamy, czy pokój istnieje
//                 if (!roomGMs.has(roomCode)) {
//                     socket.emit("error", { message: "Room does not exist or GM is not connected" });
//                     return;
//                 }
//                 console.log(`Player ${userId} joined the room ${roomCode}`);
//                 socket.emit("room_joined", { roomCode, userData });
//                 socket.to(roomCode).emit("user_joined", userData);
//             }
//             if (!activeNpcsByRoom.has(data.roomCode)) activeNpcsByRoom.set(data.roomCode, new Map());
//             if (!activeMonstersByRoom.has(data.roomCode)) activeMonstersByRoom.set(data.roomCode, new Map());

//             // Pobieramy listę socketów w pokoju i wysyłamy aktualizację
//             setTimeout(() => {
//                 const clients = Array.from(io.sockets.adapter.rooms.get(roomCode) || []);
//                 const usersList = clients.map(clientId => {
//                     const clientSocket = io.sockets.sockets.get(clientId);
//                     return {
//                         id: clientSocket?.data.user._id.toString() || "",
//                         firstName: clientSocket?.data.user.firstName,
//                         lastName: clientSocket?.data.user.lastName,
//                         email: clientSocket?.data.user.email,
//                         avatar: clientSocket?.data.user.avatar,
//                         role: clientSocket?.data.user.role,
//                     };
//                 });
//                 io.to(roomCode).emit("update_room_users", { users: usersList });
//                 // ZMIANA: Wysyłamy nowemu użytkownikowi listę aktywnych kart
//                 broadcastActiveCards(roomCode);
//                 broadcastActiveNpcs(data.roomCode);
//                 broadcastActiveMonsters(data.roomCode);
//             }, 500);
//         });

//         // Nowy handler do obsługi wiadomości czatu
//         socket.on("chat_message", (data: ChatMessageData) => {
//             const { roomCode, userId, message } = data;
//             if (socket.data.user._id.toString() !== userId) {
//                 socket.emit("error", { message: "Authorization error: UserId does not match" });
//                 return;
//             }
//             // Mona uzupełnić id wiadomości tutaj.
//             const messageData = { ...data, id: data.id || Math.random().toString(36).slice(2, 9) };
//             console.log(`User ${userId} sent message in room ${roomCode}: ${message}`);
//             // Rozsyłamy wiadomość do wszystkich uczestników pokoju
//             io.to(roomCode).emit("chat_message", messageData);
//         });

//         socket.on("roll_dice", (data: RollDiceData) => {
//             const { roomCode, dice, hidden, userId } = data;
//             if (socket.data.user._id.toString() !== userId) {
//                 socket.emit("error", { message: "Authorization error: UserId does not match" });
//                 return;
//             }
//             const sides = parseInt(dice.substring(1));
//             if (isNaN(sides) || sides <= 0) {
//                 socket.emit("error", { message: "Incorrect dice format" });
//                 return;
//             }
//             const result = Math.floor(Math.random() * sides) + 1;
//             console.log(`User ${userId} roll ${dice} and obtained ${result} in the room ${roomCode}`);
//             console.log(`Roll ${dice} by ${userId} in ${roomCode}: ${result}`);

//             if (hidden) {
//                 const gmSocketId = roomGMs.get(roomCode);
//                 if (gmSocketId) {
//                     io.to(gmSocketId).emit("dice_result_hidden", { userId, dice, result });
//                 } else {
//                     socket.emit("error", { message: "No GM in the room" });
//                 }
//             } else {
//                 io.to(roomCode).emit("dice_result", { userId, dice, result });
//             }
//         });

//         socket.on("detailed_dice_roll", (payload: DetailedDiceData) => {
//             // a) Upewniamy się, że socket.data.roomCode jest ustawione
//             const roomCode = socket.data.roomCode as string;
//             if (!roomCode) {
//                 socket.emit("error", { message: "Not in any room" });
//                 return;
//             }
//             console.log(`Detailed roll by ${payload.userId} in ${roomCode}`, payload);
//             console.log(`User ${payload.userId} performed a detailed dice roll in room ${roomCode}:`, payload);
//             // b) Rozsyłamy do wszystkich w tym samym roomCode
//             io.to(roomCode).emit("detailed_dice_roll", payload);
//         });

//         // NOWOŚĆ: Handler wyboru aktywnej karty
//         socket.on("select_active_card", async (data: { roomCode: string; characterId: string }) => {
//             const { roomCode, characterId } = data;
//             const userId = socket.data.user._id.toString();
//             const roomCards = activeCardsByRoom.get(roomCode);

//             if (!roomCards) return; // Pokój nie istnieje

//             try {
//                 // ZMIANA: Dodajemy typowanie do wyniku zapytania
//                 const character: ICharacter | null = await Character.findById(characterId).lean();
//                 if (!character) {
//                     socket.emit("error", { message: "Character not found" });
//                     return;
//                 }

//                 // ZMIANA: Używamy pola `owner` zamiast `user`
//                 if (character.owner.toString() !== userId) {
//                     socket.emit("error", { message: "You can only select your own character" });
//                     return;
//                 }

//                 // ZMIANA: Poprawione tworzenie obiektu z obsługą pól opcjonalnych
//                 const cardData: HeroCardFull = {
//                     _id: character._id.toString(),
//                     name: character.name,
//                     avatar: character.avatar,
//                     race: character.race || "",
//                     archetype: character.archetype || "",
//                     species: character.species || "",
//                     characterType: character.characterType,
//                     age: character.age?.en || 'Adult',
//                 };

//                 roomCards.set(userId, cardData);
//                 broadcastActiveCards(roomCode);
//             } catch (error) {
//                 console.error("Error selecting character:", error);
//                 socket.emit("error", { message: "Error selecting character" });
//             }
//         });

//         // NOWOŚĆ: Handler odznaczenia aktywnej karty
//         socket.on("clear_active_card", (data: { roomCode: string }) => {
//             const { roomCode } = data;
//             const userId = socket.data.user._id.toString();
//             const roomCards = activeCardsByRoom.get(roomCode);

//             if (roomCards && roomCards.has(userId)) {
//                 roomCards.delete(userId);
//                 broadcastActiveCards(roomCode);
//             }
//         });

//         // NOWY HANDLER DLA NPC
//         socket.on("select_npcs", async (data: { roomCode: string; characterIds: string[] }) => {
//             const { roomCode, characterIds } = data;
//             const userId = socket.data.user._id.toString();
//             const roomNpcs = activeNpcsByRoom.get(roomCode);
//             if (!roomNpcs) return;

//             try {
//                 const characters = await Character.find({ '_id': { $in: characterIds }, characterType: 'NPC' }).lean();
//                 const cardData: HeroCardFull[] = characters.map(c => ({
//                     _id: c._id.toString(), name: c.name, avatar: c.avatar,
//                     race: c.race || '', archetype: c.archetype || '', species: c.species || '',
//                     characterType: c.characterType, age: c.age?.en || 'Adult',
//                 }));
//                 roomNpcs.set(userId, cardData);
//                 broadcastActiveNpcs(roomCode);
//             } catch (error) {
//                 socket.emit("error", { message: "Error selecting NPCs" });
//             }
//         });

//         // NOWY HANDLER DLA POTWORÓW
//         socket.on("select_monsters", async (data: { roomCode: string; characterIds: string[] }) => {
//             const { roomCode, characterIds } = data;
//             const userId = socket.data.user._id.toString();
//             const roomMonsters = activeMonstersByRoom.get(roomCode);
//             if (!roomMonsters) return;

//             try {
//                 const characters = await Character.find({ '_id': { $in: characterIds }, characterType: 'Monster' }).lean();
//                 const cardData: HeroCardFull[] = characters.map(c => ({
//                     _id: c._id.toString(), name: c.name, avatar: c.avatar,
//                     race: c.race || '', archetype: c.archetype || '', species: c.species || '',
//                     characterType: c.characterType, age: c.age?.en || 'Adult',
//                 }));
//                 roomMonsters.set(userId, cardData);
//                 broadcastActiveMonsters(roomCode);
//             } catch (error) {
//                 socket.emit("error", { message: "Error selecting Monsters" });
//             }
//         });

//         // ———————— NEW: leave_room ————————
//         socket.on("leave_room", (data: { roomCode: string; userId: string }) => {
//             const { roomCode, userId } = data;
//             if (socket.data.user._id.toString() !== userId) {
//                 socket.emit("error", { message: "Authorization error: UserId does not match" });
//                 return;
//             }
//             socket.leave(roomCode);
//             io.to(roomCode).emit("user_left", { userId });
//             setTimeout(() => {
//                 const clients = Array.from(io.sockets.adapter.rooms.get(roomCode) || []);
//                 const usersList = clients.map(clientId => {
//                     const clientSocket = io.sockets.sockets.get(clientId);
//                     return {
//                         id: clientSocket?.data.user._id.toString() || "",
//                         firstName: clientSocket?.data.user.firstName,
//                         lastName: clientSocket?.data.user.lastName,
//                         email: clientSocket?.data.user.email,
//                         avatar: clientSocket?.data.user.avatar,
//                         role: clientSocket?.data.user.role,
//                     };
//                 });
//                 io.to(roomCode).emit("update_room_users", { users: usersList });
//             }, 200);
//         });

//         // ———————— NEW: delete_room ————————
//         socket.on("delete_room", (data: { roomCode: string }) => {
//             const { roomCode } = data;
//             const gmSocketId = roomGMs.get(roomCode);
//             if (socket.id !== gmSocketId) {
//                 socket.emit("error", { message: "Only GM can delete room" });
//                 return;
//             }
//             io.to(roomCode).emit("room_deleted");
//             const clients = Array.from(io.sockets.adapter.rooms.get(roomCode) || []);
//             clients.forEach(clientId => {
//                 const clientSocket = io.sockets.sockets.get(clientId);
//                 clientSocket?.leave(roomCode);
//             });
//             roomGMs.delete(roomCode);
//             activeCardsByRoom.delete(roomCode);
//         });

//         socket.on("disconnect", () => {
//             console.log("Socket disconnected: ", socket.id);
//             const userId = socket.data.user?._id.toString();

//             socket.rooms.forEach(roomCode => {
//                 if (roomCode === socket.id) return;

//                 // Jeśli GM się rozłącza
//                 if (roomGMs.get(roomCode) === socket.id) {
//                     roomGMs.delete(roomCode);
//                     io.to(roomCode).emit("gm_disconnected", { message: "GM disconnected" });
//                 }

//                 // Jeśli użytkownik miał aktywną kartę, usuwamy ją
//                 const roomCards = activeCardsByRoom.get(roomCode);
//                 if (userId && roomCards && roomCards.has(userId)) {
//                     roomCards.delete(userId);
//                     broadcastActiveCards(roomCode);
//                 }

//                 // Czyszczenie dla NPC i Potworów
//                 const roomNpcs = activeNpcsByRoom.get(roomCode);
//                 if (userId && roomNpcs?.has(userId)) {
//                     roomNpcs.delete(userId);
//                     broadcastActiveNpcs(roomCode);
//                 }
//                 const roomMonsters = activeMonstersByRoom.get(roomCode);
//                 if (userId && roomMonsters?.has(userId)) {
//                     roomMonsters.delete(userId);
//                     broadcastActiveMonsters(roomCode);
//                 }

//                 // Aktualizujemy listę użytkowników
//                 const clients = Array.from(io.sockets.adapter.rooms.get(roomCode) || []);
//                 const usersList = clients.map(clientId => {
//                     const clientSocket = io.sockets.sockets.get(clientId);
//                     if (!clientSocket) return null;
//                     return {
//                         id: clientSocket.data.user._id.toString(),
//                         firstName: clientSocket.data.user.firstName,
//                         lastName: clientSocket.data.user.lastName,
//                         email: clientSocket.data.user.email,
//                         avatar: clientSocket.data.user.avatar,
//                         role: clientSocket.data.user.role,
//                     };
//                 }).filter(u => u !== null);

//                 io.to(roomCode).emit("update_room_users", { users: usersList });
//             });
//         });
//     });

//     return io;
// }
