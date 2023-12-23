const { Configuration } = require('../../../models');
const { getCurrentStateFields, getCollectionConfiguration } = require('../helpers');

module.exports = async (req, res, next) => {
  try {
    const { name: collectionName } = req.params;
    const { selected = [] } = req.body;

    await getCollectionConfiguration(
      collectionName,
      ['_id'],
    );

    const currentStateFields = await getCurrentStateFields(collectionName);
    const validSelected = selected.filter(
      (item) => currentStateFields.includes(item),
    );
    console.log(validSelected);
    // await Configuration.updateOne({
    //   CollectionRelevantFor: collectionName,
    // }, {
    //   DefaultFieldsToDisplayInAuditSession: validSelected,
    // });

    res.send();
  } catch (e) {
    next(e);
  }
};
