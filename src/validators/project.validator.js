import { z } from 'zod';

export const createProjectSchema = z.object({
    name:        z.string().trim().min(1, 'Nombre requerido'),
    projectCode: z.string().trim().min(1, 'Código de proyecto requerido'),
    code:        z.string().trim().optional(),
    clientId:    z.string().min(1, 'Cliente requerido'),
    status:      z.enum(['pending', 'active', 'completed']).optional(),
    begin:       z.string().datetime({ offset: true }).optional(),
    end:         z.string().datetime({ offset: true }).optional(),
    notes:       z.string().optional(),
});

export const updateProjectSchema = z.object({
    name:        z.string().trim().min(1).optional(),
    projectCode: z.string().trim().min(1).optional(),
    code:        z.string().trim().optional(),
    clientId:    z.string().optional(),
    status:      z.enum(['pending', 'active', 'completed']).optional(),
    begin:       z.string().datetime({ offset: true }).optional(),
    end:         z.string().datetime({ offset: true }).optional(),
    notes:       z.string().optional(),
}).refine(
    data => Object.values(data).some(v => v !== undefined),
    { message: 'Debes proporcionar al menos un campo para actualizar' }
);
