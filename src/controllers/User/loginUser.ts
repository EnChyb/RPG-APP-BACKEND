import { RequestHandler } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../../models/User.js";

const login: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const isMatch = user.password
      ? await bcrypt.compare(password, user.password)
      : false;
    if (!isMatch) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "1d",
    });

    user.token = token;
    await user.save();

    res.json({
      user: {
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email,
        role: user.role,
        avatar: user.avatar,
        token: token,
      },
    });
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export default login;
