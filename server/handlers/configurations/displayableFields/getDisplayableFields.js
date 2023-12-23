const { getCurrentStateFields, getCollectionConfiguration } = require('../helpers');

module.exports = async (req, res, next) => {
  try {
    const { name: collectionName } = req.params;
    const { user_type } = req.body;

    const configuration = await getCollectionConfiguration(
      collectionName,
      ['UnDisplayableFields'],
      user_type
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
