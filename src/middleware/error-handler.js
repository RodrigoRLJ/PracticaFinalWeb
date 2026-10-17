// src/middleware/error-handler.js
import mongoose from 'mongoose';
import { sendSlackError } from '../services/slack.service.js';

export const notFound = (req, res, next) => {
    res.status(404).json({
        error: true,
        message: `Ruta ${req.method} ${req.originalUrl} no encontrada`
    });
};

export const errorHandler = (err, req, res, next) => {
    console.error('❌ Error:', err.message);

    // Mongoose ValidationError
    if (err instanceof mongoose.Error.ValidationError) {
        const details = Object.values(err.errors).map(e => ({
            field: e.path,
            message: e.message
        }));
        return res.status(400).json({ error: true, message: 'Error de validación', details });
    }

    // Mongoose CastError (ID inválido)
    if (err instanceof mongoose.Error.CastError) {
        return res.status(400).json({
            error: true,
            message: `Valor inválido para '${err.path}'`
        });
    }

    // Duplicate key (email o CIF duplicado)
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0];
        return res.status(409).json({
            error: true,
            message: `Ya existe un registro con ese '${field}'`
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: true, message: 'Token inválido' });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: true, message: 'Token expirado' });
    }

    // AppError operacional
    if (err.isOperational) {
        return res.status(err.statusCode).json({ error: true, message: err.message });
    }

    // Error genérico
    sendSlackError({
        method: req.method,
        path: req.originalUrl,
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString(),
    });
    res.status(500).json({
        error: true,
        message: process.env.NODE_ENV === 'production'
            ? 'Error interno del servidor'
            : err.message
    });
};
