import express from "express";
import {
  register,
  login,
  getUser,
  updateUser,
  logoutUser,
} from "../controllers/User/index.js";
import protect from "../middlewares/authMiddleware.js";
import uploadAvatar from "../middlewares/avatarMiddleware.js";

const router = express.Router();

router.post("/register", uploadAvatar, register);
router.post("/login", login);
router.get("/current", protect, getUser);
router.patch("/update", protect, uploadAvatar, updateUser);
router.post("/logout", protect, logoutUser);

export default router;
