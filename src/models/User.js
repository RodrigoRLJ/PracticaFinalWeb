import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true

    },           // Único (index: unique), validado con Zod
    password: {
        type: String,
        required: true,
        minLength: [8, 'minimo 8 caracteres'],
        select: false  // No incluir en consultas por defecto
    },          // Cifrada con bcrypt
    name: {
        type: String,
        required: true
    },              // Nombre
    lastName: {
        type: String,
        required: true
    },          // Apellidos
    nif: {
        type: String,
        required: true
    },               // Documento de identidad
    role: {
        type: String,
        enum: ['admin', 'guest'],
        default: 'admin',
        index: true
    },            // Por defecto: 'admin'
    status: {
        type: String,
        enum: ['pending', 'verified'],
        default: 'pending',
        index: true
    },     // Estado de verificación del email (index)
    verificationCode: {
        type: String,
        minLength: 6,
        maxLength: 6,
    },  // Código aleatorio de 6 dígitos
    verificationAttempts: {
        type: Number,
        default: 3,
        max: 3,
        min: 0,
    }, // Intentos restantes (máximo 3)
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        index: true
    },         // ref: 'Company' — se asigna en el onboarding (index)
    address: {
        street: String,
        number: String,
        postal: String,
        city: String,
        province: String
    },
    refreshToken: {
        type: String,
        select: false   // No incluir en consultas por defecto
    },
    deleted: {
        type: Boolean,
        default: false
    }          // Soft delete
}, {
    timestamps: true
});

// Virtual (no se almacena, se calcula):
userSchema.virtual('fullName').get(function () {
    return `${this.name} ${this.lastName}`;
});

// Asegurar que los virtuales se incluyan al convertir a JSON/Object
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.model('User', userSchema);
export default User;