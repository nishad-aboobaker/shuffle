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

module.exports = mongoose.model('SessionLog', SessionLogSchema);
