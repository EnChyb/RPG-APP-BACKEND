// src/middlewares/socketAuthMiddleware.ts
import { Socket } from "socket.io";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../models/User.js";

interface DecodedToken extends JwtPayload {
    userId: string;
}

export async function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void) {
    const token = socket.handshake.auth.token || socket.handshake.query.token as string;
    if (!token) {
        return next(new Error("Unauthorized: No token"));
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
        // Pobieramy użytkownika z bazy – analogicznie do middleware Express
        const user = await User.findById(decoded.userId).lean();
        if (!user) {
            return next(new Error("Unauthorized: User not found"));
        }
        // Zapisujemy dane użytkownika w obiekcie socket.data
        socket.data.user = user;
        next();
    } catch (err) {
        return next(new Error("Unauthorized: Invalid token"));
    }
}
