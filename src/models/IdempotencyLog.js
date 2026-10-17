import mongoose from 'mongoose';

const idempotencyLogSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    result: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400, // TTL 24h en segundos
    },
});

const IdempotencyLog = mongoose.model('IdempotencyLog', idempotencyLogSchema);
export default IdempotencyLog;
