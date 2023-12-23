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

    const auditStateFields = Configuration.getAuditStateFields();
    const generalFields = Configuration.getGeneralFields();
    const currentStateFields = (await getCurrentStateFields(collectionName))
      .filter((field) => (
        !generalFields.includes(field) &&
        !auditStateFields.includes(field)
      ));

    const validSelected = selected.reduce((acc, field) => {
      switch (true) {
        case currentStateFields.includes(field):
          return [...acc, `${Configuration.currentStatePrefix}.${field}`];
        case auditStateFields.includes(field):
          return [...acc, `${Configuration.auditStatePrefix}.${field}`];
        case generalFields.includes(field):
          return [...acc, field];
        default:
          return acc;
      }
    }, []);

    await Configuration.updateOne({
      CollectionRelevantFor: collectionName,
    }, {
      DefaultFieldsToDisplayInSearchResultView: validSelected,
    });

    res.send();
  } catch (e) {
    next(e);
  }
};
