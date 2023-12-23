const configSchema = require("../models/configSchema");
const userConfigSchema = require("../models/CustomConfig");
const collectionSchema = require("../models/collectionSchema");
const revision = require("../revision");
const SchemaOverview = require("../admin_models/SchemaOverview");
const utils = require("./utils");

const buildNumber = revision.getBuildNumber();

async function getAccessableCollections(email) {
    const userSchema = utils.getUserSchema();
    const user = await userSchema.findOne({ RegisteredUserEmail: email });
    return user.AccessableCollections;
}

exports.fetchConfig = function (req, res) {
    const collection = req.query.name;
    const email = req.query.email;
    const user_type = req.user_role === "external" ? "external" : "internal";
    //const user_type = 'external';
    configSchema
        .findOne({ CollectionRelevantFor: collection, user_type })
        .then(async (result) => {
            if (!result) {
                res.send({
                    success: false
                });
                return;
            }
            const customConfig = await userConfigSchema.findOne({ CollectionRelevantFor: collection, RegisteredUserEmail: email });
            const field_schema = await SchemaOverview.findOne({ collectionName: collection });
            const config = result.toObject();
            if (user_type === "external") {
                const fields = [
                    "add_new_record",
                    "DefaultFieldsToDisplayInSearchResultView",
                    "DefaultSearchFieldName",
                    "SearchFieldNames",
                    "allow_image_file_upload",
                    "DisplayImages",
                    "image_edit_options",
                    "AllowImageAndPdfDownloads",
                    "ImageFieldNames",
                    "AllowCopyFunction",
                    "DefaultFieldsToDisplayInAuditSession",
                    "DefaultSortings",
                    "FieldsToDisplayOnMiddleScreen",
                    "UnDisplayableFields",
                    "UnEditableFields",
                    "Charts"
                ];
                const external_config = await configSchema.findOne({ CollectionRelevantFor: collection, user_type: "external" });
                if (!external_config) {
                    res.send({
                        success: false
                    });
                    return;
                } else {
                    const external_config_object = external_config.toObject();
                    fields.forEach((field) => {
                        config[field] = external_config_object[field];
                    });
                }
            }
            if (customConfig) config["user_config"] = customConfig;
            res.send({
                success: true,
                revision: buildNumber,
                collectionName: collection,
                config: config,
                schema: field_schema,
                customConfig
            });
        })
        .catch((error) => {
            console.error(error);
            res.send({
                success: false
            });
        });
};

exports.getConfigs = function (req, res) {
    //console.log(req);
    const email = req.user_email;
    const role = req.user_role;
    const user_type = req.user_role === "external" ? "external" : "internal";
    collectionSchema
        .find(
            {
                user_type: user_type,
                CollectionRelevantFor: { $exists: true, $ne: "" }
            },
            { CollectionRelevantFor: 1, _id: 0, Visibility: 1 }
        )
        .then(async (result) => {
            const datasets = await getAccessableCollections(email);
            res.send({
                success: true,
                configs:
                    req.user_role === "Admin"
                        ? result.map((k) => k.toObject())
                        : result.map((k) => k.toObject()).filter((c) => datasets.includes(c.CollectionRelevantFor) || (c.Visibility && c.Visibility.public))
            });
        })
        .catch((error) => {
            console.error(error);
            res.send({
                success: false
            });
        });
};

exports.setUserConfig = function (req, res) {
    const email = req.user_email;
    const data = req.body.data;
    const collectionName = req.body.collectionName;
    if (!email || !data || !collectionName) {
        res.send({
            success: false
        });
        return;
    }
    userConfigSchema
        .findOne({ CollectionRelevantFor: collectionName, RegisteredUserEmail: email })
        .then((result) => {
            if (result) {
                result.updateOne(data).exec();
            } else {
                let new_record = { CollectionRelevantFor: collectionName, RegisteredUserEmail: email };
                const newDocument = new userConfigSchema(Object.assign(new_record, data));
                newDocument.save();
            }
            res.send({
                success: true
                //configs: result.map(k => k)
            });
        })
        .catch((error) => {
            console.error(error);
            res.send({
                success: false
            });
        });
};
