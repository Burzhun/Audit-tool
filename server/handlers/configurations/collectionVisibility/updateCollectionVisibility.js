const { Configuration, User } = require("../../../admin_models");
const { getCollectionConfiguration } = require("../helpers");
const { logKabana } = require("../../../routes/utils");

module.exports = async (req, res, next) => {
    try {
        const { name: collectionName } = req.params;
        const { visible, allowedUsers, user_type } = req.body;

        const configuration = await getCollectionConfiguration(collectionName, ["_id"], user_type);

        const update = {
            "Visibility.public": visible
        };

        if (!visible) {
            const users = await User.distinct("RegisteredUserEmail");
            update["Visibility.AllowedUsers"] = allowedUsers.filter((item) => users.includes(item));
        }

        if (visible !== configuration.Visibility.public) {
            logKabana(
                [
                    {
                        new_Value: { Visibility: update },
                        old_Value: { Visibility: configuration.Visibility },
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
