// src/utils/AppError.js

class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;  // distingue errores nuestros de bugs inesperados
    }
}

export const handleHttpError = (res, message = 'Error interno', code = 500) => {
    res.status(code).json({
        error: true,
        message
    });
};

export default AppError;
