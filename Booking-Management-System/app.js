// app.js
const express = require('express');
const path = require('path');
const logger = require('morgan');

// Routers
const indexRouter = require('./routes/index');
const apiRouter = require('./routes/api');
const bookRouter = require('./routes/book');
const screenTimeRouter = require('./routes/screenTime');

const app = express();                 // <-- create app FIRST

// View engine & static
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));


// Body parsers (must be before routes)
app.use(logger('dev'));
app.use(express.json());               // <-- JSON for APIs (/track-time, /api/entries)
app.use(express.urlencoded({ extended: true })); // forms if you have any

// Routes
app.use('/', indexRouter);
app.use('/api', apiRouter);
app.use('/book', bookRouter);
app.use('/', screenTimeRouter);        // provides GET /screen-time and POST /track-time

// 404 fallback
app.use((req, res) => res.status(404).render('error', { title: 'Not Found' }));

module.exports = app;
