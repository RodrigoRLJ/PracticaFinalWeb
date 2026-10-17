// src/config/db.js
import mongoose from 'mongoose';

const dbConnect = async () => {
    try {
        await mongoose.connect(process.env.DB_URI, { family: 4 });
        console.log('Conexion completada');
    } catch (error) {
        console.error('Error de conexion:', error.message);
        process.exit(1);
    }
};

export default dbConnect;
