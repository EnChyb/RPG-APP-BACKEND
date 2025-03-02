import { Response, NextFunction } from "express";
import User from "../../models/User.js";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware.js";

const logout = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    user.token = null;
    await user.save();

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

export default logout;
