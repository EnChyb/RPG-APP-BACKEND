import mongoose, { Schema, Document } from "mongoose";

export interface IGear extends Document {
  _id: string;
  name: string;
  gearType: string;
  weight: number;
  description: string;
  bonusDescription: string;
  createdByUser: boolean;
}

const GearSchema: Schema = new Schema(
  {
    name: { type: String },
    gearType: { type: String },
    weight: { type: Number },
    description: { type: String },
    bonusDescription: { type: String },
    createdByUser: { type: Boolean },
  },
  { strict: false }
);

export default mongoose.model<IGear>("Gear", GearSchema);
