// src/middlewares/socketAuthMiddleware.ts
import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void) {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
        return next(new Error("Unauthorized: No token"));
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!);
        // Pobieramy użytkownika z bazy – analogicznie do middleware Express
        const user = await User.findById((decoded as any).userId).lean();
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
