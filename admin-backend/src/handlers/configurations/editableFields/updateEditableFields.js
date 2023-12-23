const { Configuration } = require('../../../models');
const { getCurrentStateFields, getCollectionConfiguration } = require('../helpers');

module.exports = async (req, res, next) => {
  try {
    const { name: collectionName } = req.params;
    const { uneditable = [] } = req.body;

    await getCollectionConfiguration(
      collectionName,
      ['_id'],
    );

    const currentStateFields = await getCurrentStateFields(collectionName);
    const validUneditable = uneditable.filter(
      (item) => currentStateFields.includes(item),
    );

    await Configuration.updateOne({
      CollectionRelevantFor: collectionName,
    }, {
      UnEditableFields: validUneditable,
    });

    res.send();
  } catch (e) {
    next(e);
  }
};
