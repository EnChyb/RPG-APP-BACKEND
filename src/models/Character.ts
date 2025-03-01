import mongoose, { Schema, Document } from "mongoose";

interface IAttribute {
  value: number;
  displayName?: string;
}

interface ISkill {
  value: number;
  linkedAttribute?: string;
  displayName?: string;
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
  appearance?: string;
  bigDream?: string;
  willpower: { value: number; displayName: string };
  attributes: {
    Strength: IAttribute;
    Agility: IAttribute;
    Wits: IAttribute;
    Empathy: IAttribute;
  };
  skills: {
    Craft: ISkill;
    Endure: ISkill;
    Fight: ISkill;
    Sneak: ISkill;
    Move: ISkill;
    Shoot: ISkill;
    Scout: ISkill;
    Comprehend: ISkill;
    Survive: ISkill;
    Manipulate: ISkill;
    SenseEmotion: ISkill;
    Heal: ISkill;
    additionalSkill?: ISkill;
  };
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
      Craft: {
        value: Number,
        displayName: { type: String, default: "Craft" },
        linkedAttribute: { type: String },
      },
      Endure: {
        value: Number,
        displayName: { type: String, default: "Endure" },
        linkedAttribute: { type: String },
      },
      Fight: {
        value: Number,
        displayName: { type: String, default: "Fight" },
        linkedAttribute: { type: String },
      },
      Sneak: {
        value: Number,
        displayName: { type: String, default: "Sneak" },
        linkedAttribute: { type: String },
      },
      Move: {
        value: Number,
        displayName: { type: String, default: "Move" },
        linkedAttribute: { type: String },
      },
      Shoot: {
        value: Number,
        displayName: { type: String, default: "Shoot" },
        linkedAttribute: { type: String },
      },
      Scout: {
        value: Number,
        displayName: { type: String, default: "Scout" },
        linkedAttribute: { type: String },
      },
      Comprehend: {
        value: Number,
        displayName: { type: String, default: "Comprehend" },
        linkedAttribute: { type: String },
      },
      Survive: {
        value: Number,
        displayName: { type: String, default: "Survive" },
        linkedAttribute: { type: String },
      },
      Manipulate: {
        value: Number,
        displayName: { type: String, default: "Manipulate" },
        linkedAttribute: { type: String },
      },
      SenseEmotion: {
        value: Number,
        displayName: { type: String, default: "Sense Emotion" },
        linkedAttribute: { type: String },
      },
      Heal: {
        value: Number,
        displayName: { type: String, default: "Heal" },
        linkedAttribute: { type: String },
      },
      additionalSkill: {
        value: Number,
        displayName: String,
        linkedAttribute: { type: String },
      },
    },
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

// Automatically assign `linkedAttribute` to skills before saving
CharacterSchema.pre("save", function (next) {
  const skillToAttributeMap: Record<
    Exclude<keyof ICharacter["skills"], "additionalSkill">,
    "Strength" | "Agility" | "Wits" | "Empathy"
  > = {
    Craft: "Strength",
    Endure: "Strength",
    Fight: "Strength",
    Sneak: "Agility",
    Move: "Agility",
    Shoot: "Agility",
    Scout: "Wits",
    Comprehend: "Wits",
    Survive: "Wits",
    Manipulate: "Empathy",
    SenseEmotion: "Empathy",
    Heal: "Empathy",
  };

  Object.keys(skillToAttributeMap).forEach((skill) => {
    const skillKey = skill as keyof typeof skillToAttributeMap;
    if (this.skills && this.skills[skillKey]) {
      this.skills[skillKey].linkedAttribute = skillToAttributeMap[skillKey];
    }
  });

  if (this.skills?.additionalSkill) {
    if (!this.skills.additionalSkill.linkedAttribute) {
      this.skills.additionalSkill.linkedAttribute = "Strength";
    }
  }

  next();
});

const Character = mongoose.model<ICharacter>("Character", CharacterSchema);

export default Character;
