const { Configuration } = require("../../../admin_models");
const { user_type } = require("../../../models/config");
const { getCurrentStateFields, getCollectionConfiguration } = require("../helpers");
const { logKabana } = require("../../../routes/utils");

module.exports = async (req, res, next) => {
    try {
        const { name: collectionName } = req.params;
        const { uneditable = [], user_type } = req.body;

        const configuration = await getCollectionConfiguration(collectionName, ["_id"], user_type);

        const currentStateFields = await getCurrentStateFields(collectionName);
        const validUneditable = uneditable.filter((item) => currentStateFields.includes(item));

        logKabana(
            [
                {
                    new_Value: { UnEditableFields: validUneditable },
                    old_Value: { UnEditableFields: configuration.UnEditableFields },
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
                UnEditableFields: validUneditable
            }
        );

        res.send();
    } catch (e) {
        next(e);
    }
};
