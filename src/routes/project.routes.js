import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.js';
import { createProjectSchema, updateProjectSchema } from '../validators/project.validator.js';
import {
    createProject,
    updateProject,
    getProjects,
    getProject,
    deleteProject,
} from '../controllers/project.controller.js';

const router = Router();

router.use(authMiddleware);

/**
 * @openapi
 * /project:
 *   post:
 *     summary: Crear proyecto
 *     tags: [Projects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, projectCode, clientId]
 *             properties:
 *               name:        { type: string }
 *               projectCode: { type: string }
 *               clientId:    { type: string }
 *               status:      { type: string, enum: [pending, active, completed] }
 *     responses:
 *       201: { description: Proyecto creado }
 *       400: { description: Error de validación }
 */
router.post('/', validate(createProjectSchema), createProject);

/**
 * @openapi
 * /project/{id}:
 *   put:
 *     summary: Actualizar proyecto
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Proyecto actualizado }
 *       404: { description: No encontrado }
 */
router.put('/:id', validate(updateProjectSchema), updateProject);

/**
 * @openapi
 * /project:
 *   get:
 *     summary: Listar proyectos
 *     tags: [Projects]
 *     parameters:
 *       - in: query
 *         name: clientId
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, active, completed] }
 *       - in: query
 *         name: name
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lista de proyectos }
 */
router.get('/', getProjects);

/**
 * @openapi
 * /project/{id}:
 *   get:
 *     summary: Obtener proyecto por ID
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Proyecto }
 *       404: { description: No encontrado }
 */
router.get('/:id', getProject);

/**
 * @openapi
 * /project/{id}:
 *   delete:
 *     summary: Eliminar proyecto (soft delete)
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Eliminado }
 *       404: { description: No encontrado }
 */
router.delete('/:id', deleteProject);

export default router;
