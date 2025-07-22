import mongoose, { Schema, Document } from "mongoose";

export interface ISpecies extends Document {
  _id: string;
  name: {
    pl: string;
    en: string;
  };
  description: {
    pl: string;
    en: string;
  };
  createdByUser: boolean;
}

export const SpeciesSchema: Schema = new Schema({
  name: {
    pl: { type: String },
    en: { type: String },
  },
  description: {
    pl: { type: String },
    en: { type: String },
  },
  createdByUser: { type: Boolean, default: false },
});

export default mongoose.model<ISpecies>("Species", SpeciesSchema, "species");
