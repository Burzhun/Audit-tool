const mongoose = require('mongoose');

const { Types } = mongoose.Schema;

const collectionSchema = new mongoose.Schema({
  CurrentState: Types.Mixed,
});

module.exports = (collectionName) => mongoose.model(
  `Collection${collectionName}`,
  collectionSchema,
  collectionName,
);
