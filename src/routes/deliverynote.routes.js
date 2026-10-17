import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.js';
import { uploadMemory } from '../middleware/upload.js';
import { createDeliveryNoteSchema, signDeliveryNoteSchema } from '../validators/deliverynote.validator.js';
import {
    createDeliveryNote,
    getDeliveryNotes,
    getDeliveryNote,
    getPDF,
    signDeliveryNote,
    deleteDeliveryNote,
} from '../controllers/deliverynote.controller.js';

const router = Router();

router.use(authMiddleware);

/**
 * @openapi
 * /deliverynote:
 *   post:
 *     summary: Crear albarán
 *     tags: [DeliveryNotes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [deliveryNoteNumber, project, clientId]
 *             properties:
 *               deliveryNoteNumber: { type: string }
 *               project:            { type: string }
 *               clientId:           { type: string }
 *               format:             { type: string, enum: [hours, materials] }
 *               hours:              { type: number }
 *               quantity:           { type: number }
 *               description:        { type: string }
 *     responses:
 *       201: { description: Albarán creado }
 *       400: { description: Error de validación }
 */
router.post('/', validate(createDeliveryNoteSchema), createDeliveryNote);

/**
 * @openapi
 * /deliverynote:
 *   get:
 *     summary: Listar albaranes
 *     tags: [DeliveryNotes]
 *     parameters:
 *       - in: query
 *         name: project
 *         schema: { type: string }
 *       - in: query
 *         name: clientId
 *         schema: { type: string }
 *       - in: query
 *         name: pending
 *         schema: { type: boolean }
 *     responses:
 *       200: { description: Lista de albaranes }
 */
router.get('/', getDeliveryNotes);

/**
 * @openapi
 * /deliverynote/{id}:
 *   get:
 *     summary: Obtener albarán por ID
 *     tags: [DeliveryNotes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Albarán }
 *       404: { description: No encontrado }
 */
router.get('/:id', getDeliveryNote);

/**
 * @openapi
 * /deliverynote/{id}/pdf:
 *   get:
 *     summary: Descargar PDF del albarán
 *     tags: [DeliveryNotes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: PDF del albarán
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404: { description: No encontrado }
 */
router.get('/:id/pdf', getPDF);

/**
 * @openapi
 * /deliverynote/{id}/sign:
 *   patch:
 *     summary: Firmar albarán
 *     tags: [DeliveryNotes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sign]
 *             properties:
 *               sign: { type: string, description: Base64 o texto de firma }
 *     responses:
 *       200: { description: Albarán firmado }
 *       404: { description: No encontrado o ya firmado }
 */
router.patch('/:id/sign', uploadMemory.single('sign'), validate(signDeliveryNoteSchema), signDeliveryNote);

/**
 * @openapi
 * /deliverynote/{id}:
 *   delete:
 *     summary: Eliminar albarán (solo si no está firmado)
 *     tags: [DeliveryNotes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Eliminado }
 *       404: { description: No encontrado }
 *       409: { description: No se puede eliminar un albarán firmado }
 */
router.delete('/:id', deleteDeliveryNote);

export default router;
