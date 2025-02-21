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
    avatar: { type: String, default: "https://www.gravatar.com/avatar/" },
    token: { type: String, default: null },
  },
  { timestamps: true }
);

const User = mongoose.model<IUser>("user", UserSchema, "users");

export default User;
