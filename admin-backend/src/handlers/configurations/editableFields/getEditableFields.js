const { getCurrentStateFields, getCollectionConfiguration } = require('../helpers');

module.exports = async (req, res, next) => {
  try {
    const { name: collectionName } = req.params;

    const configuration = await getCollectionConfiguration(
      collectionName,
      ['UnEditableFields'],
    );

    const currentStateFields = await getCurrentStateFields(collectionName);
    const uneditable = configuration.UnEditableFields || [];
    const editable = currentStateFields.filter(
      (item) => !uneditable.includes(item),
    );

    res.send({
      editable,
      uneditable,
    });
  } catch (e) {
    next(e);
  }
};
