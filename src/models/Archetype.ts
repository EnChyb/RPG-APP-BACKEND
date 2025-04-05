import mongoose, { Schema, Document } from "mongoose";

export interface IArchetype extends Document {
  _id: string;
  name: {
    pl: string;
    en: string;
  };
  attribute: {
    pl: string;
    en: string;
  };
  description: {
    pl: string;
    en: string;
  };
  classSkill: {
    pl: string;
    en: string;
  };
  addSkills: {
    skill1: {
      pl: string;
      en: string;
    };
    skill2: {
      pl: string;
      en: string;
    };
  };
  createdByUser: boolean;
}

export const ArchetypeSchema: Schema = new Schema({
  name: {
    pl: { type: String },
    en: { type: String },
  },
  attribute: {
    pl: { type: String },
    en: { type: String },
  },
  description: {
    pl: { type: String },
    en: { type: String },
  },
  classSkill: {
    pl: { type: String },
    en: { type: String },
  },
  addSkills: {
    skill1: {
      pl: { type: String },
      en: { type: String },
    },
    skill2: {
      pl: { type: String },
      en: { type: String },
    },
  },
  createdByUser: { type: Boolean, default: false },
});

export default mongoose.model<IArchetype>("Archetype", ArchetypeSchema, "archetypes");
