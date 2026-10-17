// src/middleware/auth.middleware.js
import User from '../models/User.js';
import { verifyToken } from '../utils/handleJWT.js';
import { handleHttpError } from '../utils/AppError.js';

const authMiddleware = async (req, res, next) => {
    try {
        if (!req.headers.authorization) {
            return handleHttpError(res, 'Token no proporcionado', 401);
        }

        const token = req.headers.authorization.split(' ').pop();

        const payload = verifyToken(token);

        if (!payload?._id) {
            return handleHttpError(res, 'Token inválido', 401);
        }

        const user = await User.findById(payload._id);

        if (!user) {
            return handleHttpError(res, 'Usuario no encontrado', 401);
        }

        if (user.deleted) {
            return handleHttpError(res, 'Cuenta eliminada', 401);
        }

        req.user = user;
        next();
    } catch {
        handleHttpError(res, 'Error de autenticación', 401);
    }
};

export default authMiddleware;
