// routes/api.js
const express = require('express');
const mongoose = require('mongoose');
const Entry = require('../models/Entry');
const Booking = require('../models/Booking');
const PopulationStat = require('../models/PopulationStat');



const router = express.Router();

// Simple ping
router.get('/', (_req, res) => res.json({ ok: true }));

// Health check
router.get('/health', (_req, res) => {
  const states = ['disconnected','connected','connecting','disconnecting','unauthorized','unknown'];
  res.json({ mongo: states[mongoose.connection.readyState] || mongoose.connection.readyState });
});

// Create entry
router.post('/entries', async (req, res) => {
  try {
    const entry = await Entry.create(req.body);
    res.status(201).json(entry);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// List latest 10 entries
router.get('/entries', async (_req, res) => {
  const entries = await Entry.find().sort({ createdAt: -1 }).limit(10);
  res.json(entries);
});

router.get('/test', async (_req, res) => {
  const entries = await Entry.find();
  res.json(entries);
});

// List latest 10 bookings
router.get('/bookings', async (_req, res) => {
  const list = await Booking.find().sort({ createdAt: -1 }).limit(10);
  res.json(list);
});

// Debug route to confirm DB and entries count
router.get('/debug/db', async (_req, res) => {
  const name = mongoose.connection.name;
  const host = mongoose.connection.host;
  const count = await Entry.countDocuments();
  res.json({ db: name, host, entries: count });
});

// List population stats from Kaggle import
// GET /api/population  or /api/population?ageGroup=18-24
router.get('/population', async (req, res) => {
  try {
    const { ageGroup } = req.query;
    const q = ageGroup ? { ageGroup } : {};
    const stats = await PopulationStat.find(q).sort({ ageGroup: 1 });
    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

function percentileRank(sortedArray, value) {
  if (!sortedArray.length) return null;

  let countBelow = 0;
  for (let v of sortedArray) {
    if (v <= value) countBelow++;
    else break; // array is sorted so we can stop early
  }

  return Math.round((countBelow / sortedArray.length) * 100);
}

// Compare latest user entry vs population stats
// GET /api/comparison?ageGroup=18-24  (defaults to 'all')
router.get('/comparison', async (req, res) => {
  try {
    const ageGroup = req.query.ageGroup || 'all';

    const pop = await PopulationStat.findOne({ ageGroup });
    if (!pop) {
      return res.status(404).json({ error: 'No population data for that group.' });
    }

    const last = await Entry.findOne().sort({ createdAt: -1 });
    if (!last) {
      return res.json({
        population: pop,
        you: null,
        interpretation: 'No personal entries yet. Log time on /log to compare.'
      });
    }

    const you = { screenTime: last.screenTime, ageGroup };

    let relative;
    if (you.screenTime < pop.p25)       relative = 'below most people (lower quartile)';
    else if (you.screenTime < pop.p50)  relative = 'below average';
    else if (you.screenTime < pop.p75)  relative = 'around average to slightly high';
    else                                relative = 'higher than most people (upper quartile)';

    res.json({
      population: pop,
      you,
      interpretation: `Your latest screen time (${you.screenTime}h) is ${relative} for the ${ageGroup} group.`
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


module.exports = router;
