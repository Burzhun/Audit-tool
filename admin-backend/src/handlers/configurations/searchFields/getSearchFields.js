const { Configuration } = require('../../../models');
const { getCurrentStateFields, getCollectionConfiguration } = require('../helpers');

module.exports = async (req, res, next) => {
  try {
    const { name: collectionName } = req.params;

    const configuration = await getCollectionConfiguration(
      collectionName,
      ['DefaultSearchFieldName', 'SearchFieldNames'],
    );

    const auditStateFields = Configuration.getAuditStateFields();
    const generalFields = Configuration.getGeneralFields();
    const currentStateFields = (await getCurrentStateFields(collectionName))
      .filter((field) => (
        !generalFields.includes(field) &&
        !auditStateFields.includes(field)
      ));

    const rawDefaultSearchField = configuration.DefaultSearchFieldName || '';
    const defaultSearchField = (
      rawDefaultSearchField.split(`${Configuration.auditStatePrefix}.`)[1] ||
      rawDefaultSearchField.split(`${Configuration.currentStatePrefix}.`)[1] ||
      rawDefaultSearchField
    );
    const availableSearchFields = [
      ...currentStateFields,
      ...auditStateFields,
      ...generalFields,
    ];

    const rawSelected = configuration.SearchFieldNames || [];
    const selected = rawSelected.map((field) => (
      field.split(`${Configuration.auditStatePrefix}.`)[1] ||
      field.split(`${Configuration.currentStatePrefix}.`)[1] ||
      field
    ));
    const unselected = availableSearchFields.filter(
      (item) => !selected.includes(item),
    );

    res.send({
      selected,
      unselected,
      defaultSearchField,
      availableSearchFields,
    });
  } catch (e) {
    next(e);
  }
};
