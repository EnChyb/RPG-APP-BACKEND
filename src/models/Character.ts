import mongoose, { Schema, Document } from "mongoose";
import { TalentSchema, ITalent } from "./Talent.js";
import { WeaponSchema, IWeapon } from "./Weapon.js";
import { ArmorSchema, IArmor } from "./Armor.js";
import { GearSchema, IGear } from "./Gear.js";

interface IAttribute {
  value: number;
  displayName?: string;
}

interface IWound {
  current: number;
  displayName: string;
}

export interface ISkill {
  displayName: string;
  value: number;
  linkedAttribute: "Strength" | "Agility" | "Wits" | "Empathy";
}

export interface ICharacter extends Document {
  _id: string;
  avatar: string;
  name: string;
  characterType: "Hero" | "NPC" | "Monster";
  age?: {
    en: "Young" | "Adult" | "Old";
    pl: string;
  };
  archetype?: string;
  race?: string;
  species?: string;
  RPGSystem: string;
  appearance: string;
  history: string;
  bigDream: string;
  gold: number;
  characterLevel: number;
  experiencePoints: number;
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
    weapons: IWeapon[];
    armor: IArmor[];
    gears: IGear[];
  };
  GameMaster: string;
  owner: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CharacterSchema = new Schema<ICharacter>(
  {
    name: { type: String, required: true },
    age: {
      en: { type: String, enum: ["Young", "Adult", "Old"] },
      pl: { type: String },
    },
    characterType: {
      type: String,
      enum: ["Hero", "NPC", "Monster"],
      default: "Hero",
      required: true,
    },
    archetype: { type: String},
    race: { type: String },
    species: { type: String },
    avatar: { type: String, default: "../assets/img/avatar-placeholder.png" },
    RPGSystem: { type: String, default: "Year Zero Engine", required: true },
    appearance: { type: String, required: false },
    history: { type: String, required: false },
    bigDream: { type: String, required: false },
    gold: { type: Number, default: 0 },
    characterLevel: { type: Number, default: 1 },
    experiencePoints: { type: Number, default: 0 },
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
      type: [TalentSchema],
      default: [],
    },
    items: {
      weapons: {
        type: [WeaponSchema
        ],
        default: [],
      },
      armor: {
        type: [ArmorSchema],
        default: [],
      },
      gears: {
        type: [GearSchema],
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
