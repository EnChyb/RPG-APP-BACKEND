import mongoose, { Schema, Document } from "mongoose";

interface IAttribute {
  value: number;
  displayName?: string;
}

interface ISkill {
  displayName: string;
  value: number;
  linkedAttribute: "Strength" | "Agility" | "Wits" | "Empathy";
}

interface ITalent {
  id: string;
  name: string;
  description: string;
}

interface IItem {
  id: string;
  name: string;
  type: "Weapon" | "Armor" | "Gear";
  description: string;
}

export interface ICharacter extends Document {
  name: string;
  age: "Młody" | "Dorosły" | "Stary";
  archetype: string;
  race: string;
  RPGSystem: string;
  appearance?: string;
  bigDream?: string;
  willpower: { value: number; displayName: string };
  attributes: {
    Strength: IAttribute;
    Agility: IAttribute;
    Wits: IAttribute;
    Empathy: IAttribute;
  };
  skills: Record<string, ISkill>;
  additionalSkills: ISkill[];
  talents?: ITalent[];
  items?: IItem[];
  owner: mongoose.Types.ObjectId;
}

const CharacterSchema = new Schema<ICharacter>(
  {
    name: { type: String, required: true },
    age: { type: String, enum: ["Młody", "Dorosły", "Stary"], required: true },
    archetype: { type: String, required: true },
    race: { type: String, required: true },
    RPGSystem: { type: String, default: "Year Zero Engine", required: true },
    appearance: { type: String, required: false },
    bigDream: { type: String, required: false },
    willpower: {
      value: { type: Number, default: 0 },
      displayName: { type: String, default: "Willpower" },
    },
    attributes: {
      Strength: {
        value: Number,
        displayName: { type: String, default: "Strength" },
      },
      Agility: {
        value: Number,
        displayName: { type: String, default: "Agility" },
      },
      Wits: { value: Number, displayName: { type: String, default: "Wits" } },
      Empathy: {
        value: Number,
        displayName: { type: String, default: "Empathy" },
      },
    },
    skills: {
      type: Map,
      of: new Schema<ISkill>(
        {
          displayName: { type: String, required: true },
          value: { type: Number, required: true },
          linkedAttribute: {
            type: String,
            enum: ["Strength", "Agility", "Wits", "Empathy"],
            required: true,
          },
        },
        { _id: false }
      ),
      required: true,
    },
    additionalSkills: [
      {
        displayName: { type: String, required: true },
        value: { type: Number, required: true },
        linkedAttribute: {
          type: String,
          enum: ["Strength", "Agility", "Wits", "Empathy"],
          required: true,
        },
      },
    ],
    talents: [{ id: String, name: String, description: String }],
    items: [
      {
        id: String,
        name: String,
        type: { type: String, enum: ["Weapon", "Armor", "Gear"] },
        description: String,
      },
    ],
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const Character = mongoose.model<ICharacter>("Character", CharacterSchema);

export default Character;
