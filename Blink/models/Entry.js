const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now
  },
  screenTime: {
    type: Number,
    required: true
  },
  sleepHours: Number,
  stress: Number, // 1–10 scale
  mood: Number    // 1–10 scale
}, { timestamps: true });

module.exports = mongoose.model('Entry', entrySchema);
