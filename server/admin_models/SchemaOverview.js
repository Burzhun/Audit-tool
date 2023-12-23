const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
    collectionName: { type: String},
    fields: {type: Array}

}, {collection: 'SchemaOverviews'});
module.exports = mongoose.model('SchemaOverview', collectionSchema);

