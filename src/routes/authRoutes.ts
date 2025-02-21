import express from "express";
import {
  register,
  login,
  getUser,
  updateUser,
  logoutUser,
} from "../controllers/User/index.js";
import protect from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.post("/register", upload.single("avatar"), register);
router.post("/login", login);
router.get("/current", protect, getUser);
router.patch("/update", protect, upload.single("avatar"), updateUser);
router.post("/logout", protect, logoutUser);

export default router;
