import mongoose, { Schema, Document } from "mongoose";

interface IAttribute {
  value: number;
  displayName?: string;
}

interface IWound {
  current: number;
  displayName: string;
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
  bonus: "+1" | "+2";
  level: "1" | "2" | "3";
  talentType: "Active" | "Passive" | "Situational";
}

interface IItem {
  id: string;
  name: string;
  type: "Weapon" | "Armor" | "Gear";
  description: string;
}

export interface ICharacter extends Document {
  avatar: string;
  name: string;
  age: "Young" | "Adult" | "Old";
  archetype: string;
  race: string;
  RPGSystem: string;
  appearance: string;
  history: string;
  bigDream: string;
  willpower: { value: number; displayName: string };
  attributes: {
    Strength: IAttribute;
    Agility: IAttribute;
    Wits: IAttribute;
    Empathy: IAttribute;
  };
  wounds: {
    Damage: IWound;
    Fatigue: IWound;
    Confusion: IWound;
    Doubt: IWound;
  };
  states: {
    Hungry: boolean;
    Sleepy: boolean;
    Thirsty: boolean;
    Cold: boolean;
  };
  skills: Record<string, ISkill>;
  additionalSkills: ISkill[];
  talents: ITalent[];
  items: {
    Weapons: IItem[];
    Armor: IItem[];
    Gears: IItem[];
  };
  GameMaster: string;
  owner: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CharacterSchema = new Schema<ICharacter>(
  {
    avatar: { type: String, default: "../assets/img/avatar-placeholder.png" },
    name: { type: String, required: true },
    age: { type: String, enum: ["Young", "Adult", "Old"], required: true },
    archetype: { type: String, required: true },
    race: { type: String, required: true },
    RPGSystem: { type: String, default: "Year Zero Engine", required: true },
    appearance: { type: String, required: false },
    history: { type: String, required: false },
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
    wounds: {
      Damage: {
        current: { type: Number, default: 0 },
        displayName: { type: String, default: "Damage" },
      },
      Fatigue: {
        current: { type: Number, default: 0 },
        displayName: { type: String, default: "Fatigue" },
      },
      Confusion: {
        current: { type: Number, default: 0 },
        displayName: { type: String, default: "Confusion" },
      },
      Doubt: {
        current: { type: Number, default: 0 },
        displayName: { type: String, default: "Doubt" },
      },
    },
    states: {
      Hungry: { type: Boolean, default: false },
      Sleepy: { type: Boolean, default: false },
      Thirsty: { type: Boolean, default: false },
      Cold: { type: Boolean, default: false },
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
    talents: {
      id: { type: String },
      name: { type: String },
      descripption: { type: String },
      bonus: { type: String, enum: ["+1", "+2"] },
      level: { type: String, enum: ["1", "2", "3"] },
      talentType: { type: String, enum: ["Active", "Passive", "Situational"] },
      default: [],
    },
    items: {
      Weapons: {
        type: [
          {
            id: String,
            name: String,
            type: { type: String, enum: ["Weapon"] },
            description: String,
          },
        ],
        default: [],
      },
      Armor: {
        type: [
          {
            id: String,
            name: String,
            type: { type: String, enum: ["Armor"] },
            description: String,
          },
        ],
        default: [],
      },
      Gears: {
        type: [
          {
            id: String,
            name: String,
            type: { type: String, enum: ["Gear"] },
            description: String,
          },
        ],
        default: [],
      },
    },
    GameMaster: { type: String, default: "" },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const Character = mongoose.model<ICharacter>("Character", CharacterSchema);
export default Character;
