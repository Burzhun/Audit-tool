const httpErrors = require('http-errors');
const { Configuration } = require('../../../models');

module.exports = async (collectionName, configurationFields) => {
  const configuration = await Configuration
    .findOne({
      CollectionRelevantFor: collectionName,
    })
    .select(configurationFields.join(' '));

  if (!configuration) {
    throw new httpErrors.NotFound('Configuration for collection not found');
  }

  return configuration;
};
