const { getCurrentStateFields, getCollectionConfiguration } = require('../helpers');

module.exports = async (req, res, next) => {
  try {
    const { name: collectionName } = req.params;

    const configuration = await getCollectionConfiguration(
      collectionName,
      ['UnDisplayableFields'],
    );

    const currentStateFields = await getCurrentStateFields(collectionName);
    const undisplayable = configuration.UnDisplayableFields || [];
    const displayable = currentStateFields.filter(
      (item) => !undisplayable.includes(item),
    );

    res.send({
      displayable,
      undisplayable,
    });
  } catch (e) {
    next(e);
  }
};
