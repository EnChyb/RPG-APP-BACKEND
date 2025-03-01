import mongoose, { Schema, Document } from "mongoose";

interface IAttribute {
  value: number;
  displayName?: string;
}

interface IWound {
  limit: number;
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
    wounds: {
      Damage: {
        limit: { type: Number, required: true },
        current: { type: Number, default: 0 },
        displayName: { type: String, default: "Damage" },
      },
      Fatigue: {
        limit: { type: Number, required: true },
        current: { type: Number, default: 0 },
        displayName: { type: String, default: "Fatigue" },
      },
      Confusion: {
        limit: { type: Number, required: true },
        current: { type: Number, default: 0 },
        displayName: { type: String, default: "Confusion" },
      },
      Doubt: {
        limit: { type: Number, required: true },
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

// Pre-save hook to calculate wound limits based on attributes
CharacterSchema.pre("save", function (next) {
  this.wounds.Damage.limit = this.attributes.Strength.value;
  this.wounds.Fatigue.limit = this.attributes.Agility.value;
  this.wounds.Confusion.limit = this.attributes.Wits.value;
  this.wounds.Doubt.limit = this.attributes.Empathy.value;
  next();
});

const Character = mongoose.model<ICharacter>("Character", CharacterSchema);

export default Character;
