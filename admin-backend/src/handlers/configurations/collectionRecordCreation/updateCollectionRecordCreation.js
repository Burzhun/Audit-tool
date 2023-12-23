const { getCurrentStateFields, getCollectionConfiguration } = require('../helpers');
const { Configuration } = require('../../../models');

module.exports = async (req, res, next) => {
  try {
    const { name: collectionName } = req.params;
    const { allowed, allowedFields } = req.body;

    await getCollectionConfiguration(
      collectionName,
      ['_id'],
    );

    const update = {
      AllowNewRecordCreation: allowed,
    };

    if (allowed) {
      const currentStateFields = await getCurrentStateFields(collectionName);
      update.NewRecordFields = allowedFields
        .filter((item) => currentStateFields.includes(item));
    }

    await Configuration.updateOne({
      CollectionRelevantFor: collectionName,
    }, update);

    res.send();
  } catch (e) {
    next(e);
  }
};
