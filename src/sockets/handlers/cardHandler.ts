// src/sockets/handlers/cardHandler.ts
import Character, { ICharacter } from "../../models/Character.js";
import { CharacterTransferData, HeroCardFull, SocketContext } from "../types.js";
import { broadcastActiveCards, broadcastActiveNpcs, broadcastActiveMonsters } from "../utils.js";

export const registerCardHandlers = (ctx: SocketContext) => {
    const { socket, io, activeCardsByRoom, activeNpcsByRoom, activeMonstersByRoom } = ctx;

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

            const cardData: HeroCardFull = mapCharacterToHeroCardFull(character);
            roomCards.set(userId, [cardData]);
            broadcastActiveCards(ctx, roomCode);
        } catch (error) {
            console.error("Error selecting character:", error);
            socket.emit("error", { message: "Error selecting character" });
        }
    });

    socket.on("select_active_heroes", async (data: { roomCode: string; characterIds: string[] }) => {
        const { roomCode, characterIds } = data;
        const userId = socket.data.user._id.toString();
        const roomCards = activeCardsByRoom.get(roomCode);
        if (!roomCards) return;

        try {
            const characters = await Character.find({ '_id': { $in: characterIds }, characterType: 'Hero' }).lean();
            const cardData: HeroCardFull[] = characters.map(mapCharacterToHeroCardFull);
            roomCards.set(userId, cardData);
            broadcastActiveCards(ctx, roomCode);
        } catch (error) {
            socket.emit("error", { message: "Error selecting Heroes" });
        }
    });

    socket.on("clear_active_card", (data: { roomCode: string }) => {
        const { roomCode } = data;
        const userId = socket.data.user._id.toString();
        const roomCards = activeCardsByRoom.get(roomCode);

        if (roomCards && roomCards.has(userId)) {
            roomCards.delete(userId);
            broadcastActiveCards(ctx, roomCode);
        }
    });

    socket.on("select_npcs", async (data: { roomCode: string; characterIds: string[] }) => {
        const { roomCode, characterIds } = data;
        const userId = socket.data.user._id.toString();
        const roomNpcs = activeNpcsByRoom.get(roomCode);
        if (!roomNpcs) return;

        try {
            const characters = await Character.find({ '_id': { $in: characterIds }, characterType: 'NPC' }).lean();
            const cardData: HeroCardFull[] = characters.map(mapCharacterToHeroCardFull);
            roomNpcs.set(userId, cardData);
            broadcastActiveNpcs(ctx, roomCode);
        } catch (error) {
            socket.emit("error", { message: "Error selecting NPCs" });
        }
    });

    socket.on("select_monsters", async (data: { roomCode: string; characterIds: string[] }) => {
        const { roomCode, characterIds } = data;
        const userId = socket.data.user._id.toString();
        const roomMonsters = activeMonstersByRoom.get(roomCode);
        if (!roomMonsters) return;

        try {
            const characters = await Character.find({ '_id': { $in: characterIds }, characterType: 'Monster' }).lean();
            const cardData: HeroCardFull[] = characters.map(mapCharacterToHeroCardFull);
            roomMonsters.set(userId, cardData);
            broadcastActiveMonsters(ctx, roomCode);
        } catch (error) {
            socket.emit("error", { message: "Error selecting Monsters" });
        }
    });

    socket.on("character_transferred", (data: CharacterTransferData) => {
        console.log(`Character transfer notification in room ${data.roomCode}`);
        io.to(data.roomCode).emit("notify_character_transferred", data);
    });
};

// Helper inside file (not exported)
function mapCharacterToHeroCardFull(c: any): HeroCardFull {
    return {
        _id: c._id.toString(),
        name: c.name,
        avatar: c.avatar,
        race: c.race || '',
        archetype: c.archetype || '',
        species: c.species || '',
        characterType: c.characterType,
        age: c.age?.en || 'Adult',
        attributes: c.attributes,
        skills: c.skills,
        additionalSkills: c.additionalSkills,
        items: c.items,
        talents: c.talents
    };
}