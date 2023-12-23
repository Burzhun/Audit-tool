const createError = require('http-errors');
const express = require('express');
const logger = require('morgan');
const routes = require('./routes');
const { errorHandler } = require('./middlewares');
const config = require('./config');

const app = express();

if (config.env === 'development') {
  app.use((req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', '*');
    res.set('Access-Control-Allow-Headers', '*');
    next();
  });
}
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(routes);
app.use((req, res, next) => next(createError(404)));
app.use(errorHandler);

module.exports = app;
