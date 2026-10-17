import { createServer } from 'node:http';
import mongoose from 'mongoose';
import dbConnect from './config/db.js';
import app from './app.js';
import { initSocket, getIO } from './config/socket.js';

const PORT = process.env.PORT || 3000;

const shutdown = async (sig) => {
    console.log(`\n${sig} recibido — cerrando servidor...`);
    getIO()?.close();
    await mongoose.connection.close();
    process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

const startServer = async () => {
    try {
        await dbConnect();

        const httpServer = createServer(app);
        initSocket(httpServer);

        httpServer.listen(PORT, () => {
            console.log(`Servidor en http://localhost:${PORT}`);
            console.log(`API en http://localhost:${PORT}/api`);
        });
    } catch (error) {
        console.error('Error al iniciar:', error);
        process.exit(1);
    }
};

startServer();
