import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },           // admin que creó la compañía
    name: {
        type: String,
        required: true
    },              // Nombre de la empresa
    cif: {
        type: String,
        required: true,
        unique: true
    },               // CIF de la empresa
    address: {
        street: String,
        number: String,
        postal: String,
        city: String,
        province: String
    },
    logo: {
        type: String,
        default: ''
    },              // URL del logo (imagen subida con Multer)
    isFreelance: {
        type: Boolean,
        default: false
    },      // true si es autónomo (1 sola persona)
    deleted: {
        type: Boolean,
        default: false
    }          // Soft delete
}, {
    timestamps: true
});

const Company = mongoose.model('Company', companySchema);
export default Company;