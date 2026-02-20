import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
    currentPhase: {
        type: Number,
        default: 1,
        enum: [1, 2]
    }
}, {
    timestamps: true
});

export const Settings = mongoose.model('Settings', settingsSchema);
