const mongoose = require('mongoose');

const SessionLogSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    batch: { type: String, required: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
    round: { type: Number, required: true },
    assignments: [{
        studentName: String,
        studentEmail: String,
        activity: String
    }]
}, { timestamps: true });

// Optimize history fetching and sorting for each admin
SessionLogSchema.index({ adminId: 1, createdAt: -1 });

module.exports = mongoose.model('SessionLog', SessionLogSchema);
