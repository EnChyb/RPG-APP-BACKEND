import mongoose, { Schema, Document } from "mongoose";

export interface ITalent extends Document {
  _id: string;
  name: string;
  description: string;
  bonus: number;
  level?: number;
  talentType: string;
  createdByUser: boolean;
}

const TalentSchema: Schema = new Schema(
  {
    name: { type: String },
    description: { type: String },
    bonus: { type: Number },
    level: { type: Number },
    talentType: { type: String },
    createdByUser: { type: Boolean },
  },
  { strict: false }
);

export default mongoose.model<ITalent>("Talent", TalentSchema);
