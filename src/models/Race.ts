import mongoose, { Schema, Document } from "mongoose";

export interface IRace extends Document {
  _id: string;
  name: {
    pl: string;
    en: string;
  };
  description: {
    pl: string;
    en: string;
  };
  appearance: {
    pl: string;
    en: string;
  };
  age: {
    pl: string;
    en: string;
  };
  characteristics: {
    strengths: {
      pl: string;
      en: string;
    };
    weaknesses: {
      pl: string;
      en: string;
    };
  };
  bonuses: {
    bonus1: {
      pl: string;
      en: string;
    };
    bonus2: {
      pl: string;
      en: string;
    };
  };
  createdByUser: boolean;
}

export const RaceSchema: Schema = new Schema({
  name: {
    pl: { type: String },
    en: { type: String },
  },
  description: {
    pl: { type: String },
    en: { type: String },
  },
  appearance: {
    pl: { type: String },
    en: { type: String },
  },
  age: {
    pl: { type: String },
    en: { type: String },
  },
  characteristics: {
    strengths: {
      pl: { type: String },
      en: { type: String },
    },
    weaknesses: {
      pl: { type: String },
      en: { type: String },
    },
  },
  bonuses: {
    bonus1: {
      pl: { type: String },
      en: { type: String },
    },
    bonus2: {
      pl: { type: String },
      en: { type: String },
    },
  },
  createdByUser: { type: Boolean, default: false },
});

export default mongoose.model<IRace>("Race", RaceSchema, "races");
