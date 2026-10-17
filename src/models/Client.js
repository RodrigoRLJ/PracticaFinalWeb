import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    cif: {
        type: String,
        required: true,
        unique: true,
    },
    address: {
        street:   String,
        number:   String,
        postal:   String,
        city:     String,
        province: String,
    },
    email: {
        type: String,
    },
    phone: {
        type: String,
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        index: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    active: {
        type: Boolean,
        default: true,
    },
    deleted: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

const Client = mongoose.model('Client', clientSchema);
export default Client;
