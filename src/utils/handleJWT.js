// src/utils/handleJWT.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_ACCESS_EXPIRES = process.env.JWT_ACCES_TOKEN_EXPIRES_IN;
const JWT_REFRESH_EXPIRES = process.env.JWT_REFRESH_TOKEN_EXPIRES_IN;

// Access token: incluye role en el payload, expira en 15 min
export const tokenSign = (user) => {
    return jwt.sign(
        { _id: user._id, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_ACCESS_EXPIRES }
    );
};

// Refresh token: solo _id, secret diferente, expira en 7 días
export const tokenSignRefresh = (user) => {
    return jwt.sign(
        { _id: user._id },
        JWT_REFRESH_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRES }
    );
};

export const verifyToken = (tokenJwt) => {
    try {
        return jwt.verify(tokenJwt, JWT_SECRET);
    } catch {
        return null;
    }
};

export const verifyRefreshToken = (tokenJwt) => {
    try {
        return jwt.verify(tokenJwt, JWT_REFRESH_SECRET);
    } catch {
        return null;
    }
};