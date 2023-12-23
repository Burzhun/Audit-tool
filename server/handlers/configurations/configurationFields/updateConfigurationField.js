const { Configuration, User } = require("../../../admin_models");
const { getCollectionConfiguration } = require("../helpers");
const { logKabana } = require("../../../routes/utils");

module.exports = async (req, res, next) => {
    try {
        const { name: collectionName } = req.params;
        const { data, field, is_new, is_delete, user_type } = req.body;
        let write_data = {};
        let new_value = {};
        let old_value = {};
        // const { name: collectionName } = req.params;

        const configuration = await getCollectionConfiguration(collectionName, [], user_type);

        if (field === "Validators") {
            if (data.type === "date" || data.type === "isodate") {
                var offset = new Date().getTimezoneOffset() / 60;
                ["gt", "gte", "lt", "lte"].forEach((key) => {
                    if (data.constraints[key] && Date.parse(data.constraints[key]) !== NaN) {
                        let t = data.constraints[key];
                        if (t[t.length - 1] !== "Z") t = t + "Z";
                        data.constraints[key] = new Date(t);
                    }
                });
            }
            if (data.name && configuration["Validators"].find((v) => v["name"] === data.name)) {
                const index = configuration["Validators"].findIndex((v) => v["name"] === data.name);
                if (is_delete) {
                    new_value["Validators." + data.name] = null;
                    old_value["Validators." + data.name] = configuration["Validators"][index];
                    configuration["Validators"] = configuration["Validators"].slice(0, index).concat(configuration["Validators"].slice(index + 1));
                } else {
                    new_value["Validators." + data.name] = data;
                    old_value["Validators." + data.name] = configuration["Validators"][index];
                    configuration["Validators"][index] = data;
                }
            } else {
                configuration["Validators"].push(data);
                new_value["Validators." + data.name] = data;
            }
            write_data = { Validators: configuration["Validators"] };
        }
        if (field == "ConfidenceScores") {
            write_data = { ConfidenceScores: data.options, ConfidenceScoreRequired: data.required };
            new_value = write_data;
            old_value["ConfidenceScores"] = configuration["ConfidenceScores"];
            old_value["ConfidenceScoreRequired"] = configuration["ConfidenceScoreRequired"];
        }

        if (
            [
                "user_functions",
                "DefaultUrl",
                "AllowCopyFunction",
                "AuditDropdownVisible",
                "TableSettings",
                "DefaultSortings",
                "CopyToText",
                "ManagerAccessible",
                "Charts",
                "updates_manual_overwrite_fields",
                "api_updates",
                "global_automatic_updates",
                "AccessibleRecords",
                "ExternalUsersQuery",
                "update_logics",
                "DefaultSearchFieldName",
                "ComplexFields",
                "BusinessRules",
                "FloatDisplayPrecision"
            ].includes(field)
        ) {
            if (field === "FloatDisplayPrecision") {
                const num_fields = configuration.Validators.filter((v) => v.type && v.type === "numeric").map((v) => v.name);
                const new_data = data.filter((t) => {
                    if (!num_fields.includes(t.name) || typeof t.value !== "number" || !Number.isInteger(t.value) || t.value < 0 || t.value > 10) return false;
                    return true;
                });
                write_data[field] = new_data;
            } else write_data[field] = data;
            new_value = write_data;
            old_value[field] = configuration[field];
        }

        if (field === "image settings" || field === "collection") {
            write_data = data;
            new_value = write_data;
            old_value[field] = configuration[field];
        }
        const t = await Configuration.update(
            {
                CollectionRelevantFor: collectionName,
                user_type: user_type
            },
            { $set: write_data }
        );

        const new_configuration = await Configuration.findOne({
            CollectionRelevantFor: collectionName,
            user_type: user_type
        });

        logKabana(
            [
                {
                    new_Value: new_value,
                    old_Value: old_value,
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

        res.send({
            data: new_configuration
        });
    } catch (e) {
        next(e);
    }
};
