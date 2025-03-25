import { RequestHandler } from "express";
import bcrypt from "bcryptjs";
import User from "../../models/User.js";

const DEFAULT_AVATAR = "../../assets/img/avatar-placeholder.png";

const register: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { firstName, lastName, email, password, role, avatar } = req.body;
    console.log("avatar 1:", avatar);
    // Jeśli avatar nie został przesłany, ustaw domyślny avatar
    const userAvatar = avatar || DEFAULT_AVATAR;
    console.log("avatar 2:", userAvatar);
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(409).json({ message: "Email already in use" });
      return;
    }

    const newUser = new User({
      firstName,
      lastName,
      email,
      password: await bcrypt.hash(password, 10),
      role,
      avatar: userAvatar, // Avatar ustawiony na domyślny lub przesłany
    });

    // newUser.password = await bcrypt.hash(password, 10);
    await newUser.save();

    res.status(201).json({ message: "User registered successfully", newUser });
  } catch (error) {
    console.error("Error in register:", error);
    res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export default register;
