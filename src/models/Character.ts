import mongoose, { Schema, Document } from "mongoose";
import { IWeapon } from "./Weapon.js";
import { IArmor } from "./Armor.js";
import { IGear } from "./Gear.js";

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
  _id: string;
  name: string;
  description: string;
  bonus: number;
  level: number;
  talentType: string;
  createdByUser: boolean;
}

export interface ICharacter extends Document {
  _id: String;
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
    Weapons: IWeapon[];
    Armor: IArmor[];
    Gears: IGear[];
  };
  GameMaster: string;
  owner: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CharacterSchema = new Schema<ICharacter>(
  {
    name: { type: String, required: true },
    age: { type: String, enum: ["Young", "Adult", "Old"], required: true },
    archetype: { type: String, required: true },
    race: { type: String, required: true },
    avatar: { type: String, default: "../assets/img/avatar-placeholder.png" },
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
      type: [
        {
          _id: { type: String },
          name: { type: String },
          description: { type: String },
          bonus: { type: Number },
          level: { type: Number },
          talentType: { type: String },
          createdByUser: { type: Boolean },
        },
      ],
      default: [],
    },
    items: {
      Weapons: {
        type: [
          {
            _id: { type: String },
            name: { type: String },
            grip: { type: Number },
            damageType: { type: String },
            extraDiceOffence: { type: Number },
            extraDiceDefence: { type: Number },
            diceType: { type: Number },
            weight: { type: Number },
            damage: { type: Number },
            range: { type: Number },
            description: { type: String },
            createdByUser: { type: Boolean },
          },
        ],
        default: [],
      },
      Armor: {
        type: [
          {
            _id: { type: String },
            name: { type: String },
            bodyPart: { type: String },
            armorType: { type: String },
            weight: { type: Number },
            defence: { type: Number },
            description: { type: String },
            createdByUser: { type: Boolean },
          },
        ],
        default: [],
      },
      Gears: {
        type: [
          {
            _id: { type: String },
            name: { type: String },
            gearType: { type: String },
            weight: { type: Number },
            description: { type: String },
            bonusDescription: { type: String },
            createdByUser: { type: Boolean },
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
