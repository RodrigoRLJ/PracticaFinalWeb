// src/validators/user.validator.js
import { z } from 'zod';

// --- Campos reutilizables ---
const emailField = z.string()
    .email('Email no válido')
    .transform(v => v.toLowerCase().trim());

const passwordField = z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener mayúscula')
    .regex(/[a-z]/, 'Debe contener minúscula')
    .regex(/[0-9]/, 'Debe contener número');

const addressField = z.object({
    street:   z.string().optional(),
    number:   z.string().optional(),
    postal:   z.string().optional(),
    city:     z.string().optional(),
    province: z.string().optional(),
}).optional();

// 1. POST /api/user/register
export const registerSchema = z.object({
    email:    emailField,
    password: passwordField,
    name:     z.string().trim().min(1, 'Nombre requerido'),
    lastName: z.string().trim().min(1, 'Apellido requerido'),
    nif:      z.string().trim().min(1, 'NIF requerido'),
});

// 2. PUT /api/user/validation
export const validationSchema = z.object({
    code: z.string().length(6, 'El código debe tener 6 dígitos').regex(/^\d{6}$/, 'Solo dígitos'),
});

// 3. POST /api/user/login
export const loginSchema = z.object({
    email:    emailField,
    password: z.string().min(1, 'Contraseña requerida'),
});

// 4. PUT /api/user/register (actualizar datos personales)
export const updatePersonalSchema = z.object({
    name:     z.string().trim().min(1).optional(),
    lastName: z.string().trim().min(1).optional(),
    nif:      z.string().trim().min(1).optional(),
    address:  addressField,
}).refine(
    data => Object.values(data).some(v => v !== undefined),
    { message: 'Debes proporcionar al menos un campo para actualizar' }
);

// 5. PATCH /api/user/company — discriminatedUnion freelance vs empresa
export const companySchema = z.discriminatedUnion('isFreelance', [
    // Autónomo: datos personales del usuario como empresa
    z.object({
        isFreelance: z.literal(true),
    }),
    // Empresa: requiere nombre y CIF
    z.object({
        isFreelance: z.literal(false),
        name:    z.string().trim().min(1, 'Nombre de empresa requerido'),
        cif:     z.string().trim().min(9, 'CIF no válido').max(9, 'CIF no válido'),
        address: addressField,
    }),
]);

// 6. POST /api/user/refresh
export const refreshSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token requerido'),
});

// 7. POST /api/user/invite
export const inviteSchema = z.object({
    email: emailField,
});

// BONUS: PUT /api/user/password
export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Contraseña actual requerida'),
    newPassword:     passwordField,
    confirmPassword: z.string().min(1, 'Confirmación requerida'),
}).refine(
    data => data.newPassword === data.confirmPassword,
    { message: 'Las contraseñas no coinciden', path: ['confirmPassword'] }
).refine(
    data => data.currentPassword !== data.newPassword,
    { message: 'La nueva contraseña debe ser diferente a la actual', path: ['newPassword'] }
);
