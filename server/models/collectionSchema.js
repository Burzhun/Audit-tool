const mongoose = require('mongoose');

const Collection = { name: { type: String }, type: { type: String }}

module.exports =  mongoose.model('Collection', Collection, 'configurations');
