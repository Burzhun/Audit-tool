const { getCurrentStateFields, getCollectionConfiguration } = require('../helpers');

module.exports = async (req, res, next) => {
  try {
    const { name: collectionName } = req.params;

    const configuration = await getCollectionConfiguration(
      collectionName,
      ['AllowNewRecordCreation', 'NewRecordFields'],
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
