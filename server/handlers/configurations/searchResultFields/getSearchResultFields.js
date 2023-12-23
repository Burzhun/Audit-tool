const { Configuration } = require('../../../admin_models');
const { getCurrentStateFields, getCollectionConfiguration } = require('../helpers');

module.exports = async (req, res, next) => {
  try {
    const { name: collectionName } = req.params;
    const { user_type } = req.body;

    const configuration = await getCollectionConfiguration(
      collectionName,
      ['DefaultFieldsToDisplayInSearchResultView'],
      user_type
    );

    const auditStateFields = Configuration.getAuditStateFields();
    const generalFields = Configuration.getGeneralFields();
    const currentStateFields = (await getCurrentStateFields(collectionName))
      .filter((field) => (
        !generalFields.includes(field) &&
        !auditStateFields.includes(field)
      ));

    const rawSelected = configuration.DefaultFieldsToDisplayInSearchResultView || [];
    let selected = rawSelected.map((field) => (
      field.split(`${Configuration.auditStatePrefix}.`)[1] ||
      field.split(`${Configuration.currentStatePrefix}.`)[1] ||
      field
    ));
    let unselected =[
      ...currentStateFields,
      ...auditStateFields,
      ...generalFields,
    ].filter((item) => !selected.includes(item));

    unselected = [...new Set(unselected)];
    selected = [...new Set(selected)];
    res.send({
      unselected,
      selected,
    });
  } catch (e) {
    next(e);
  }
};
