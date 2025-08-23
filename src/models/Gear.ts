import mongoose, { Schema, Document } from "mongoose";

export interface IGear extends Document {
  _id: string;
  name: {
    pl: string;
    en: string;
  };
  gearType: {
    pl: string;
    en: string;
  };
  weight: number;
  description: {
    pl: string;
    en: string;
  };
  bonusDescription: {
    pl: string;
    en: string;
  };
  price: number;
  createdByUser: boolean;
}

export const GearSchema: Schema = new Schema({
  name: {
    pl: { type: String },
    en: { type: String },
  },
  gearType: {
    pl: { type: String },
    en: { type: String },
  },
  weight: { type: Number, required: true },
  description: {
    pl: { type: String },
    en: { type: String },
  },
  bonusDescription: {
    pl: { type: String },
    en: { type: String },
  },
  price: { type: Number, required: true, default: 0 },
  createdByUser: { type: Boolean, default: false },
});

export default mongoose.model<IGear>("Gear", GearSchema, "gear");
