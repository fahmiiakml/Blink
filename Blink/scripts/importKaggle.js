require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const PopulationStat = require('../models/PopulationStat');

// --- helpers ---
function percentile(arr, p) {
  if (!arr.length) return null;
  const a = [...arr].sort((x, y) => x - y);
  const idx = (p / 100) * (a.length - 1);
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  if (lo === hi) return a[lo];
  return a[lo] + (a[hi] - a[lo]) * (idx - lo);
}

function detectColumn(headers, candidates) {
  const hay = headers.map(h => h.toLowerCase().trim());
  for (const h of hay) {
    for (const c of candidates) {
      if (h.includes(c)) return headers[hay.indexOf(h)];
    }
  }
  return null;
}

function bucketAge(n) {
  if (!Number.isFinite(n)) return 'unknown';
  if (n < 13) return '<13';
  if (n <= 17) return '13-17';
  if (n <= 24) return '18-24';
  if (n <= 34) return '25-34';
  if (n <= 44) return '35-44';
  if (n <= 54) return '45-54';
  if (n <= 64) return '55-64';
  return '65+';
}

// --- main ---
(async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) throw new Error('Missing MONGO_URI in .env');

    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to Mongo');

    const filePath = path.join(__dirname, 'data', 'digital_habits_vs_mental_health.csv');
    if (!fs.existsSync(filePath)) throw new Error(`CSV not found at ${filePath}`);

    // Read CSV quickly (no external libs): split lines + naive CSV (works if no quoted commas)
    const raw = fs.readFileSync(filePath, 'utf8').trim();
    const lines = raw.split(/\r?\n/);
    const headers = lines.shift().split(',').map(s => s.trim());

    // Auto-detect likely columns
    const screenCol = detectColumn(headers, ['screen', 'screentime', 'screen_time', 'screen-time']);
    const ageCol    = detectColumn(headers, ['age_group', 'agegroup', 'age group', 'age']);

    if (!screenCol) {
      throw new Error(`Could not detect a screen time column. Looked for: screen/screentime/screen_time. Found headers: ${headers.join(', ')}`);
    }
    console.log(`🧭 Detected columns -> screen: "${screenCol}"${ageCol ? `, age: "${ageCol}"` : ' (no age column found; using "all")'}`);

    // Build buckets
    // If ageCol is a string category, use it as-is. If numeric, bucket. If missing, use 'all'.
    const buckets = {}; // { '18-24': [hours,...], '25-34': [...], 'all': [...] }

    for (const line of lines) {
      if (!line.trim()) continue;
      const cols = line.split(','); // naive split (okay for clean CSVs)
      const row = {};
      headers.forEach((h, i) => row[h] = cols[i] !== undefined ? cols[i].trim() : '');

      // screen time value
      let st = parseFloat(row[screenCol]);
      if (!Number.isFinite(st)) continue;

      // derive group
      let group = 'all';
      if (ageCol) {
        const rawAge = row[ageCol];
        const nAge = parseFloat(rawAge);
        if (Number.isFinite(nAge) && rawAge !== '') {
          group = bucketAge(nAge);
        } else if (rawAge) {
          group = rawAge; // e.g., '18-24'
        }
      }

      if (!buckets[group]) buckets[group] = [];
      buckets[group].push(st);
    }

    // Compute stats
    const docs = Object.entries(buckets).map(([ageGroup, values]) => {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const sorted = [...values].sort((a, b) => a - b);
      
      return {
        ageGroup,
        avgScreenTime: Number(avg.toFixed(2)),
        p25: Number(percentile(values, 25).toFixed(2)),
        p50: Number(percentile(values, 50).toFixed(2)),
        p75: Number(percentile(values, 75).toFixed(2)),
        sampleSize: values.length,
        distribution: sorted    // store distribution array
    };
    });

    // Persist
    await PopulationStat.deleteMany({});
    await PopulationStat.insertMany(docs);

    console.log(`✅ Imported ${docs.length} group(s).`);
    console.table(docs.map(d => ({ ageGroup: d.ageGroup, avg: d.avgScreenTime, n: d.sampleSize })));
    process.exit(0);
  } catch (err) {
    console.error('❌ Import failed:', err.message);
    process.exit(1);
  }
})();
