// src/sockets/types.ts
import { Server, Socket } from "socket.io";
import { ICharacter, ISkill } from "../models/Character.js";
import { IEvent } from "../models/Event.js";

// --- Enums / Simple Types ---
export type ActionType = 'main' | 'fast' | 'special';
export type RoomRole = 'RoomMaster' | 'Participant';

// --- Socket Payloads ---
export interface UseActionPayload {
    roomCode: string;
    eventId: string;
    characterId: string;
    actionType: ActionType;
    isReaction: boolean;
}

export interface EndMyTurnPayload {
    roomCode: string;
    eventId: string;
    characterId: string;
}

export interface JoinRoomData {
    roomCode: string;
    userId: string;
    characterId?: string;
}

export interface ChatMessageData {
    roomCode: string;
    userId: string;
    message: string;
    id?: string;
}

export interface DetailedDiceData {
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
    eventId: string;
    turn: number;
    round: number;
}

export interface StartEventData {
    roomCode: string;
    event: IEvent;
}

export interface CharacterTransferData {
    roomCode: string;
    fromUser: { id: string; name: string };
    toUser: { id: string; name: string; email: string };
    character: { name: string };
}

export interface SubmitInitiativeData {
    roomCode: string;
    eventId: string;
    characterId: string;
    initiative: number;
}

export interface WaiveReactionPayload {
    roomCode: string;
    eventId: string;
    characterId: string;
}

export interface DeclareAttackPayload {
    roomCode: string;
    eventId: string;
    attackerId: string;
    targetId: string;
    weapon: {
        name: string;
        damage: number;
        damageType: 'blunt' | 'slash' | 'pierce';
        hand: 'main' | 'off' | 'two-handed';
    };
    hits: number;
    hitLocation: string;
}

export interface IncomingAttackPayload extends DeclareAttackPayload {
    attackerName: string;
    attackerAvatar: string;
}

// --- Internal State Interfaces ---

export interface RoomParticipant {
    socketId: string;
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string;
    roomRole: RoomRole;
}

export interface GameRoomState {
    roomMasterId: string;
    participants: RoomParticipant[];
}

export interface HeroCardFull {
    _id: string;
    name: string;
    avatar: string;
    race: string;
    archetype: string;
    species: string;
    characterType: "Hero" | "NPC" | "Monster";
    age: 'Young' | 'Adult' | 'Old';
    attributes: ICharacter['attributes'];
    skills: Record<string, ISkill>;
    items: ICharacter['items'];
    additionalSkills?: ISkill[];
    talents?: ICharacter['talents'];
}

// --- Context ---
// Obiekt contextu przekazywany do każdego handlera
export interface SocketContext {
    io: Server;
    socket: Socket;
    gameRooms: Map<string, GameRoomState>;
    activeCardsByRoom: Map<string, Map<string, HeroCardFull[]>>;
    activeNpcsByRoom: Map<string, Map<string, HeroCardFull[]>>;
    activeMonstersByRoom: Map<string, Map<string, HeroCardFull[]>>;
    activeEventByRoom: Map<string, IEvent>;
}