const { getCurrentStateFields, getCollectionConfiguration } = require("../helpers");
const { Configuration } = require("../../../admin_models");
const { logKabana } = require("../../../routes/utils");

module.exports = async (req, res, next) => {
    try {
        const { name: collectionName } = req.params;
        const { allowed, allowedFields, user_type } = req.body;

        const configuration = await getCollectionConfiguration(collectionName, ["_id"], user_type);

        const update = {};

        if (allowed) {
            const currentStateFields = await getCurrentStateFields(collectionName);
            update.NewRecordFields = allowedFields.filter((item) => currentStateFields.includes(item));

            logKabana(
                [
                    {
                        new_Value: update,
                        old_Value: { NewRecordFields: configuration.NewRecordFields },
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
                update
            );
        }

        res.send();
    } catch (e) {
        next(e);
    }
};
