const mongoose = require('mongoose');
const Configuration = require('./Configuration');
const Collection = require('./Collection');
const SchemaOverview = require('./SchemaOverview');
const utils = require('../routes/utils');

const User = utils.getUserSchema();

module.exports = {
  Configuration,
  SchemaOverview,
  User,
  Collection
};
