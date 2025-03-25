import mongoose, { Schema, Document } from "mongoose";

export interface IWeapon extends Document {
  _id: string;
  name: string;
  grip: number;
  damageType: string;
  extraDiceOffence: number;
  extraDiceDefence: number;
  diceType: number;
  weight: number;
  damage: number;
  range: number;
  description: string;
  createdByUser: boolean;
}

const WeaponSchema: Schema = new Schema(
  {
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
  { strict: false }
);

export default mongoose.model<IWeapon>("Weapon", WeaponSchema);
