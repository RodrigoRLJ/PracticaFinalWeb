import { Server } from 'socket.io';
import { verifyToken } from '../utils/handleJWT.js';
import User from '../models/User.js';

let _io;

export const initSocket = (httpServer) => {
    _io = new Server(httpServer, {
        cors: { origin: '*', methods: ['GET', 'POST'] },
    });

    _io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (!token) return next(new Error('Token no proporcionado'));

            const payload = verifyToken(token);
            if (!payload?._id) return next(new Error('Token inválido'));

            const user = await User.findById(payload._id);
            if (!user || user.deleted) return next(new Error('Usuario no encontrado'));
            if (!user.company) return next(new Error('Usuario sin empresa asignada'));

            socket.user = user;
            next();
        } catch {
            next(new Error('Error de autenticación'));
        }
    });

    _io.on('connection', (socket) => {
        const room = socket.user.company.toString();
        socket.join(room);
    });
};

export const getIO = () => _io;
