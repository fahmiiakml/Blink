const express = require('express');
const router = express.Router();

const Entry = require('../models/Entry');
const PopulationStat = require('../models/PopulationStat');

// helper: returns percentage of people with value <= user's value
function percentileRank(sortedArray, value) {
  if (!sortedArray || !sortedArray.length) return null;
  let countBelowOrEqual = 0;
  for (const v of sortedArray) {
    if (v <= value) countBelowOrEqual++;
    else break;
  }
  return Math.round((countBelowOrEqual / sortedArray.length) * 100);
}

router.get('/screen-time', async (req, res) => {
  try {
    const ageGroup = '18-24';

// Try to load from DB, or fall back to a hard-coded example
let pop = await PopulationStat.findOne({ ageGroup });

if (!pop) {
  pop = {
    ageGroup,
    avgScreenTime: 5,
    sampleSize: 100,
    // simple sorted array for percentile calculation
    distribution: [2, 3, 4, 5, 6, 7, 8]
  };
}


    // latest user entry
    const last = await Entry.findOne().sort({ createdAt: -1 });
    const lastEntryHours = last ? last.screenTime : null;

    // Kaggle comparison
    let comparison = null;
    if (lastEntryHours !== null && pop) {
      const percentile = percentileRank(pop.distribution || [], last.screenTime);
      const interpretation = percentile !== null
        ? `Your screen time is higher than ${percentile}% of people in the ${ageGroup} group.`
        : 'Not enough population data to calculate a percentile.';

      comparison = {
        population: pop,
        you: { screenTime: last.screenTime, ageGroup },
        percentile,
        interpretation
      };
    }

    // Recommendations
    let message = '';
    let recommendations = [];
    let Hoursaverage = pop && pop.avgScreenTime ? pop.avgScreenTime : 5;

    if (lastEntryHours !== null) {
      if (lastEntryHours < Hoursaverage) {
        message = `Great job! You spent less time than the average of ${Hoursaverage} hours.`;
        recommendations = ['Nice work keeping your screen time low!'];
      } else if (lastEntryHours === Hoursaverage) {
        message = `You matched the average screen time of ${Hoursaverage} hours.`;
        recommendations = ['You’re on track. Keep it up!'];
      } else {
        message = `You spent more time than the average of ${Hoursaverage} hours. Consider reducing your screen time for better well-being.`;
        recommendations = [
          'Go out and have fun with your friends',
          'Switch off notifications you don’t need',
          'Try a fun offline activity',
          'Charge your phone outside the bedroom',
          'Set a 1-hour phone-free window before bed'
        ];
      }
    }

    res.render('screen-time', {
      title: 'Screen Time',
      stats: {
        ageGroup,
        averageHours: Hoursaverage,
        topApps: ['TikTok', 'Instagram', 'YouTube']
      },
      totalTime: 0,
      recommendations,
      message,
      comparison,
      lastEntryHours
    });

  } catch (err) {
    console.error('Error in GET /screen-time:', err);
    res.status(500).send('Error loading screen time page');
  }
});

module.exports = router;
