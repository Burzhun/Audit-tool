const { getCurrentStateFields, getCollectionConfiguration } = require('../helpers');

module.exports = async (req, res, next) => {
  try {
    const { name: collectionName } = req.params;

    const configuration = await getCollectionConfiguration(
      collectionName,
      ['FieldsToDisplayOnMiddleScreen'],
    );

    const currentStateFields = await getCurrentStateFields(collectionName);
    const selected = configuration.FieldsToDisplayOnMiddleScreen || [];
    const unselected = currentStateFields.filter(
      (item) => !selected.includes(item),
    );

    res.send({
      selected,
      unselected,
    });
  } catch (e) {
    next(e);
  }
};
