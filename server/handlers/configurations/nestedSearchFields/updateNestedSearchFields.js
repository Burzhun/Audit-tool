const { Configuration } = require("../../../admin_models");
const { getCurrentStateFields, getCollectionConfiguration, groupSubFields } = require("../helpers");
const { logKabana } = require("../../../routes/utils");

module.exports = async (req, res, next) => {
    try {
        const { name: collectionName } = req.params;
        const { selected = [], user_type } = req.body;

        const configuration = await getCollectionConfiguration(collectionName, ["_id", "ComplexFields"], user_type);

        const currentStateFields = await getCurrentStateFields(collectionName);

        const validSelected = groupSubFields(
            selected.filter((item) => currentStateFields.includes(item)),
            configuration
        );

        logKabana(
            [
                {
                    new_Value: { DefaultNestedFieldsSearch: validSelected },
                    old_Value: { DefaultNestedFieldsSearch: configuration.DefaultNestedFieldsSearch },
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
                DefaultNestedFieldsSearch: validSelected
            }
        );

        res.send();
    } catch (e) {
        next(e);
    }
};
