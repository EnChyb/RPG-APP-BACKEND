import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import User from "../../models/User.js";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    avatar?: string;
  };
}

const updateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { firstName, lastName, email, password, role, avatar } = req.body;
    const userId = req.user.id;
    console.log("req.body:", req.body);

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser.id.toString() !== userId) {
        res.status(400).json({ message: "Email is already in use" });
        return;
      }
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (avatar) user.avatar = avatar; // Aktualizacja avatara, jeśli przesłano nowy
    if (role) user.role = role;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();
    res.json({ message: "User updated successfully", user });
  } catch (error) {
    next(error);
  }
};

export default updateUser;
