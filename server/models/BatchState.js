const mongoose = require('mongoose');

const BatchStateSchema = new mongoose.Schema({
    batch: { type: String, required: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
    // Map of Activity Name -> List of Student IDs who completed it in current cycle
    activityCycles: {
        type: Map,
        of: [String], // Storing ID strings for simplicity in Map
        default: {}
    }
});



BatchStateSchema.index({ batch: 1, adminId: 1 }, { unique: true });

module.exports = mongoose.model('BatchState', BatchStateSchema);
