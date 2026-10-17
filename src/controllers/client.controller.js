import Client from '../models/Client.js';
import { handleHttpError } from '../utils/AppError.js';
import { getIO } from '../config/socket.js';

// POST /api/client
export const createClient = async (req, res, next) => {
    try {
        if (!req.user.company) return handleHttpError(res, 'Usuario sin empresa asignada', 400);

        const client = await Client.create({
            ...req.validated,
            company: req.user.company,
            user: req.user._id,
        });

        getIO()?.to(req.user.company.toString()).emit('client:new', { client });
        res.status(201).json({ client });
    } catch (err) {
        next(err);
    }
};

// PUT /api/client/:id
export const updateClient = async (req, res, next) => {
    try {
        const client = await Client.findOneAndUpdate(
            { _id: req.params.id, company: req.user.company, deleted: false },
            req.validated,
            { new: true, runValidators: true }
        );

        if (!client) return handleHttpError(res, 'Cliente no encontrado', 404);

        res.json({ client });
    } catch (err) {
        next(err);
    }
};

// GET /api/client
export const getClients = async (req, res, next) => {
    try {
        if (!req.user.company) return handleHttpError(res, 'Usuario sin empresa asignada', 400);

        const clients = await Client.find({
            company: req.user.company,
            deleted: false,
        }).sort({ createdAt: -1 });

        res.json({ clients });
    } catch (err) {
        next(err);
    }
};

// GET /api/client/:id
export const getClient = async (req, res, next) => {
    try {
        const client = await Client.findOne({
            _id: req.params.id,
            company: req.user.company,
            deleted: false,
        });

        if (!client) return handleHttpError(res, 'Cliente no encontrado', 404);

        res.json({ client });
    } catch (err) {
        next(err);
    }
};

// DELETE /api/client/:id
export const deleteClient = async (req, res, next) => {
    try {
        const client = await Client.findOneAndUpdate(
            { _id: req.params.id, company: req.user.company, deleted: false },
            { deleted: true },
            { new: true }
        );

        if (!client) return handleHttpError(res, 'Cliente no encontrado', 404);

        res.json({ message: 'Cliente eliminado correctamente' });
    } catch (err) {
        next(err);
    }
};

// PATCH /api/client/:id/archive
export const archiveClient = async (req, res, next) => {
    try {
        const client = await Client.findOneAndUpdate(
            { _id: req.params.id, company: req.user.company, deleted: false },
            { active: false },
            { new: true }
        );

        if (!client) return handleHttpError(res, 'Cliente no encontrado', 404);

        res.json({ message: 'Cliente archivado correctamente', client });
    } catch (err) {
        next(err);
    }
};

// PATCH /api/client/:id/restore
export const restoreClient = async (req, res, next) => {
    try {
        const client = await Client.findOneAndUpdate(
            { _id: req.params.id, company: req.user.company, deleted: false },
            { active: true },
            { new: true }
        );

        if (!client) return handleHttpError(res, 'Cliente no encontrado', 404);

        res.json({ message: 'Cliente restaurado correctamente', client });
    } catch (err) {
        next(err);
    }
};
