// models/DiscardedItem.ts
import mongoose, { Schema, Document } from "mongoose";
import { IWeapon } from "./Weapon.js";
import { IArmor } from "./Armor.js";
import { IGear } from "./Gear.js";

export type DiscardedItemType = "weapons" | "armor" | "gear";

interface DiscardedItemDocument extends Document {
  type: DiscardedItemType;
  item: IWeapon | IArmor | IGear;
  fromCharacterId: string;
  createdAt: Date;
}

const DiscardedItemSchema = new Schema<DiscardedItemDocument>({
  type: {
    type: String,
    enum: ["weapons", "armor", "gear"],
    required: true,
  },
  item: {
    type: Object,
    required: true,
  },
  fromCharacterId: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<DiscardedItemDocument>("DiscardedItem", DiscardedItemSchema, "discardedItem");