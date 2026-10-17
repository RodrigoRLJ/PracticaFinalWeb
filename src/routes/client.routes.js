import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.js';
import { createClientSchema, updateClientSchema } from '../validators/client.validator.js';
import {
    createClient,
    updateClient,
    getClients,
    getClient,
    deleteClient,
    archiveClient,
    restoreClient,
} from '../controllers/client.controller.js';

const router = Router();

router.use(authMiddleware);

/**
 * @openapi
 * /client:
 *   post:
 *     summary: Crear cliente
 *     tags: [Clients]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, cif]
 *             properties:
 *               name: { type: string }
 *               cif:  { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *     responses:
 *       201: { description: Cliente creado }
 *       400: { description: Error de validación }
 */
router.post('/', validate(createClientSchema), createClient);

/**
 * @openapi
 * /client/{id}:
 *   put:
 *     summary: Actualizar cliente
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:  { type: string }
 *               cif:   { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *     responses:
 *       200: { description: Cliente actualizado }
 *       404: { description: No encontrado }
 */
router.put('/:id', validate(updateClientSchema), updateClient);

/**
 * @openapi
 * /client:
 *   get:
 *     summary: Listar clientes
 *     tags: [Clients]
 *     responses:
 *       200: { description: Lista de clientes }
 */
router.get('/', getClients);

/**
 * @openapi
 * /client/{id}:
 *   get:
 *     summary: Obtener cliente por ID
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Cliente }
 *       404: { description: No encontrado }
 */
router.get('/:id', getClient);

/**
 * @openapi
 * /client/{id}:
 *   delete:
 *     summary: Eliminar cliente (soft delete)
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Eliminado }
 *       404: { description: No encontrado }
 */
router.delete('/:id', deleteClient);

/**
 * @openapi
 * /client/{id}/archive:
 *   patch:
 *     summary: Archivar cliente
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Archivado }
 */
router.patch('/:id/archive', archiveClient);

/**
 * @openapi
 * /client/{id}/restore:
 *   patch:
 *     summary: Restaurar cliente archivado
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Restaurado }
 */
router.patch('/:id/restore', restoreClient);

export default router;
