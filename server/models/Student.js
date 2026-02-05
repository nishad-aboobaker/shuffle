const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  batch: { type: String, required: true }, // e.g., "Batch A"
  deleted: { type: Boolean, default: false } // Soft delete
}, { timestamps: true });

// Compound index to prevent duplicate emails in the same batch (optional, but good practice)
StudentSchema.index({ email: 1, batch: 1 }, { unique: true });

module.exports = mongoose.model('Student', StudentSchema);
