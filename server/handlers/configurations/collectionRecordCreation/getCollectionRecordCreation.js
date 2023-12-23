const { getCurrentStateFields, getCollectionConfiguration } = require('../helpers');

module.exports = async (req, res, next) => {
  try {
    const { name: collectionName } = req.params;
    const { user_type } = req.body;

    const configuration = await getCollectionConfiguration(
      collectionName,
      ['AllowNewRecordCreation', 'NewRecordFields'],
      user_type
    );

    const currentStateFields = await getCurrentStateFields(collectionName);
    const allowedFields = configuration.NewRecordFields || [];
    const disallowedFields = currentStateFields
      .filter((item) => !allowedFields.includes(item));

    res.send({
      allowed: configuration.AllowNewRecordCreation,
      allowedFields,
      disallowedFields,
    });
  } catch (e) {
    next(e);
  }
};
