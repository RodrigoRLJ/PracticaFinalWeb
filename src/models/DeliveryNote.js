import mongoose from 'mongoose';

const deliveryNoteSchema = new mongoose.Schema({
    deliveryNoteNumber: {
        type: String,
        required: true,
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
        index: true,
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true,
        index: true,
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
    description: {
        type: String,
    },
    workdate: {
        type: Date,
    },
    format: {
        type: String,
        enum: ['hours', 'materials'],
        default: 'hours',
    },
    hours: {
        type: Number,
    },
    quantity: {
        type: Number,
    },
    unit: {
        type: String,
    },
    unitPrice: {
        type: Number,
    },
    sign: {
        type: String,
        default: null,
    },
    pending: {
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

const DeliveryNote = mongoose.model('DeliveryNote', deliveryNoteSchema);
export default DeliveryNote;
