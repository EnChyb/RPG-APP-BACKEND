import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// interface AuthenticatedRequest extends Request {
//   user?: {
//     firstName: string;
//     lastName: string;
//     email: string;
//     role: string;
//   };
// }

// const protect = (
//   req: AuthenticatedRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   const token = req.headers.authorization?.split(" ")[1]; // Expect "Bearer <token>"

//   if (!token) {
//     res.status(401).json({ error: "Unauthorized" });
//     return;
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
//     console.log("Decoded Token:", decoded);
//     req.user = {
//       firstName: decoded.firstName,
//       lastName: decoded.lastName,
//       email: decoded.email,
//       role: decoded.role,
//     };

//     console.log("Set req.user:", req.user);
//     next();
//   } catch (error) {
//     console.log("JWT Error:", error);
//     res.status(403).json({ error: "Invalid token" });
//     return;
//   }
// };

// export default protect;

const protect = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };
    req.body.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

export default protect;
