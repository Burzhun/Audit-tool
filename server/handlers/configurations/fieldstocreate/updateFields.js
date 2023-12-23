const { Configuration } = require("../../../admin_models");
const { getCurrentStateFields, getCollectionConfiguration } = require("../helpers");
const { logKabana } = require("../../../routes/utils");

module.exports = async (req, res, next) => {
    try {
        const { name: collectionName } = req.params;
        const { uneditable = [], on = undefined, imageLinks = undefined, user_type } = req.body;

        const configuration = await getCollectionConfiguration(collectionName, ["_id", "add_new_record"], user_type);

        let list = [];
        uneditable.forEach((field) => {
            if (field.indexOf(".") > 0) {
                const parts = field.split(".");
                let i = list.findIndex((f) => f["name"] && f["name"] === parts[0]);
                if (i >= 0) list[i]["DefaultFieldsToDisplayInAuditSession"].push(parts[1]);
                else list.push({ name: parts[0], DefaultFieldsToDisplayInAuditSession: [parts[1]] });
            } else list.push(field);
        });

        let new_value = configuration.add_new_record;
        new_value.fields_to_create = list;
        if (on !== undefined) new_value.on = on;
        if (imageLinks !== undefined) new_value.ImageLinks = imageLinks;

        logKabana(
            [
                {
                    new_Value: { add_new_record: new_value },
                    old_Value: { add_new_record: configuration.add_new_record },
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
                add_new_record: new_value
            }
        );

        res.send();
    } catch (e) {
        next(e);
    }
};
