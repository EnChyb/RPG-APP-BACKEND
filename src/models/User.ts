import mongoose, { Document } from "mongoose";

interface IUser extends Document {
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  role: string;
  avatar: string;
  token: string | null;
}

const UserSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, enum: ["gm", "player"], default: "player" },
    avatar: { type: String, default: "../assets/img/avatar-placeholder.png" },
    token: { type: String, default: null },
  },
  { timestamps: true }
);

const User = mongoose.model<IUser>("User", UserSchema, "users");

export default User;
