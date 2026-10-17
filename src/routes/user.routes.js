// src/routes/user.routes.js
import { Router } from 'express';
import {
    register,
    validateEmail,
    login,
    updatePersonal,
    company,
    uploadLogo,
    getMe,
    refresh,
    logout,
    deleteUser,
    invite,
    changePassword,
} from '../controllers/user.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import checkRole from '../middleware/role.middleware.js';
import validate from '../middleware/validate.js';
import upload from '../middleware/upload.js';
import {
    registerSchema,
    validationSchema,
    loginSchema,
    updatePersonalSchema,
    companySchema,
    refreshSchema,
    inviteSchema,
    changePasswordSchema,
} from '../validators/user.validator.js';

const router = Router();

// Públicas
router.post('/register',    validate(registerSchema),   register);
router.post('/login',       validate(loginSchema),      login);
router.post('/refresh',     validate(refreshSchema),    refresh);

// Requieren autenticación
router.put('/validation',   authMiddleware, validate(validationSchema),   validateEmail);
router.put('/register',     authMiddleware, validate(updatePersonalSchema), updatePersonal);
router.patch('/company',    authMiddleware, validate(companySchema),       company);
router.patch('/logo',       authMiddleware, upload.single('logo'),         uploadLogo);
router.get('/',             authMiddleware,                                 getMe);
router.post('/logout',      authMiddleware,                                 logout);
router.delete('/',          authMiddleware,                                 deleteUser);
router.put('/password',     authMiddleware, validate(changePasswordSchema), changePassword);

// Solo admin
router.post('/invite',      authMiddleware, checkRole(['admin']), validate(inviteSchema), invite);

export default router;
