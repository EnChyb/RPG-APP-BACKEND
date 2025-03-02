import { RequestHandler } from "express";
import Character from "../../models/Character.js";
import { AuthenticatedRequest } from "../../middlewares/authMiddleware.js";

export const getAllCharacters: RequestHandler = async (
  req: AuthenticatedRequest,
  res,
  next
) => {
  try {
    const characters = await Character.find({ owner: req.user?.id });
    res.json(characters);
  } catch (error) {
    next(error);
  }
};
