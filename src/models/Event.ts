// src/models/Event.ts
import mongoose, { Schema, Document, Types } from "mongoose";

// Interfejs definiujący pojedynczego uczestnika w evencie
export interface IEventParticipant {
    characterId: Types.ObjectId;
    characterName: string;
    characterAvatar: string;
    characterType: "Hero" | "NPC" | "Monster";
    ownerId: Types.ObjectId;
    side: 'A' | 'B'; // Strona A (np. gracze) i strona B (np. wrogowie)
    initiative?: number; // Wynik rzutu na inicjatywę (opcjonalny)
    status: 'Active' | 'Defeated'; // Status postaci w evencie
}

// Główny interfejs dla dokumentu Event
export interface IEvent extends Document {
    _id: Types.ObjectId;
    name: string;
    type: 'Encounter' | 'Conflict'; // Spotkanie (fabularne) lub Konflikt (walka)
    roomCode: string;
    createdBy: Types.ObjectId; // ID Mistrza Gry, który stworzył event
    status: 'Pending' | 'Active' | 'Resolved'; // Status całego eventu
    participants: IEventParticipant[];
    turnOrder: Types.ObjectId[]; // Posortowana lista characterId według inicjatywy
    currentTurnIndex: number; // Indeks w tablicy turnOrder wskazujący na aktualną turę
    createdAt: Date;
    updatedAt: Date;
}

// Schema dla pojedynczego uczestnika
const EventParticipantSchema = new Schema<IEventParticipant>({
    characterId: { type: Schema.Types.ObjectId, ref: "Character", required: true },
    characterName: { type: String, required: true },
    characterAvatar: { type: String, required: true },
    characterType: { type: String, enum: ["Hero", "NPC", "Monster"], required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    side: { type: String, enum: ['A', 'B'], required: true },
    initiative: { type: Number },
    status: { type: String, enum: ['Active', 'Defeated'], default: 'Active' },
}, { _id: false }); // _id: false, bo to subdokument

// Główna Schema dla Eventu
const EventSchema = new Schema<IEvent>(
    {
        name: { type: String, required: true },
        type: { type: String, enum: ["Encounter", "Conflict"], required: true },
        roomCode: { type: String, required: true, index: true },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        status: { type: String, enum: ["Pending", "Active", "Resolved"], default: "Pending" },
        participants: [EventParticipantSchema],
        turnOrder: [{ type: Schema.Types.ObjectId, ref: "Character" }],
        currentTurnIndex: { type: Number, default: 0 },
    },
    { timestamps: true }
);

const Event = mongoose.model<IEvent>("Event", EventSchema);
export default Event;