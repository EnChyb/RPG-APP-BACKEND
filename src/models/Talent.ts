import mongoose, { Schema, Document } from "mongoose";

export interface ITalent extends Document {
  _id: string;
  name: {
    pl: string;
    en: string;
  };
  description: {
    pl: string;
    en: string;
  };
  bonus: number;
  level: number;
  talentType: {
    pl: string;
    en: string;
  };
  createdByUser: boolean;
}

export const TalentSchema: Schema = new Schema({
  name: {
    pl: { type: String },
    en: { type: String },
  },
  description: {
    pl: { type: String },
    en: { type: String },
  },
  bonus: { type: Number, required: true },
  level: { type: Number, default: 1 },
  talentType: {
    pl: { type: String },
    en: { type: String },
  },
  createdByUser: { type: Boolean, default: false },
});

export default mongoose.model<ITalent>("Talent", TalentSchema, "talents");
