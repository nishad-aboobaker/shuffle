const mongoose = require('mongoose');

const BatchStateSchema = new mongoose.Schema({
    batch: { type: String, required: true, unique: true },
    // Map of Activity Name -> List of Student IDs who completed it in current cycle
    activityCycles: {
        type: Map,
        of: [String], // Storing ID strings for simplicity in Map
        default: {}
    }
});

module.exports = mongoose.model('BatchState', BatchStateSchema);
