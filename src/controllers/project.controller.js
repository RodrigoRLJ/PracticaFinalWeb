import Project from '../models/Project.js';
import { handleHttpError } from '../utils/AppError.js';
import { getIO } from '../config/socket.js';

// POST /api/project
export const createProject = async (req, res, next) => {
    try {
        if (!req.user.company) return handleHttpError(res, 'Usuario sin empresa asignada', 400);

        const project = await Project.create({
            ...req.validated,
            company: req.user.company,
            user: req.user._id,
        });

        getIO()?.to(req.user.company.toString()).emit('project:new', { project });
        res.status(201).json({ project });
    } catch (err) {
        next(err);
    }
};

// PUT /api/project/:id
export const updateProject = async (req, res, next) => {
    try {
        const project = await Project.findOneAndUpdate(
            { _id: req.params.id, company: req.user.company, deleted: false },
            req.validated,
            { new: true, runValidators: true }
        );

        if (!project) return handleHttpError(res, 'Proyecto no encontrado', 404);

        res.json({ project });
    } catch (err) {
        next(err);
    }
};

// GET /api/project
export const getProjects = async (req, res, next) => {
    try {
        if (!req.user.company) return handleHttpError(res, 'Usuario sin empresa asignada', 400);

        const filter = { company: req.user.company, deleted: false };

        if (req.query.clientId) filter.clientId = req.query.clientId;
        if (req.query.status)   filter.status = req.query.status;
        if (req.query.name)     filter.name = { $regex: req.query.name, $options: 'i' };

        const projects = await Project.find(filter)
            .populate('clientId', 'name cif')
            .sort({ createdAt: -1 });

        res.json({ projects });
    } catch (err) {
        next(err);
    }
};

// GET /api/project/:id
export const getProject = async (req, res, next) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            company: req.user.company,
            deleted: false,
        }).populate('clientId', 'name cif');

        if (!project) return handleHttpError(res, 'Proyecto no encontrado', 404);

        res.json({ project });
    } catch (err) {
        next(err);
    }
};

// DELETE /api/project/:id
export const deleteProject = async (req, res, next) => {
    try {
        const project = await Project.findOneAndUpdate(
            { _id: req.params.id, company: req.user.company, deleted: false },
            { deleted: true },
            { new: true }
        );

        if (!project) return handleHttpError(res, 'Proyecto no encontrado', 404);

        res.json({ message: 'Proyecto eliminado correctamente' });
    } catch (err) {
        next(err);
    }
};
