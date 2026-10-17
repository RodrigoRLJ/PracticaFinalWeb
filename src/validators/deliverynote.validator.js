import { z } from 'zod';

export const createDeliveryNoteSchema = z.object({
    deliveryNoteNumber: z.string().trim().min(1, 'Número de albarán requerido'),
    project:            z.string().min(1, 'Proyecto requerido'),
    clientId:           z.string().min(1, 'Cliente requerido'),
    description:        z.string().optional(),
    workdate:           z.string().datetime({ offset: true }).optional(),
    format:             z.enum(['hours', 'materials']).default('hours'),
    hours:              z.number().positive().optional(),
    quantity:           z.number().positive().optional(),
    unit:               z.string().optional(),
    unitPrice:          z.number().positive().optional(),
}).refine(
    data => {
        if (data.format === 'hours') return data.hours !== undefined;
        if (data.format === 'materials') return data.quantity !== undefined;
        return true;
    },
    { message: 'Formato hours requiere hours; formato materials requiere quantity' }
);

export const signDeliveryNoteSchema = z.object({
    sign: z.string().min(1, 'Firma requerida').optional(),
});
