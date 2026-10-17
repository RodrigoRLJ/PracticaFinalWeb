// src/middleware/role.middleware.js
import { handleHttpError } from '../utils/AppError.js';

const checkRole = (roles) => (req, res, next) => {
    try {
        if (!roles.includes(req.user.role)) {
            return handleHttpError(res, 'No tienes permisos para esta acción', 403);
        }
        next();
    } catch {
        handleHttpError(res, 'Error de autorización', 403);
    }
};

export default checkRole;
