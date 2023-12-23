const mongoose = require('mongoose');
const Config = require('./config');



module.exports = mongoose.model('configurations', Config, 'configurations');
