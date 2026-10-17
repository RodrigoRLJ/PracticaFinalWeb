import DeliveryNote from '../models/DeliveryNote.js';
import IdempotencyLog from '../models/IdempotencyLog.js';
import { handleHttpError } from '../utils/AppError.js';
import { generateDeliveryNotePDF } from '../services/pdf.service.js';
import { getIO } from '../config/socket.js';
import { uploadSignatureImage } from '../services/storage.service.js';

// POST /api/deliverynote
export const createDeliveryNote = async (req, res, next) => {
    try {
        if (!req.user.company) return handleHttpError(res, 'Usuario sin empresa asignada', 400);

        const note = await DeliveryNote.create({
            ...req.validated,
            company: req.user.company,
            user: req.user._id,
        });

        getIO()?.to(req.user.company.toString()).emit('deliverynote:new', { note });
        res.status(201).json({ note });
    } catch (err) {
        next(err);
    }
};

// GET /api/deliverynote
export const getDeliveryNotes = async (req, res, next) => {
    try {
        if (!req.user.company) return handleHttpError(res, 'Usuario sin empresa asignada', 400);

        const filter = { company: req.user.company, deleted: false };

        if (req.query.project)  filter.project  = req.query.project;
        if (req.query.clientId) filter.clientId = req.query.clientId;
        if (req.query.pending !== undefined) filter.pending = req.query.pending === 'true';

        const notes = await DeliveryNote.find(filter)
            .populate('project', 'name projectCode')
            .populate('clientId', 'name cif')
            .sort({ createdAt: -1 });

        res.json({ notes });
    } catch (err) {
        next(err);
    }
};

// GET /api/deliverynote/:id
export const getDeliveryNote = async (req, res, next) => {
    try {
        const note = await DeliveryNote.findOne({
            _id: req.params.id,
            company: req.user.company,
            deleted: false,
        })
            .populate('project', 'name projectCode')
            .populate('clientId', 'name cif');

        if (!note) return handleHttpError(res, 'Albarán no encontrado', 404);

        res.json({ note });
    } catch (err) {
        next(err);
    }
};

// GET /api/deliverynote/:id/pdf
export const getPDF = async (req, res, next) => {
    try {
        const note = await DeliveryNote.findOne({
            _id: req.params.id,
            company: req.user.company,
            deleted: false,
        })
            .populate('project')
            .populate('clientId');

        if (!note) return handleHttpError(res, 'Albarán no encontrado', 404);

        const pdfBuffer = await generateDeliveryNotePDF(note);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="albaran-${note.deliveryNoteNumber}.pdf"`,
            'Content-Length': pdfBuffer.length,
        });

        res.end(pdfBuffer);
    } catch (err) {
        next(err);
    }
};

// PATCH /api/deliverynote/:id/sign
export const signDeliveryNote = async (req, res, next) => {
    try {
        let signValue = req.validated?.sign;

        if (req.file) {
            signValue = await uploadSignatureImage(req.file.buffer);
        }

        if (!signValue) return handleHttpError(res, 'Firma requerida (campo sign o archivo)', 400);

        const note = await DeliveryNote.findOneAndUpdate(
            { _id: req.params.id, company: req.user.company, deleted: false, pending: true },
            { sign: signValue, pending: false },
            { new: true }
        );

        if (!note) return handleHttpError(res, 'Albarán no encontrado o ya firmado', 404);

        getIO()?.to(req.user.company.toString()).emit('deliverynote:signed', { note });
        res.json({ note });
    } catch (err) {
        next(err);
    }
};

// DELETE /api/deliverynote/:id
export const deleteDeliveryNote = async (req, res, next) => {
    try {
        const existing = await DeliveryNote.findOne({
            _id: req.params.id,
            company: req.user.company,
            deleted: false,
        });

        if (!existing) return handleHttpError(res, 'Albarán no encontrado', 404);
        if (!existing.pending) return handleHttpError(res, 'No se puede eliminar un albarán firmado', 409);

        existing.deleted = true;
        await existing.save();

        res.json({ message: 'Albarán eliminado correctamente' });
    } catch (err) {
        next(err);
    }
};
