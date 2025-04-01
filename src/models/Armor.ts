import mongoose, { Schema, Document } from "mongoose";

export interface IArmor extends Document {
  _id: string;
  name: {
    pl: string;
    en: string;
  };
  bodyPart: {
    pl: string;
    en: string;
  };
  armorType: {
    pl: string;
    en: string;
  };
  weight: number;
  defence: number;
  description: {
    pl: string;
    en: string;
  };
  createdByUser: boolean;
}

export const ArmorSchema: Schema = new Schema({
  name: {
    pl: { type: String },
    en: { type: String },
  },
  bodyPart: {
    pl: { type: String },
    en: { type: String },
  },
  armorType: {
    pl: { type: String },
    en: { type: String },
  },
  weight: { type: Number, required: true },
  defence: { type: Number, required: true },
  description: {
    pl: { type: String },
    en: { type: String },
  },
  createdByUser: { type: Boolean, default: false },
});

export default mongoose.model<IArmor>("Armor", ArmorSchema, "armor");
