const { Configuration } = require('../../../models');
const { getCurrentStateFields, getCollectionConfiguration } = require('../helpers');

module.exports = async (req, res, next) => {
  try {
    const { name: collectionName } = req.params;
    const { undisplayable = [] } = req.body;

    await getCollectionConfiguration(
      collectionName,
      ['_id'],
    );

    const currentStateFields = await getCurrentStateFields(collectionName);
    const validUndisplayable = undisplayable.filter(
      (item) => currentStateFields.includes(item),
    );

    await Configuration.updateOne({
      CollectionRelevantFor: collectionName,
    }, {
      UnDisplayableFields: validUndisplayable,
    });

    res.send();
  } catch (e) {
    next(e);
  }
};
