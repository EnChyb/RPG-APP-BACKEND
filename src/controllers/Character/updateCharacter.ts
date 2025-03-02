import { RequestHandler } from "express";
import Character from "../../models/Character.js";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware.js";

export const updateCharacter: RequestHandler = async (
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

    Object.assign(character, req.body);
    await character.save();
    res.json({ message: "Character updated", character });
  } catch (error) {
    next(error);
  }
};
