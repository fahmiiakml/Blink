const mongoose = require('mongoose');

const populationStatSchema = new mongoose.Schema({
  ageGroup: { type: String, required: true },
  avgScreenTime: { type: Number, required: true },
  p25: Number,
  p50: Number,
  p75: Number,
  sampleSize: Number,

  // NEW: store sorted distribution for percentile rank calc
  distribution: [Number]  // e.g. [1.2, 2.0, 3.1, ...] sorted
});

module.exports = mongoose.model('PopulationStat', populationStatSchema);
