import { RequestHandler } from "express";
import Character from "../../models/Character.js";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware.js";

export const getCharacter: RequestHandler = async (
  req: AuthenticatedRequest,
  res,
  next
) => {
  try {
    const character = await Character.findById(req.params.id).populate(
      "owner",
      "email"
    );
    if (!character) {
      res.status(404).json({ message: "Character not found" });
      return;
    }
    res.json(character);
  } catch (error) {
    next(error);
  }
};
