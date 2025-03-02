import { RequestHandler } from "express";
import Character from "../../models/Character.js";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware.js";

export const deleteCharacter: RequestHandler = async (
  req: AuthenticatedRequest,
  res,
  next
) => {
  try {
    const character = await Character.findById(req.params.id);
    if (!character) {
      res.status(404).json({ message: "Character not found" });
      return;
    }

    if (character.owner.toString() !== req.user?.id) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    await character.deleteOne();
    res.json({ message: "Character deleted" });
  } catch (error) {
    next(error);
  }
};
