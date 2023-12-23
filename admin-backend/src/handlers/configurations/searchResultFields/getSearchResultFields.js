const { Configuration } = require('../../../models');
const { getCurrentStateFields, getCollectionConfiguration } = require('../helpers');

module.exports = async (req, res, next) => {
  try {
    const { name: collectionName } = req.params;

    const configuration = await getCollectionConfiguration(
      collectionName,
      ['DefaultFieldsToDisplayInSearchResultView'],
    );

    const auditStateFields = Configuration.getAuditStateFields();
    const generalFields = Configuration.getGeneralFields();
    const currentStateFields = (await getCurrentStateFields(collectionName))
      .filter((field) => (
        !generalFields.includes(field) &&
        !auditStateFields.includes(field)
      ));

    const rawSelected = configuration.DefaultFieldsToDisplayInSearchResultView || [];
    const selected = rawSelected.map((field) => (
      field.split(`${Configuration.auditStatePrefix}.`)[1] ||
      field.split(`${Configuration.currentStatePrefix}.`)[1] ||
      field
    ));

    const unselected = [
      ...currentStateFields,
      ...auditStateFields,
      ...generalFields,
    ].filter((item) => !selected.includes(item));

    res.send({
      selected,
      unselected,
    });
  } catch (e) {
    next(e);
  }
};
