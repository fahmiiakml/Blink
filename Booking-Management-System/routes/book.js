const express = require('express');
const router = express.Router();

// GET: show the log screen time page
router.get('/', (req, res) => {
  res.render('book', { title: 'Blink' });
});

module.exports = router;
