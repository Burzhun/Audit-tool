const { Configuration } = require("../../../admin_models");
const { getCurrentStateFields, getCollectionConfiguration } = require("../helpers");
const { logKabana } = require("../../../routes/utils");

module.exports = async (req, res, next) => {
    try {
        const { name: collectionName } = req.params;
        const { selected = [], defaultSearchField = "", user_type } = req.body;

        const configuration = await getCollectionConfiguration(collectionName, ["_id"], user_type);

        const auditStateFields = Configuration.getAuditStateFields();
        const generalFields = Configuration.getGeneralFields();
        const currentStateFields = (await getCurrentStateFields(collectionName)).filter((field) => !generalFields.includes(field) && !auditStateFields.includes(field));

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

        let validDefaultSearchField;

        switch (true) {
            case currentStateFields.includes(defaultSearchField):
                validDefaultSearchField = `${Configuration.currentStatePrefix}.${defaultSearchField}`;
                break;
            case auditStateFields.includes(defaultSearchField):
                validDefaultSearchField = `${Configuration.auditStatePrefix}.${defaultSearchField}`;
                break;
            case generalFields.includes(defaultSearchField):
                validDefaultSearchField = defaultSearchField;
                break;
            default:
                validDefaultSearchField = null;
        }

        logKabana(
            [
                {
                    new_Value: { SearchFieldNames: validSelected, DefaultSearchFieldName: validDefaultSearchField },
                    old_Value: { SearchFieldNames: configuration.SearchFieldNames, DefaultSearchFieldName: configuration.DefaultSearchFieldName },
                    collection: collectionName,
                    user_type,
                    user_email: req.user_email
                }
            ],
            "configuration_change",
            true,
            null,
            req
        );

        await Configuration.updateOne(
            {
                CollectionRelevantFor: collectionName,
                user_type
            },
            {
                SearchFieldNames: validSelected,
                DefaultSearchFieldName: validDefaultSearchField
            }
        );

        res.send();
    } catch (e) {
        next(e);
    }
};
