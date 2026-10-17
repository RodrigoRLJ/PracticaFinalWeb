import { z } from 'zod';

const addressField = z.object({
    street:   z.string().optional(),
    number:   z.string().optional(),
    postal:   z.string().optional(),
    city:     z.string().optional(),
    province: z.string().optional(),
}).optional();

export const createClientSchema = z.object({
    name:    z.string().trim().min(1, 'Nombre requerido'),
    cif:     z.string().trim().min(1, 'CIF requerido'),
    address: addressField,
    email:   z.string().email('Email no válido').optional(),
    phone:   z.string().optional(),
});

export const updateClientSchema = z.object({
    name:    z.string().trim().min(1).optional(),
    cif:     z.string().trim().min(1).optional(),
    address: addressField,
    email:   z.string().email('Email no válido').optional(),
    phone:   z.string().optional(),
}).refine(
    data => Object.values(data).some(v => v !== undefined),
    { message: 'Debes proporcionar al menos un campo para actualizar' }
);
