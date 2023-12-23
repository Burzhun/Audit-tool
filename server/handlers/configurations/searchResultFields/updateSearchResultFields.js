const { Configuration } = require("../../../admin_models");
const { getCurrentStateFields, getCollectionConfiguration } = require("../helpers");
const { logKabana } = require("../../../routes/utils");

module.exports = async (req, res, next) => {
    try {
        const { name: collectionName } = req.params;
        const { selected = [], user_type } = req.body;

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
                    return [...acc, field];
            }
        }, []);

        logKabana(
            [
                {
                    new_Value: { DefaultFieldsToDisplayInSearchResultView: validSelected },
                    old_Value: { DefaultFieldsToDisplayInSearchResultView: configuration.DefaultFieldsToDisplayInSearchResultView },
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
                DefaultFieldsToDisplayInSearchResultView: validSelected
            }
        );

        res.send();
    } catch (e) {
        next(e);
    }
};
