import mongoose, { Schema, Document } from "mongoose";

export interface IWeapon extends Document {
  _id: string;
  name: {
    pl: string;
    en: string;
  };
  grip: number;
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
  range: number;
  description: {
    pl: string;
    en: string;
  };
  createdByUser: boolean;
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
  range: { type: Number, required: true },
  description: {
    pl: { type: String },
    en: { type: String },
  },
  createdByUser: { type: Boolean, default: false },
});

export default mongoose.model<IWeapon>("Weapon", WeaponSchema, "weapons");
