import mongoose, { Schema, Document } from "mongoose";
import { IArmor, ArmorSchema } from "./Armor.js";

export interface IWeapon extends Document {
  _id: string;
  name: {
    pl: string;
    en: string;
  };
  grip: 1 | 2;
  hand?: 'right' | 'left' | 'both';
  damageType: {
    pl: string;
    en: string;
  };
  extraDiceOffence: number;
  extraDiceDefence: number;
  diceType: number;
  weight: number;
  damage: number;
  defence?: number;
  range: number;
  description: {
    pl: string;
    en: string;
  };
  price: number;
  createdByUser: boolean;
  derivedFrom?: {
  collection: 'armor';
  mode: 'shield-as-weapon';
  armor: IArmor;
};
}

export const WeaponSchema: Schema = new Schema({
  name: {
    pl: { type: String },
    en: { type: String },
  },
  grip: { type: Number, required: true },
  hand: {
    type: String,
    enum: ["right", "left", "both"],
    required: false, // only needed when associated with character
  },
  damageType: {
    pl: { type: String },
    en: { type: String },
  },
  extraDiceOffence: { type: Number, required: true },
  extraDiceDefence: { type: Number, required: true },
  diceType: { type: Number, required: true },
  weight: { type: Number, required: true },
  damage: { type: Number, required: true },
  defence: { type: Number, required: false },
  range: { type: Number, required: true },
  description: {
    pl: { type: String },
    en: { type: String },
  },
  price: { type: Number, required: true, default: 0 },
  createdByUser: { type: Boolean, default: false },
  derivedFrom: {
      collection: { type: String, enum: ["armor"], required: false },
      mode: { type: String, enum: ["shield-as-weapon"], required: false },
      armor: { type: ArmorSchema, required: false },
    },
  },
);

export default mongoose.model<IWeapon>("Weapon", WeaponSchema, "weapons");
