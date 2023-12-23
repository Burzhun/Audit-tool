const { Configuration } = require("../../../admin_models");
const { getCurrentStateFields, getCollectionConfiguration } = require("../helpers");
const { logKabana } = require("../../../routes/utils");

module.exports = async (req, res, next) => {
    try {
        const { name: collectionName } = req.params;
        const { undisplayable = [], user_type } = req.body;

        const configuration = await getCollectionConfiguration(collectionName, ["_id"], user_type);

        // const currentStateFields = await getCurrentStateFields(collectionName);

        logKabana(
            [
                {
                    new_Value: { UnDisplayableFields: undisplayable },
                    old_Value: { UnDisplayableFields: configuration.UnDisplayableFields },
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
                UnDisplayableFields: undisplayable
            }
        );

        res.send();
    } catch (e) {
        next(e);
    }
};
