import { RequestHandler, Request } from "express";

interface AuthenticatedRequest extends Request {
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

const getUser: RequestHandler = async (
  req: AuthenticatedRequest,
  res,
  next
): Promise<void> => {
  // try {
  //   const user = req.user;
  //   res.json({ user });
  // } catch (error) {
  //   next(error);
  //   console.log(error);
  // }
  try {
    console.log("Inside getUser, req.user:", req.user);
    if (!req.user) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }
    res.json({ user: req.user });
  } catch (error) {
    next(error);
    console.log(error);
  }
};

export default getUser;
