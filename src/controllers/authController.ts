import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";

export const register = async (req: Request, res: Response): Promise<any> => {
  const { firstName, lastName, email, password, role } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists)
    return res
      .status(409)
      .json({ message: "User with this email address already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    role,
  });

  res.json({ message: "User registered successfully", user });
};

export const login = async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (
    !user ||
    !user.password ||
    !(await bcrypt.compare(password, user.password))
  )
    return res.status(401).json({ message: "Invalid email or password" });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
    expiresIn: "1d",
  });
  res.json({
    token,
    user: {
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
  });
};
