import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, enum: ["gm", "player"], default: "player" },
  },
  { timestamps: true }
);

export default mongoose.model("user", UserSchema, "users");
