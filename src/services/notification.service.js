// src/services/notification.service.js
import { EventEmitter } from 'node:events';
import { sendVerificationEmail } from './email.service.js';

class NotificationService extends EventEmitter {
    constructor() {
        super();
        this._registerListeners();
    }

    _registerListeners() {
        this.on('user:registered', async (user) => {
            console.log(`[Notificación] Usuario registrado: ${user.email} — código de verificación: ${user.verificationCode}`);
            try {
                await sendVerificationEmail(user.email, user.verificationCode);
            } catch (err) {
                console.error('[Email] Error enviando verificación:', err.message);
            }
        });

        this.on('user:verified', (user) => {
            console.log(`[Notificación] Email verificado: ${user.email}`);
        });

        this.on('user:invited', (user) => {
            console.log(`[Notificación] Usuario invitado: ${user.email} — rol: ${user.role}`);
        });

        this.on('user:deleted', (user) => {
            console.log(`[Notificación] Usuario eliminado: ${user.email}`);
        });
    }
}

// Singleton — misma instancia en toda la app
const notificationService = new NotificationService();
export default notificationService;
