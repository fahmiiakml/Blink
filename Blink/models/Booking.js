const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true, maxlength: 100 },
  userId:     { type: String, required: true, minlength: 10, maxlength: 10 },
  dateTime:   { type: Date, required: true },
  paid:       { type: Boolean, default: false }, // demo flag
}, { timestamps: true });

bookingSchema.index({ userId: 1, dateTime: -1 });

module.exports = mongoose.model('Booking', bookingSchema);

