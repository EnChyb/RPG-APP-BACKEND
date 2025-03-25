import mongoose, { Schema, Document } from "mongoose";

export interface IArmor extends Document {
  _id: string;
  name: string;
  bodyPart: string;
  armorType: string;
  weight: number;
  defence: number;
  description: string;
  createdByUser: boolean;
}

const ArmorSchema: Schema = new Schema(
  {
    name: { type: String },
    bodyPart: { type: String },
    armorType: { type: String },
    weight: { type: Number },
    defence: { type: Number },
    description: { type: String },
    createdByUser: { type: Boolean },
  },
  { strict: false }
);

export default mongoose.model<IArmor>("Armor", ArmorSchema, "armor");
