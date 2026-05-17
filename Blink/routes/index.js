const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('index', { title: 'Blink' });
});

router.get('/mascot', (req, res) => {
    res.render('mascot');
});

router.get('/bath', (req, res) => {
    res.render('bath');
});

router.get('/help', (req, res) => {
    res.render('help');
});
router.get('/about', (req, res) => {
  res.render('about');
});




module.exports = router;
