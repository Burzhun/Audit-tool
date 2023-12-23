const { getCurrentStateFields, getCollectionConfiguration } = require('../helpers');

module.exports = async (req, res, next) => {
  try {
    const { name: collectionName } = req.params;
    const { user_type } = req.body;

    const configuration = await getCollectionConfiguration(
      collectionName,
      ['FieldsToDisplayOnMiddleScreen'],
      user_type
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
