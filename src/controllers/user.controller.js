// src/controllers/user.controller.js
import crypto from 'node:crypto';
import User from '../models/User.js';
import Company from '../models/Company.js';
import { encrypt, compare } from '../utils/handlePassword.js';
import { tokenSign, tokenSignRefresh, verifyRefreshToken } from '../utils/handleJWT.js';
import { handleHttpError } from '../utils/AppError.js';
import notificationService from '../services/notification.service.js';

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// 1. POST /api/user/register
export const register = async (req, res, next) => {
    try {
        const { email, password, name, lastName, nif } = req.validated;

        const exists = await User.findOne({ email });
        if (exists) return handleHttpError(res, 'Email ya registrado', 409);

        const hashedPassword = await encrypt(password);
        const verificationCode = generateCode();

        const user = await User.create({
            email,
            password: hashedPassword,
            name,
            lastName,
            nif,
            verificationCode,
        });

        notificationService.emit('user:registered', user);

        const token = tokenSign(user);

        const userObj = user.toObject();
        delete userObj.password;
        delete userObj.verificationCode;

        res.status(201).json({ token, user: userObj });
    } catch (err) {
        next(err);
    }
};

// 2. PUT /api/user/validation
export const validateEmail = async (req, res, next) => {
    try {
        const { code } = req.validated;
        const user = req.user;

        if (user.status === 'verified') {
            return handleHttpError(res, 'Email ya verificado', 400);
        }

        if (user.verificationAttempts <= 0) {
            return handleHttpError(res, 'Sin intentos restantes. Contacta con soporte', 403);
        }

        if (user.verificationCode !== code) {
            await User.findByIdAndUpdate(user._id, { $inc: { verificationAttempts: -1 } });
            const remaining = user.verificationAttempts - 1;
            return handleHttpError(res, `Código incorrecto. Intentos restantes: ${remaining}`, 400);
        }

        await User.findByIdAndUpdate(user._id, {
            status: 'verified',
            $unset: { verificationCode: '' },
        });

        notificationService.emit('user:verified', user);

        res.json({ message: 'Email verificado correctamente' });
    } catch (err) {
        next(err);
    }
};

// 3. POST /api/user/login
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.validated;

        const user = await User.findOne({ email, deleted: false }).select('+password');
        if (!user) return handleHttpError(res, 'Credenciales incorrectas', 401);

        const passwordMatch = await compare(password, user.password);
        if (!passwordMatch) return handleHttpError(res, 'Credenciales incorrectas', 401);

        if (user.status !== 'verified') {
            return handleHttpError(res, 'Email no verificado', 403);
        }

        const accessToken = tokenSign(user);
        const refreshToken = tokenSignRefresh(user);

        await User.findByIdAndUpdate(user._id, { refreshToken });

        res.json({ accessToken, refreshToken });
    } catch (err) {
        next(err);
    }
};

// 4. PUT /api/user/register (actualizar datos personales)
export const updatePersonal = async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user._id,
            req.validated,
            { new: true, runValidators: true }
        ).populate('company');

        res.json({ user });
    } catch (err) {
        next(err);
    }
};

// 5. PATCH /api/user/company
export const company = async (req, res, next) => {
    try {
        const { isFreelance, name, cif, address } = req.validated;
        let company;

        if (isFreelance) {
            company = await Company.create({
                owner: req.user._id,
                name: req.user.fullName,
                cif: req.user.nif,
                isFreelance: true,
            });
        } else {
            company = await Company.findOne({ cif, deleted: false });

            if (!company) {
                company = await Company.create({
                    owner: req.user._id,
                    name,
                    cif,
                    address,
                    isFreelance: false,
                });
            }
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { company: company._id },
            { new: true }
        ).populate('company');

        res.json({ user });
    } catch (err) {
        next(err);
    }
};

// 6. PATCH /api/user/logo
export const uploadLogo = async (req, res, next) => {
    try {
        if (!req.file) return handleHttpError(res, 'No se ha subido ningún archivo', 400);
        if (!req.user.company) return handleHttpError(res, 'El usuario no tiene empresa asignada', 400);

        const logoUrl = `/uploads/${req.file.filename}`;

        const company = await Company.findByIdAndUpdate(
            req.user.company,
            { logo: logoUrl },
            { new: true }
        );

        res.json({ company });
    } catch (err) {
        next(err);
    }
};

// 7. GET /api/user
export const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).populate('company');
        res.json({ user });
    } catch (err) {
        next(err);
    }
};

// 8. POST /api/user/refresh
export const refresh = async (req, res, next) => {
    try {
        const { refreshToken } = req.validated;

        const payload = verifyRefreshToken(refreshToken);
        if (!payload) return handleHttpError(res, 'Refresh token inválido', 401);

        const user = await User.findById(payload._id).select('+refreshToken');
        if (!user || user.refreshToken !== refreshToken) {
            return handleHttpError(res, 'Refresh token inválido', 401);
        }

        const newAccessToken = tokenSign(user);
        const newRefreshToken = tokenSignRefresh(user);

        await User.findByIdAndUpdate(user._id, { refreshToken: newRefreshToken });

        res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch (err) {
        next(err);
    }
};

// 9. POST /api/user/logout
export const logout = async (req, res, next) => {
    try {
        await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: '' } });
        res.json({ message: 'Sesión cerrada correctamente' });
    } catch (err) {
        next(err);
    }
};

// 10. DELETE /api/user
export const deleteUser = async (req, res, next) => {
    try {
        const soft = req.query.soft !== 'false'; // default: soft delete

        if (soft) {
            await User.findByIdAndUpdate(req.user._id, { deleted: true });
        } else {
            await User.findByIdAndDelete(req.user._id);
        }

        notificationService.emit('user:deleted', req.user);

        res.json({ message: `Usuario ${soft ? 'desactivado' : 'eliminado'} correctamente` });
    } catch (err) {
        next(err);
    }
};

// 11. POST /api/user/invite (solo admin)
export const invite = async (req, res, next) => {
    try {
        const { email } = req.validated;

        const exists = await User.findOne({ email });
        if (exists) return handleHttpError(res, 'Email ya registrado', 409);

        const tempPassword = crypto.randomBytes(8).toString('hex');
        const hashedPassword = await encrypt(tempPassword);
        const verificationCode = generateCode();

        const user = await User.create({
            email,
            password: hashedPassword,
            name: 'Invitado',
            lastName: 'Pendiente',
            nif: 'PENDIENTE',
            role: 'guest',
            verificationCode,
        });

        notificationService.emit('user:invited', user);

        res.status(201).json({ message: 'Usuario invitado correctamente', email });
    } catch (err) {
        next(err);
    }
};

// PUT /api/user/password
export const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.validated;

        const user = await User.findById(req.user._id).select('+password');

        const passwordMatch = await compare(currentPassword, user.password);
        if (!passwordMatch) return handleHttpError(res, 'Contraseña actual incorrecta', 401);

        const hashedPassword = await encrypt(newPassword);
        await User.findByIdAndUpdate(user._id, { password: hashedPassword });

        res.json({ message: 'Contraseña actualizada correctamente' });
    } catch (err) {
        next(err);
    }
};
