const AWS = require("aws-sdk");
const dotenv = require("dotenv");
const fs = require("fs");
const formidable = require("formidable");
const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");
const convertDataTypes = require("../castType");
const { interbank_request_api, interbank_api } = require("./interbank_request");
const { validate, checkBusinessRules } = require("../middleware/validators");
const utils = require("./utils");
var { Base64Encode } = require("base64-stream");
dotenv.config();
const key = process.env.AWS_KEY;
const secret = process.env.AWS_SECRET;
const revision = require("../revision");
var lodash = require("lodash");
var configSchema = require("../models/configSchema");

exports.getRecord = async function (req, res) {
    const value = req.body.value === "new" ? -1 : Number(req.body.value);
    const collectionName = req.body.collectionName;
    const productSchema = utils.getProductSchema(collectionName);
    let pipeline_results = null;
    if (value === -1) {
        utils.generateEmptyRecord(collectionName).then((record) => {
            if (record) {
                res.send({
                    success: true,
                    data: [record]
                });
            } else {
                res.send({
                    success: false
                });
            }
        });
    } else {
        const userSchema = utils.getUserSchema();
        const user = await userSchema.findOne({
            RegisteredUserEmail: req.user_email
        });
        const user_type = req.user_role === "external" ? "external" : "internal";
        const configuration = await configSchema.findOne({
            CollectionRelevantFor: collectionName,
            user_type: user_type
        });
        if (
            req.user_role !== "Admin" &&
            !(
                (user_type === "internal" && configuration.Visibility && configuration.Visibility.public) ||
                (user.AccessableCollections && user.AccessableCollections.includes(collectionName))
            )
        ) {
            res.send({
                success: false,
                redirect: true
            });
            return;
        }
        if (req.user_role === "external") {
            const configuration = await configSchema.findOne({
                CollectionRelevantFor: collectionName,
                user_type: "external"
            });
            if (configuration.ExternalUsersQuery && configuration.ExternalUsersQuery.pipeline) {
                try {
                    const pipeline = eval(configuration.getExternalQuery(user));
                    pipeline_results = await productSchema.aggregate(pipeline).exec();
                } catch (e) {
                    res.send({
                        success: false,
                        redirect: true
                    });
                    return;
                }
                if (pipeline_results) pipeline_results = pipeline_results.find((t) => t.RecordId === value);
                if (!pipeline_results) {
                    res.send({
                        success: false,
                        redirect: true
                    });
                    return;
                }
            } else {
                res.send({
                    success: false,
                    redirect: true
                });
                return;
            }
        }
        productSchema
            .find({ RecordId: value })
            .then((result) => {
                if (!result.length) {
                    res.send({
                        success: false,
                        data: null
                    });
                    return;
                }
                if (pipeline_results && result.length) {
                    result[0].CurrentState = pipeline_results.CurrentState;
                    result[0].AuditState = pipeline_results.AuditState;
                }

                res.send(
                    JSON.stringify(
                        {
                            success: true,
                            data: result
                        },
                        (key, value) => {
                            return value === Infinity ? "inf" : value === -Infinity ? "-inf" : value;
                        }
                    )
                );
            })
            .catch((error) => {
                console.error(error);
                res.send({
                    success: false
                });
            });
    }
};

exports.fetchImage = function (req, res) {
    AWS.config.update({
        accessKeyId: key,
        secretAccessKey: secret,
        region: "eu-west-1"
    });
    var imageID = req.query["fileKey"];
    const base64 = req.query["base64"];
    try {
        if (imageID) {
            const bucket_name = imageID.split("//").pop().split("/")[imageID.startsWith("s3://") ? 0 : 1];
            // TODO: move bucket name to env file
            const bucket = new AWS.S3({ params: { Bucket: bucket_name } });
            const path = imageID.split(bucket_name + "/")[1];
            res.attachment(imageID);
            let error = false;
            const stream = bucket
                .getObject({ Key: path })
                .createReadStream()
                .on("error", (err) => {
                    // Catching NoSuchKey & StreamContentLengthMismatch
                    error = err;
                    res.send({
                        success: false
                    });
                });
            if (!error) {
                if (base64) stream.pipe(new Base64Encode()).pipe(res);
                else stream.pipe(res);
            } else {
                res.send({
                    success: false
                });
            }
        } else {
            res.send({
                success: false
            });
        }
    } catch (e) {
        console.log(e);
    }
};

exports.uploadFile = function (req, res) {
    AWS.config.update({
        accessKeyId: key,
        secretAccessKey: secret
    });
    const bucket = new AWS.S3({
        accessKeyId: key,
        secretAccessKey: secret
    });
    new formidable.IncomingForm().parse(req, (err, fields, files) => {
        if (err) {
            res.send({
                success: false,
                type: "form"
            });
            return;
        }
        var path = "";
        var type = "";
        var name = "";
        var filename = "";
        const timestamp = Date.now().toString();
        const field_key = fields.field_key;
        const file_index = fields.file_index;
        const bucket_name = fields.s3_bucket_name ? fields.s3_bucket_name : "fxci.card-data-collection";
        let folder_name = fields.s3_folder_name ? fields.s3_folder_name : "tnc_screenshots_and_pdfs";
        if (!folder_name.endsWith("/")) folder_name = folder_name + "/";
        if (files.file1) {
            path = files.file1.path;
            const dot_index = files.file1.name.lastIndexOf(".");
            type = files.file1.name.slice(dot_index + 1);
            name = files.file1.name.slice(0, dot_index);
            filename = folder_name + timestamp + "_" + name + "." + type;
        }

        if (fields.base64_file) {
            let [info, data] = fields.base64_file.split(",");
            if (info && data) {
                path = timestamp + "_" + fields.RecordId + "_" + info.split(";")[0].split(":")[1].replace("/", ".");
                fs.writeFileSync(path, data, "base64");
                filename = folder_name + path;
                if (fields.image_link) {
                    let arr = fields.image_link.split(bucket_name + "/");
                    if (arr.length == 2) filename = arr[1];
                }
            }
        }

        if (!path) {
            res.send({
                success: false,
                error: "!path"
            });
            return;
        }
        const buffer = fs.readFileSync(path);
        const params = {
            Bucket: bucket_name, // pass your bucket name
            Key: filename,
            Body: buffer
        };
        if (fields.base64_file) {
            fs.unlinkSync(path);
        }
        bucket.upload(params, function (s3Err, data) {
            if (s3Err) {
                res.send({
                    success: false
                });
            } else {
                let collectionName = fields.collectionName;
                let RecordId = fields.RecordId;
                var productSchema = utils.getProductSchema(collectionName);
                const is_image_edit = fields.is_image_edit;
                productSchema.findOne({ RecordId: RecordId }).then((result) => {
                    var NewProduct = result;
                    let links = NewProduct.CurrentState.ImageLinks;
                    if (!links) links = {};
                    if (!links[field_key]) {
                        links[field_key] = [];
                    }
                    var auditSessions = result.AuditSessions;
                    var new_audit_value = {
                        AuditFieldName: "ImageLinks." + field_key,
                        Valid: true,
                        OldValue: links[field_key].slice(0)
                    };
                    if (file_index < links[field_key].length) {
                        links[field_key][file_index] = data.Location;
                        if (is_image_edit) new_audit_value["AuditedComment"] = "Edited image " + new_audit_value["OldValue"][file_index] + " at position " + file_index;
                        else
                            new_audit_value["AuditedComment"] =
                                "Replace " + new_audit_value["OldValue"][file_index] + " at position " + file_index + " with " + links[field_key][file_index];
                    } else {
                        links[field_key].push(data.Location);
                        new_audit_value["AuditedComment"] = "Upload " + data.Location;
                    }
                    new_audit_value["NewValue"] = links[field_key];
                    const AuditNumber = result.AuditState.AuditNumber || result.AuditState.AuditNumber === 0 ? parseInt(result.AuditState.AuditNumber) + 1 : 0;
                    let audit_date = new Date();
                    audit_date = audit_date.toISOString();
                    const email = fields.email;
                    var auditSession = {
                        AuditNumber: AuditNumber,
                        RegisteredUserEmail: email,
                        AuditeDate: audit_date,
                        ConfidenceScore: NewProduct.AuditState.ConfidenceScore,
                        NoteOnConfidenceScore: NewProduct.AuditState.NoteOnConfidenceScore,
                        AuditValueArray: [new_audit_value]
                    };
                    auditSessions.push(auditSession);
                    NewProduct.AuditSessions = auditSessions;

                    NewProduct.CurrentState.ImageLinks = links;
                    NewProduct.AuditState.AuditNumber = AuditNumber;
                    NewProduct.AuditState.LastEditedBy = email;
                    NewProduct.AuditState.LastEditedAt = audit_date;
                    result.updateOne(NewProduct).exec();
                    res.send({
                        success: true,
                        data: [NewProduct]
                    });
                });
            }
        });
    });
};
exports.removeFile = function (req, res) {
    const collectionName = req.body.collectionName;
    const productSchema = utils.getProductSchema(collectionName);
    const recordId = req.body.RecordId;
    const field_key = req.body.field_key;
    const file_index = req.body.file_index;

    productSchema
        .findOne({ RecordId: recordId })
        .then((result) => {
            var NewProduct = result;
            let links = NewProduct.CurrentState.ImageLinks;
            if (links[field_key]) {
                var auditSessions = result.AuditSessions;
                var new_audit_value = {
                    AuditFieldName: "ImageLinks." + field_key,
                    Valid: true,
                    OldValue: links[field_key].slice(0)
                };
                if (file_index < links[field_key].length) {
                    new_audit_value["AuditedComment"] = "Remove " + links[field_key][file_index] + " at position " + file_index;
                    links[field_key].splice(file_index, 1);
                    new_audit_value["NewValue"] = links[field_key];
                    NewProduct.CurrentState.ImageLinks = links;
                    const AuditNumber = result.AuditState.AuditNumber || result.AuditState.AuditNumber === 0 ? parseInt(result.AuditState.AuditNumber) + 1 : 0;
                    let audit_date = new Date();
                    audit_date = audit_date.toISOString();
                    const email = req.body.email;
                    var auditSession = {
                        AuditNumber: AuditNumber,
                        RegisteredUserEmail: email,
                        AuditeDate: audit_date,
                        ConfidenceScore: NewProduct.AuditState.ConfidenceScore,
                        NoteOnConfidenceScore: NewProduct.AuditState.NoteOnConfidenceScore,
                        AuditValueArray: [new_audit_value]
                    };
                    auditSessions.push(auditSession);
                    NewProduct.AuditSessions = auditSessions;

                    NewProduct.CurrentState.ImageLinks = links;
                    NewProduct.AuditState.AuditNumber = AuditNumber;
                    NewProduct.AuditState.LastEditedBy = email;
                    NewProduct.AuditState.LastEditedAt = audit_date;
                    result.updateOne(NewProduct).exec();
                    res.send({
                        success: true,
                        data: [NewProduct]
                    });
                }
            } else
                res.send({
                    success: true,
                    data: result
                });
        })
        .catch((error) => {
            console.error(error);
            res.send({
                success: false
            });
        });
};

exports.fetchDatabase = async function (req, res) {
    const collectionName = req.body.collectionName;
    let query = {};
    let table_filter = [];
    let visibility = null;
    await configSchema
        .findOne({ CollectionRelevantFor: collectionName, user_type: "internal" })
        .then((config) => {
            visibility = config.Visibility;
            for (var i = 0; i < req.body.filters.length; i++) {
                const filter = req.body.filters[i];
                const field = filter.selectedField;
                let operator = filter.operator ? filter.operator : "=";
                let value = filter.value;
                if ((operator === "in" || operator === "nin") && typeof value === "string") value = value.split(",");
                let secondValue = filter.secondValue;
                if (operator === "<x<" && secondValue != "") {
                    value = [convertDataTypes(value, operator, field, config, false, true), convertDataTypes(secondValue, operator, field, config, false, true)];
                } else {
                    value = convertDataTypes(value, operator, field, config, false, true);
                    if (operator === "<x<" && secondValue === "") operator = ">";
                }
                if (filter.tableFilter && filter.tableFilter === true) {
                    const q = {};
                    Object.assign(q, utils.prepareQuery(operator, field, value, config));
                    table_filter.push(q);
                    continue;
                }
                let field_value = utils.prepareQuery(operator, field, value, config);
                if (Number.isNaN(field_value[field])) field_value[field] = null;
                if (field in query) {
                    if (Array.isArray(query[field])) {
                        if (!query[field].includes(field_value[field])) query[field].push(field_value[field]);
                    } else {
                        const new_query = field_value;
                        query[field] = [query[field], new_query[field]];
                    }
                } else Object.assign(query, field_value);
            }
        })
        .catch((err) => console.error(err));
    const productSchema = utils.getProductSchema(collectionName);
    let and_conditions = [];
    for (const field in query) {
        if (Array.isArray(query[field])) {
            and_conditions.push({
                $and: query[field].map(function (el) {
                    let t = {};
                    t[field] = el;
                    return t;
                })
            });
        } else {
            var t = {};
            t[field] = query[field];
            and_conditions.push(t);
        }
    }
    and_conditions = and_conditions.concat(table_filter);
    let external_pipeline_results = null;
    const userSchema = utils.getUserSchema();
    if (req.user_role === "internal") {
        if (!visibility || !visibility.public) {
            const user = await userSchema.findOne({
                RegisteredUserEmail: req.user_email
            });
            if (!user.AccessableCollections || !user.AccessableCollections.includes(collectionName)) {
                res.send({
                    success: false
                });
                return;
            }
        }
    }
    if (req.user_role === "external") {
        const user = await userSchema.findOne({
            RegisteredUserEmail: req.user_email
        });
        if (!user.AccessableCollections || !user.AccessableCollections.includes(collectionName)) {
            res.send({
                success: false
            });
            return;
        }
        const configuration = await configSchema.findOne({
            CollectionRelevantFor: collectionName,
            user_type: "external"
        });
        if (configuration && configuration.ExternalUsersQuery && configuration.ExternalUsersQuery.pipeline) {
            const pipeline = eval(configuration.getExternalQuery(user));
            external_pipeline_results = await productSchema.aggregate(pipeline).exec();
            if (external_pipeline_results && external_pipeline_results.length) {
                and_conditions.push({
                    RecordId: { $in: external_pipeline_results.map((t) => t.RecordId) }
                });
            } else {
                res.send({
                    success: true,
                    data: []
                });
                return;
            }
        } else {
            res.send({
                success: true,
                data: []
            });
            return;
        }
    }
    query = and_conditions.length > 0 ? { $and: and_conditions.concat(table_filter) } : {};
    const limit = req.body.page_size ? req.body.page_size : 100;
    const offset = req.body.page_number ? (req.body.page_number - 1) * limit : 0;
    let f = productSchema.find(query);
    if (req.body.sorting_data) {
        const order = req.body.sorting_data.direction === "ascending" ? 1 : -1;
        const sorting_object = {};
        sorting_object[req.body.sorting_data.column] = order;
        f = f.sort(sorting_object);
    }
    f.limit(limit)
        .skip(offset)
        .then((result) => {
            productSchema.countDocuments(query).exec((err, count) => {
                if (err) {
                    res.send({
                        error: err,
                        success: false
                    });
                    return;
                }
                if (external_pipeline_results) {
                    result = result.map((record) => {
                        let external_data = external_pipeline_results.find((r) => r.RecordId === record.RecordId);
                        if (external_data) record.CurrentState = external_data.CurrentState;
                        else record.CurrentState = null;
                        record.AuditState = {};
                        record.AuditSessions = {};
                        return record;
                    });
                }
                res.send({
                    success: true,
                    data: result,
                    count: count
                });

                //res.json({ count: count });
            });
        })
        .catch((error) => {
            console.error(error);
            res.send({
                success: false
            });
        });
};

exports.saveFunction = function (req, res) {
    const configSchema = require("../models/configSchema");
    const { name, updated_field, update_logic, description, collectionName, fieldName } = req.body.data;
    configSchema.findOne({ CollectionRelevantFor: collectionName }).then((result) => {
        const user_function_index = result.user_functions !== undefined && result.user_functions.admin_approved_functions.findIndex((uf) => uf.name === name);
        if (user_function_index >= 0) {
            let uf = result.user_functions.admin_approved_functions[user_function_index];
            uf["updated_field"] = fieldName + "." + updated_field;
            uf["update_logic"] = update_logic;
            uf["description"] = description;
            result.user_functions.admin_approved_functions[user_function_index] = uf;
        } else {
            if (!result["user_functions"]) result["user_functions"] = [];
            let new_function = {
                updated_field: fieldName + "." + updated_field,
                update_logic: update_logic,
                description: description,
                name: name
            };
            result.user_functions.admin_approved_functions.push(new_function);
        }
        result.updateOne(result).exec(function (err) {
            if (err) {
                res.send({
                    error: err,
                    success: false
                });
            } else
                res.send({
                    success: true
                });
        });
    });
};

exports.saveDatabase = function (req, res) {
    const { recordId, changedValues, audit_info, collectionName } = req.body;
    var productSchema = utils.getProductSchema(collectionName);
    var configSchema = require("../models/configSchema");
    const environment = process.env.host && process.env.host === "production" ? "production" : "staging";

    configSchema
        .findOne({ CollectionRelevantFor: collectionName })
        .then((config) => {
            const update_logics = config.update_logics.filter((l) => l["dependency_fields"]);
            const is_new_record = recordId === "new";
            const record_condition = is_new_record ? {} : { RecordId: recordId };
            var query = productSchema.findOne(record_condition);
            const buildNumber = revision.getBuildNumber();
            if (is_new_record) query = query.sort({ RecordId: -1 });
            query
                .then(async function (result) {
                    const lastRecordId = result["RecordId"];
                    let not_updated_fields = [];
                    let warnings = [];
                    if (is_new_record) result = await utils.generateEmptyRecord(collectionName, config);
                    let AuditNumber = result.AuditState.AuditNumber || result.AuditState.AuditNumber === 0 ? parseInt(result.AuditState.AuditNumber) + 1 : 0;
                    let AuditValueArray = [];
                    const auditDate = new Date().toISOString();
                    let auditSessionData = {
                        AuditDate: auditDate,
                        RegisteredUserEmail: audit_info.UserName,
                        ConfidenceScore: audit_info.ConfidenceScore,
                        NoteOnConfidenceScore: audit_info.NoteOnConfidenceScore,
                        AuditNumber: AuditNumber,
                        AuditValueArray: []
                    };

                    const old_current_state = lodash.cloneDeep(result.CurrentState);
                    const changedFields = Object.keys(changedValues);
                    const autoChangedFields = changedFields.filter((f) => changedValues[f]["valid"] === false);
                    let changedArrayFields = [];
                    var AuditArrayValueList = [];
                    let log_messages = [];
                    let log_message = "";
                    let researcherName = null;
                    if (changedValues["name_of_researcher"]) {
                        researcherName = changedValues["name_of_researcher"]["value"];
                    }
                    if (changedValues["ResearcherName"]) {
                        researcherName = changedValues["ResearcherName"]["value"];
                    }
                    if (!researcherName) {
                        if (result.CurrentState.ResearcherName) researcherName = result.CurrentState.ResearcherName;
                        if (result.CurrentState.name_of_researcher) researcherName = result.CurrentState.name_of_researcher;
                    }
                    for (let i = 0; i < changedFields.length; i++) {
                        const orig_key = changedFields[i];
                        let key = changedFields[i];
                        const item = changedValues[key];
                        let temp = {};
                        if (item.value || item.value !== undefined) {
                            let complex_field_index = null;
                            let mainKey = null;
                            let subKey = null;
                            //If the updated data is a simple field
                            if (!result.CurrentState[key]) {
                                //If the updated data is a simple field in complex field
                                if (key.split(".").length === 3 && key.indexOf(".index") > 0) {
                                    const ar = key.split(".");
                                    mainKey = ar[0];
                                    complex_field_index = parseInt(ar[1].replace("index", ""));
                                    subKey = ar[2];
                                    key = ar[0] + "." + ar[2];
                                }
                            }

                            const fields = config["DefaultFieldsToDisplayInAuditSession"].find((f) => {
                                return f["name"] && f["name"] === mainKey;
                            });
                            let value = { val: "" };
                            if (fields && fields.nested_fields && fields.nested_fields.find((f) => f.name && f.name === subKey)) value.val = [];
                            else value = convertDataTypes(item.value, "=", key, config, mainKey !== null);

                            let pass = false;
                            if (result.CurrentState[key] && result.CurrentState[key].toString() === (value.val || "").toString() && !item.valid) {
                                warnings.push(`The value for field '${key}' is the same as the value in database`);
                                pass = true;
                            }
                            let oldValue = result.CurrentState[key];
                            if (mainKey && complex_field_index !== null) {
                                if (result.CurrentState[mainKey][complex_field_index]) {
                                    oldValue = result.CurrentState[mainKey][complex_field_index][subKey];
                                    if ((oldValue || "").toString() === (value.val || "").toString() && !item.valid) {
                                        if (value.val === false && oldValue !== false) {
                                        } else {
                                            warnings.push(`The value for field '${orig_key.replace(".index", "")}' is the same as the value in database`);
                                            pass = true;
                                        }
                                    }
                                    if (!item.valid && !pass) result.CurrentState[mainKey][complex_field_index][subKey] = value.val;
                                } else {
                                    var item_array = null;
                                    let new_element = {};
                                    if (fields && fields.nested_fields) {
                                        fields.nested_fields.forEach((field) => {
                                            if (field.name) {
                                                new_element[field.name] = [];
                                            } else new_element[field] = "";
                                        });
                                        new_element["_id"] = ObjectId();
                                        result.CurrentState[mainKey][complex_field_index] = new_element;
                                        item_array = new_element[subKey];
                                    }
                                    oldValue = null;
                                    if (!item.valid && !pass) result.CurrentState[mainKey][complex_field_index][subKey] = value.val;
                                }
                            } else {
                                oldValue = result.CurrentState[key];
                                if (!item.valid && !pass) result.CurrentState[key] = value.val;
                            }
                            temp = {
                                AuditFieldName: orig_key,
                                NewValue: value.val,
                                OldValue: oldValue,
                                Valid: false,
                                AuditedComment: item.comment ? item.comment : null
                            };
                            if (item.valid) {
                                temp.Valid = true;
                                temp.NewValue = oldValue;
                                if (!pass) AuditValueArray.push(temp);
                            }
                            log_message = JSON.stringify(temp).replace("NewValue", "new_value").replace("OldValue", "old_value");
                            log_messages.push({
                                environment: environment,
                                application_version: buildNumber,
                                audit_type: "Update field",
                                user: audit_info.UserName,
                                collection: collectionName,
                                RecordId: recordId,
                                audited_value_valid: item.valid,
                                AuditSession: log_message,
                                log_type: "Manual audit",
                                ResearcherName: researcherName
                            });
                            if (!item.valid && !pass) {
                                AuditValueArray.push(temp);
                            }
                        }
                        delete item["value"];
                        delete item["comment"];
                        delete item["valid"];
                        key = orig_key;
                        const item_keys = Object.keys(item);

                        if (item_keys.length > 0) {
                            let complex_field_index = null;
                            let mainKey = null;
                            let subKey = null;
                            //If the updated data is an array field
                            let item_array = null;
                            let fields_list = config["DefaultFieldsToDisplayInAuditSession"].find((f) => {
                                return f["name"] && f["name"] === key;
                            });
                            if (!result.CurrentState[key]) {
                                //If the updated data is an array field in complex field
                                fields_list = [];
                                if (key.split(".").length === 3 && key.indexOf(".index") > 0) {
                                    const ar = key.split(".");
                                    mainKey = ar[0];
                                    complex_field_index = parseInt(ar[1].replace("index", ""));
                                    subKey = ar[2];
                                    key = ar[0] + "." + ar[2];
                                    item_array = result.CurrentState[mainKey];
                                    if (item_array[complex_field_index]) {
                                        item_array = item_array[complex_field_index][subKey];
                                    } else {
                                        item_array = null;
                                        let new_element = {};
                                        const fields = config["DefaultFieldsToDisplayInAuditSession"].find((f) => {
                                            return f["name"] && f["name"] === ar[0];
                                        });
                                        if (fields && fields.nested_fields) {
                                            fields.nested_fields.forEach((field) => {
                                                if (field.name) {
                                                    new_element[field.name] = [];
                                                } else new_element[field] = "";
                                            });
                                            new_element["_id"] = ObjectId();
                                            result.CurrentState[mainKey][complex_field_index] = new_element;
                                            item_array = new_element[subKey];
                                        }
                                    }
                                } else {
                                    if (key.split(".").length === 2 && key.split(".")[1] === "_id") {
                                        const ar = key.split(".");
                                        mainKey = ar[0];
                                        item_keys.forEach((id) => {
                                            if (item[id]["delete"] && item[id]["delete"]["value"]) {
                                                const del_index = result.CurrentState[mainKey].findIndex((f) => f["_id"].toString() === id.toString());
                                                if (del_index >= 0) {
                                                    const comment = "Remove " + mainKey + " element of _id " + id;
                                                    temp = {
                                                        AuditFieldName: mainKey,
                                                        NewValue: null,
                                                        OldValue: result.CurrentState[mainKey][del_index],
                                                        Valid: false,
                                                        AuditedComment: comment
                                                    };
                                                    result.CurrentState[mainKey].splice(del_index, 1);

                                                    log_message = JSON.stringify(temp).replace("NewValue", "new_value").replace("OldValue", "old_value");
                                                    log_messages.push({
                                                        environment: environment,
                                                        application_version: buildNumber,
                                                        audit_type: "Delete subrecord",
                                                        user: audit_info.UserName,
                                                        collection: collectionName,
                                                        RecordId: recordId,
                                                        AuditSession: log_message,
                                                        log_type: "Manual audit",
                                                        ResearcherName: researcherName
                                                    });
                                                    AuditValueArray.push(temp);
                                                }
                                            }
                                        });
                                    }
                                    continue;
                                }
                            } else {
                                if (fields_list && fields_list["AllSubDocumentFields"]) fields_list = fields_list["AllSubDocumentFields"];
                                else fields_list = null;
                                item_array = result.CurrentState[key];
                            }
                            for (var k = 0; k < item_keys.length; k++) {
                                const item_id = item_keys[k];
                                let item_index = item_array.findIndex((t) => t["_id"] && t["_id"].toString() == item_id.toString());
                                if (item_index < 0) {
                                    let new_item = {};
                                    const default_keys = fields_list ? fields_list : Object.keys(item_array.length > 0 ? item_array[0] : item[item_id]);
                                    for (const key1 in default_keys) {
                                        new_item[default_keys[key1]] = null;
                                    }
                                    new_item["_id"] = ObjectId();
                                    if (item[item_id]["deleted"])
                                        if (item[item_id]["deleted"]["value"] === 1) continue;
                                        else delete item[item_id];
                                    for (const field_key in item[item_id]) {
                                        if (!item[item_id][field_key]["valid"]) {
                                            const complex_key1 = key + "." + field_key;
                                            const temp_value = convertDataTypes(item[item_id][field_key]["value"], "=", complex_key1, config, true);
                                            new_item[field_key] = temp_value.val;
                                            if (temp_value.val !== null)
                                                changedArrayFields.push({
                                                    id_value: new_item["_id"],
                                                    field: (mainKey ? orig_key : key) + "." + field_key
                                                });
                                        }
                                    }
                                    const comment = "Add " + key + " subdocument of _id " + new_item["_id"];
                                    temp = {
                                        AuditFieldName: key,
                                        NewValue: new_item,
                                        OldValue: null,
                                        Valid: false,
                                        AuditedComment: comment
                                    };
                                    AuditValueArray.push(temp);
                                    item_array.push(new_item);
                                    log_message = JSON.stringify(temp).replace("NewValue", "new_value").replace("OldValue", "old_value");
                                    log_messages.push({
                                        environment: environment,
                                        audit_type: "Adding subdocument",
                                        application_version: buildNumber,
                                        user: audit_info.UserName,
                                        collection: collectionName,
                                        RecordId: recordId,
                                        AuditSession: log_message,
                                        log_type: "Manual audit",
                                        ResearcherName: researcherName
                                    });
                                    continue;
                                }
                                let old_item = item_array[item_index];
                                if (item[item_id]["deleted"]) {
                                    if (item[item_id]["deleted"]["value"] === 1) {
                                        const comment = "Remove " + key + " subdocument of _id " + item_id;
                                        temp = {
                                            AuditFieldName: key,
                                            NewValue: null,
                                            OldValue: item_array[item_index],
                                            Valid: false,
                                            AuditedComment: comment
                                        };
                                        log_message = JSON.stringify(temp).replace("NewValue", "new_value").replace("OldValue", "old_value");
                                        log_messages.push({
                                            environment: environment,
                                            application_version: buildNumber,
                                            audit_type: "Delete subrecord",
                                            user: audit_info.UserName,
                                            collection: collectionName,
                                            RecordId: recordId,
                                            AuditSession: log_message,
                                            log_type: "Manual audit",
                                            ResearcherName: researcherName
                                        });
                                        AuditValueArray.push(temp);
                                        Object.keys(old_item).forEach((deleted_key) => {
                                            if (
                                                !changedArrayFields.find((f) => {
                                                    return f["id_value"] === -1 && f["field"] === key + "." + deleted_key;
                                                })
                                            )
                                                changedArrayFields.push({
                                                    id_value: -1,
                                                    field: (mainKey ? orig_key : key) + "." + deleted_key,
                                                    deleted: true
                                                });
                                        });
                                        item_array.splice(item_index, 1);

                                        continue;
                                    } else {
                                        delete item[item_id]["deleted"];
                                    }
                                }
                                const updated_item = item[item_id];
                                const keys = Object.keys(updated_item);
                                for (var j = 0; j < keys.length; j++) {
                                    const field = keys[j];
                                    const complex_key = key + "." + field;

                                    const value = convertDataTypes(updated_item[field].value, "=", complex_key, config, true);
                                    let pass = false;
                                    if (old_item[field] === value.val && !updated_item[field].valid) {
                                        warnings.push(`The value for field '${complex_key}' is the same as the value in database`);
                                        pass = true;
                                    }
                                    let new_item = Object.assign({}, old_item);
                                    new_item[field] = value.val;
                                    temp = {
                                        AuditFieldName: key.replace(".", complex_field_index !== null ? "." + complex_field_index + "." : ".") + "." + item_id + "." + field,
                                        NewValue: new_item[field],
                                        OldValue: old_item[field],
                                        Valid: false,
                                        AuditedComment: updated_item[field].comment ? updated_item[field].comment : null
                                    };
                                    if (updated_item[field].valid) {
                                        temp.Valid = true;
                                        temp.NewValue = old_item[field];
                                        temp.OldValue = old_item[field];
                                        if (!pass) AuditValueArray.push(temp);
                                    }
                                    log_message = JSON.stringify(temp).replace("NewValue", "new_value").replace("OldValue", "old_value");
                                    log_messages.push({
                                        environment: environment,
                                        application_version: buildNumber,
                                        audit_type: "Update subrecord field",
                                        user: audit_info.UserName,
                                        audited_value_valid: updated_item[field].valid,
                                        collection: collectionName,
                                        RecordId: recordId,
                                        AuditSession: log_message,
                                        log_type: "Manual audit",
                                        ResearcherName: researcherName
                                    });
                                    if (updated_item[field].valid || pass) continue;
                                    AuditValueArray.push(temp);
                                    old_item[field] = value.val;
                                    changedArrayFields.push({
                                        id_value: item_id,
                                        field: (mainKey ? orig_key : key) + "." + field
                                    });
                                }
                                item_array[item_index] = old_item;
                            }
                            if (mainKey && complex_field_index !== null) {
                                result.CurrentState[mainKey][complex_field_index][subKey] = item_array;
                            } else result.CurrentState[key] = item_array;
                        }
                    }

                    const [errors_b, validator_errors] = checkBusinessRules(config, result.CurrentState);
                    if (errors_b.length > 0 || Object.keys(validator_errors).length > 0) {
                        res.send({
                            success: false,
                            not_updated_fields: errors_b,
                            validator_errors: validator_errors,
                            saveChangedValues: true
                        });
                        return;
                    }
                    var update_error = false;

                    var auto_changed_fields = autoChangedFields.concat(changedArrayFields);
                    //console.log(auto_changed_fields);
                    const api_updates = config.api_updates;
                    if (api_updates && api_updates.length > 0) {
                        for (var api_i = 0; api_i < api_updates.length; api_i++) {
                            const api_update = api_updates[api_i];
                            const api_result = await interbank_api(result, collectionName, audit_info, config, api_update, auto_changed_fields.slice(0), environment);
                            if (api_result.error) {
                                res.send({
                                    success: false,
                                    error: api_result.error
                                });
                                utils.logKabana(log_messages, "record_audit", false, api_result.error, req);
                                return;
                            } else {
                                if (api_result.new_updated_fields && api_result.record) {
                                    result = api_result.record;
                                    auto_changed_fields = auto_changed_fields.concat(api_result.new_updated_fields);
                                    if (api_result.log_messages && api_result.log_messages.length > 0) log_messages = log_messages.concat(api_result.log_messages);
                                }
                            }
                        }
                    }

                    var n = 0;
                    var auto_update_error_message = "";

                    function auto_update_sort_function(a) {
                        return a["dependency_fields"][0].split(".").length * 100 - a["updated_field"].split(".").length;
                    }
                    // update_logics.sort(function (a, b) {
                    //     return auto_update_sort_function(a) - auto_update_sort_function(b);
                    // });

                    for (let i = 0; i < update_logics.length; i++) {
                        var connected_indexes = [];
                        for (let i2 = 0; i2 < update_logics.length; i2++) {
                            if (i2 !== i && update_logics[i2].dependency_fields.includes(update_logics[i].updated_field)) {
                                connected_indexes.push(i2);
                            }
                        }
                        update_logics[i].connected_indexes = connected_indexes;
                    }

                    for (let i = 0; i < update_logics.length; i++) {
                        if (update_error) continue;
                        if (!auto_changed_fields.some((t) => update_logics[i].dependency_fields.includes(t))) continue;
                        var index_chain = [];
                        var index = i;
                        var new_values = update_logics[i].connected_indexes;
                        while (!index_chain.includes(index) && new_values.length && !update_error) {
                            var new_values_temp = [];
                            for (let i2 = 0; i2 < new_values.length; i2++) {
                                index_chain.push(new_values[i2]);
                                new_values_temp = new_values_temp.concat(update_logics[new_values[i2]].connected_indexes);
                            }
                            new_values = new_values_temp;
                            if (index_chain.includes(index) || index_chain.some((t, i) => index_chain.indexOf(t) !== i)) {
                                let temp = {
                                    AuditFieldName: update_logics[i].updated_field,
                                    AuditType: "Automatic Update From Config",
                                    UpdateLogic: "{" + update_logics[i].update_logic + "}",
                                    NewValue: result.CurrentState[update_logics[i].updated_field],
                                    OldValue: result.CurrentState[update_logics[i].updated_field],
                                    Valid: true,
                                    AuditedComment: "Automatic Update from Config FAILED, error: Circular dependence"
                                };
                                auto_update_error_message = "Circular dependence";
                                AuditValueArray = [temp];
                                update_error = true;
                            }
                        }
                    }
                    let external_users_list = [];
                    //console.log(update_logics);
                    if (update_logics.find((u) => u.useExternalUsers)) {
                        const userSchema = utils.getUserSchema();
                        external_users_list = await userSchema
                            .find({
                                role: "external"
                            })
                            .select(["FirstName", "LastName", "Location", "Upwork_Id", "Upwork_Profile_Id", "RegisteredUserEmail"]);
                    }
                    global.external_users = external_users_list;
                    class CustomStateGetter {
                        constructor() {
                            return new Proxy(this, this);
                        }
                        get(target, prop) {
                            if (prop === "external_users") {
                                if (this.state[prop] === undefined) this.state[prop] = global.external_users;
                                //console.log("external_users");
                                return global.external_users;
                            }
                            // console.log(this.state[prop]);
                            if (this.state[prop] === undefined) throw prop + " does not exist in CurrentState";
                            return this.state[prop];
                        }
                    }

                    var custom_state = new CustomStateGetter();

                    let warning_messages = [];
                    const sesions = result.AuditSessions;
                    let sessions_array = [];
                    sesions.forEach((s) => {
                        sessions_array = sessions_array.concat(s["AuditValueArray"]);
                    });
                    let updated_tables = [
                        ...new Set(
                            auto_changed_fields
                                .filter((f) => f["id_value"])
                                .map((f) => {
                                    var a = f.field.split(".");
                                    a.splice(a.length - 1, 1);
                                    return a.join(".");
                                })
                        )
                    ];
                    while (!update_error && auto_changed_fields.length && n < 5) {
                        n = n + 1;
                        var new_changed_fields = [];
                        var auto_updated_fields = [];
                        // console.log(update_logics[0].name);
                        update_logics.forEach(function (logic, index) {
                            let t = lodash.cloneDeep(result.CurrentState);
                            t.external_users = external_users_list;
                            custom_state.state = t;
                            if (update_error) return;
                            var updated = false;

                            let nan_error = false;
                            let array_updated = false;
                            let nested_field_updated = false;

                            // console.log("        ");
                            // console.log(auto_changed_fields);
                            //console.log(logic.dependency_fields);
                            // console.log("        ");

                            logic.dependency_fields.forEach(function (field) {
                                const ar = field.split(".");
                                if (config.ComplexFields.includes(ar[0])) {
                                    if (ar.length === 2 && auto_changed_fields.find((f) => !f.field && f.startsWith(ar[0] + ".") && f.includes("." + ar[1]))) {
                                        updated = true;
                                        array_updated = true;
                                        nested_field_updated = true;
                                    }
                                    if (
                                        ar.length === 3 &&
                                        auto_changed_fields.find(
                                            (f) => f.field && f.field.startsWith(ar[0] + ".") && f.field.includes("." + ar[1]) && f.field.includes("." + ar[2])
                                        )
                                    ) {
                                        updated = true;
                                        array_updated = true;
                                        nested_field_updated = true;
                                    }
                                }
                                if (updated) return;
                                if (auto_changed_fields.includes(field)) {
                                    updated = true;
                                }
                                if (
                                    auto_changed_fields.find((t) => {
                                        if (t.field && t.field == field) {
                                            if (t["id_value"] === -1 && logic.updated_field.indexOf(".") > 0) return false;
                                            return true;
                                        }
                                        return false;
                                    })
                                ) {
                                    updated = true;
                                    array_updated = true;
                                }
                            });

                            if (updated) {
                                if (auto_updated_fields.includes(logic.updated_field)) {
                                    auto_update_error_message = "Ambiguous update";
                                    let temp = {
                                        AuditFieldName: logic.updated_field,
                                        AuditType: "Automatic Update From Config",
                                        UpdateLogic: "{" + logic.update_logic + "}",
                                        NewValue: old_current_state[logic.updated_field],
                                        OldValue: old_current_state[logic.updated_field],
                                        Valid: true,
                                        AuditedComment: "Automatic Update from Config FAILED, error: " + auto_update_error_message
                                    };
                                    AuditValueArray = [temp];
                                    update_error = true;
                                    updated = false;
                                }
                            }
                            if (updated && !update_error) {
                                var f = null;
                                let temp = false;

                                try {
                                    if (array_updated) f = new Function(["CurrentState", "this_field"], logic.update_logic.split("this[").join("this_field["));
                                    else f = new Function("CurrentState", logic.update_logic);
                                } catch (error) {
                                    temp = {
                                        AuditFieldName: logic.updated_field,
                                        AuditType: "Automatic Update From Config",
                                        UpdateLogic: "{" + logic.update_logic + "}",
                                        NewValue: old_current_state[logic.updated_field],
                                        OldValue: old_current_state[logic.updated_field],
                                        Valid: true,
                                        AuditedComment: "Failed Automatic Update, Error: " + error
                                    };
                                    update_error = true;
                                    const error_message = logic.updated_field + " update was unsuccessful: " + error;
                                    if (!not_updated_fields.includes(error_message)) not_updated_fields.push(error_message);
                                }

                                var new_state = false;
                                if (temp === false) {
                                    if (array_updated && logic.dependency_fields.some((t) => t.indexOf(".") > 0)) {
                                        const array_dependency_field = logic.dependency_fields.filter((t) => t.indexOf(".") > 0);
                                        const fieldName = array_dependency_field[0].split(".")[0];
                                        let is_updated_field_array = false;
                                        if (
                                            ((logic.updated_field.split(".")[0] == fieldName && result.CurrentState[fieldName] && Array.isArray(result.CurrentState[fieldName])) ||
                                                (logic.updated_field.indexOf(".") < 0 && !Array.isArray(result.CurrentState[logic.updated_field]))) &&
                                            !nested_field_updated
                                        ) {
                                            auto_changed_fields
                                                .filter((f) => f.field && array_dependency_field.includes(f.field))
                                                .forEach(function (item) {
                                                    if (config.updates_manual_overwrite_fields) {
                                                        if (config.updates_manual_overwrite_fields.includes(logic.updated_field)) {
                                                            const parts = logic.updated_field.split(".");
                                                            switch (parts.length) {
                                                                case 1:
                                                                    if (sessions_array.find((s) => s["AuditFieldName"] === logic.updated_field)) return;
                                                                    break;
                                                                case 2:
                                                                    const update_session = sessions_array.find((s) => {
                                                                        const ar = s["AuditFieldName"].split(".");
                                                                        if (ar.length === 3 && ar[1] === item["id_value"].toString() && ar[0] === parts[0] && ar[2] === parts[1]) {
                                                                            return true;
                                                                        }
                                                                        return false;
                                                                    });
                                                                    if (update_session) return;
                                                            }
                                                        }
                                                    }
                                                    let updating_field =
                                                        item["id_value"] === -1
                                                            ? {}
                                                            : result.CurrentState[fieldName].find((t) => t["_id"] && t["_id"].toString() === item["id_value"].toString());
                                                    var this_custom_state = new CustomStateGetter();

                                                    this_custom_state.state = updating_field;
                                                    is_updated_field_array =
                                                        logic.updated_field.split(".").length > 1 && Array.isArray(result.CurrentState[logic.updated_field.split(".")[0]]);
                                                    const new_function = logic.update_logic.split("this[").join("this_field[");
                                                    f = new Function(["CurrentState", "this_field"], new_function);
                                                    if (item["id_value"] !== -1) {
                                                        try {
                                                            new_state = f(custom_state, this_custom_state);
                                                            const validator = config["Validators"].find((t) => t.name === logic.updated_field);
                                                            if (typeof new_state === "number" && (isNaN(new_state) || Math.abs(new_state) === Infinity))
                                                                throw "Auto update function returned NaN or Infinity";
                                                            if (typeof new_state === "number" && (!validator || validator.type !== "numeric"))
                                                                warning_messages.push("Warning: " + logic.updated_field + " is defined as text");
                                                            if (!validator || validator.type === "text") new_state = new_state ? new_state.toString() : "";
                                                            if (validator) {
                                                                const errors = validate(validator, logic.updated_field, new_state);
                                                                if (errors.length > 0) {
                                                                    not_updated_fields = not_updated_fields.concat(errors);
                                                                    update_error = true;
                                                                }
                                                            }
                                                        } catch (error) {
                                                            temp = {
                                                                AuditFieldName: logic.updated_field.replace(".", "." + item["id_value"] + "."),
                                                                AuditType: "Automatic Update From Config",
                                                                UpdateLogic: "{" + logic.update_logic + "}",
                                                                NewValue: old_current_state[logic.updated_field.split(".")[0]],
                                                                OldValue: old_current_state[logic.updated_field.split(".")[0]],
                                                                Valid: true,
                                                                AuditedComment: "Failed Automatic Update, Error: " + error
                                                            };
                                                            const error_message = logic.updated_field + " update was unsuccessful: " + error;
                                                            if (!not_updated_fields.includes(error_message)) not_updated_fields.push(error_message);
                                                        }
                                                        if (new_state == undefined) return;
                                                    } else {
                                                        is_updated_field_array = false;
                                                    }
                                                    if (temp === false) {
                                                        if (is_updated_field_array && item["id_value"] !== -1) {
                                                            const updated_index = result.CurrentState[fieldName].findIndex(
                                                                (t) => t["_id"] && t["_id"].toString() === item["id_value"]
                                                            );
                                                            var custom_state2 = new CustomStateGetter();
                                                            custom_state2.state = lodash.cloneDeep(result.CurrentState);
                                                            updating_field[logic.updated_field.split(".")[1]] = f(custom_state2, updating_field);
                                                            result.CurrentState[fieldName][updated_index] = updating_field;
                                                            log_messages.push({
                                                                environment: environment,
                                                                application_version: buildNumber,
                                                                audit_type: "Update subrecord field",
                                                                user: audit_info.UserName,
                                                                audited_value_valid: false,
                                                                collection: collectionName,
                                                                RecordId: recordId,
                                                                SubRecordIndex: updated_index,
                                                                old_value:
                                                                    old_current_state[fieldName][updated_index] &&
                                                                    old_current_state[fieldName][updated_index][logic.updated_field.split(".")[1]],
                                                                new_value: result.CurrentState[fieldName][updated_index][logic.updated_field.split(".")[1]],
                                                                updated_field: logic.updated_field,
                                                                log_type: "Automatic update"
                                                            });
                                                            custom_state.state = result.CurrentState;
                                                            new_changed_fields.push({
                                                                id_value: item["id_value"],
                                                                field: logic.updated_field
                                                            });
                                                            //let old_value = old_current_state[logic.updated_field.split('.')[0]][updated_index];
                                                            //old_value['_id'] = ObjectId(old_value['_id']);
                                                        } else {
                                                            if (result.CurrentState[logic.updated_field] !== undefined && logic.updated_field !== "None") {
                                                                custom_state.state = lodash.cloneDeep(result.CurrentState);
                                                                result.CurrentState[logic.updated_field] = f(custom_state, updating_field);
                                                                log_messages.push({
                                                                    environment: environment,
                                                                    application_version: buildNumber,
                                                                    audit_type: "Update subrecord field",
                                                                    user: audit_info.UserName,
                                                                    audited_value_valid: false,
                                                                    collection: collectionName,
                                                                    RecordId: recordId,
                                                                    old_value: old_current_state[logic.updated_field],
                                                                    new_value: result.CurrentState[logic.updated_field],
                                                                    updated_field: logic.updated_field,
                                                                    log_type: "Automatic update"
                                                                });
                                                                custom_state.state = result.CurrentState;
                                                                new_changed_fields.push(logic.updated_field);
                                                            }
                                                        }
                                                    }
                                                });
                                        } else {
                                            auto_changed_fields.forEach((field) => {
                                                //Updates for complex nested fields
                                                if (field.field) {
                                                    const ar = field.field.split(".");
                                                    const updated_ar = logic.updated_field.split(".");
                                                    if (ar.length === 4 && config.ComplexFields.includes(ar[0])) {
                                                        if (updated_ar.length === 3 && ar.length === 4 && ar[0] === updated_ar[0] && ar[2] === updated_ar[1]) {
                                                            const updated_index = parseInt(ar[1].replace("index", ""));
                                                            if (!isNaN(updated_index)) {
                                                                if (result.CurrentState[ar[0]][updated_index][ar[2]]) {
                                                                    const sub_index = result.CurrentState[ar[0]][updated_index][ar[2]].findIndex(
                                                                        (t) => t["_id"].toString() === field["id_value"].toString()
                                                                    );
                                                                    if (sub_index >= 0) {
                                                                        const row = result.CurrentState[ar[0]][updated_index][ar[2]][sub_index];
                                                                        const new_function = logic.update_logic.split("this[").join("this_field[");
                                                                        const f = new Function(["CurrentState", "this_field", "row"], new_function);
                                                                        custom_state.state = lodash.cloneDeep(result.CurrentState);
                                                                        const new_value = f(custom_state, result.CurrentState[ar[0]][updated_index], row);
                                                                        result.CurrentState[ar[0]][updated_index][ar[2]][sub_index][updated_ar[2]] = new_value;
                                                                        custom_state.state = result.CurrentState;
                                                                        new_changed_fields.push(ar[0] + ".index" + updated_index + "." + updated_ar[1]);
                                                                    }
                                                                }
                                                            }
                                                        }
                                                        if (updated_ar.length === 2 && ar.length === 4 && ar[0] === updated_ar[0]) {
                                                            const updated_index = parseInt(ar[1].replace("index", ""));
                                                            if (!isNaN(updated_index)) {
                                                                if (result.CurrentState[ar[0]][updated_index][ar[2]]) {
                                                                    const sub_index = result.CurrentState[ar[0]][updated_index][ar[2]].findIndex(
                                                                        (t) => t["_id"].toString() === field["id_value"].toString()
                                                                    );
                                                                    if (sub_index >= 0 || field.deleted) {
                                                                        const row = sub_index >= 0 ? result.CurrentState[ar[0]][updated_index][ar[2]][sub_index] : {};
                                                                        const new_function = logic.update_logic.split("this[").join("this_field[");
                                                                        const f = new Function(["CurrentState", "this_field", "row"], new_function);
                                                                        custom_state.state = lodash.cloneDeep(result.CurrentState);
                                                                        const new_value = f(custom_state, result.CurrentState[ar[0]][updated_index], row);
                                                                        result.CurrentState[ar[0]][updated_index][updated_ar[1]] = new_value;
                                                                        custom_state.state = result.CurrentState;
                                                                        new_changed_fields.push(ar[0] + ".index" + updated_index + "." + updated_ar[1]);
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    } else {
                                                        if (ar.length === 2 && Array.isArray(result.CurrentState[logic.updated_field]) && logic.updated_field.indexOf(".") < 0) {
                                                            const updated_index = result.CurrentState[ar[0]].findIndex((t) => t["_id"].toString() === field["id_value"].toString());
                                                            if (!isNaN(updated_index)) {
                                                                const new_function = logic.update_logic.split("this[").join("this_field[");
                                                                const f = new Function(["CurrentState", "this_field"], new_function);
                                                                custom_state.state = result.CurrentState;
                                                                const new_value = f(custom_state, result.CurrentState[ar[0]][updated_index]);
                                                                result.CurrentState[logic.updated_field] = new_value;
                                                                new_changed_fields.push({
                                                                    id_value: logic.updated_field,
                                                                    field: logic.updated_field
                                                                });
                                                            }
                                                        }
                                                    }
                                                } else {
                                                    const ar = field.split(".");
                                                    if (ar.length > 2 && config.ComplexFields.includes(ar[0])) {
                                                        const updated_ar = logic.updated_field.split(".");
                                                        if (updated_ar.length === 2 && updated_ar[0] === ar[0]) {
                                                            const updated_index = parseInt(ar[1].replace("index", ""));
                                                            if (!isNaN(updated_index)) {
                                                                const new_function = logic.update_logic.split("this[").join("this_field[");
                                                                const f = new Function(["CurrentState", "this_field"], new_function);
                                                                custom_state.state = result.CurrentState;
                                                                const new_value = f(custom_state, result.CurrentState[ar[0]][updated_index]);
                                                                result.CurrentState[ar[0]][updated_index][updated_ar[1]] = new_value;
                                                                custom_state.state = result.CurrentState;
                                                                new_changed_fields.push(ar[0] + ".index" + updated_index + "." + updated_ar[1]);
                                                            }
                                                        }
                                                    }
                                                }
                                            });
                                        }
                                    } else {
                                        if (config.updates_manual_overwrite_fields) {
                                            if (config.updates_manual_overwrite_fields.includes(logic.updated_field)) {
                                                if (sessions_array.find((s) => s["AuditFieldName"] === logic.updated_field)) return;
                                            }
                                        }
                                        try {
                                            new_state = f(custom_state);
                                            const validator = config["Validators"].find((t) => t.name === logic.updated_field);
                                            if (typeof new_state === "number" && (isNaN(new_state) || Math.abs(new_state) === Infinity))
                                                throw "Auto update function returned NaN or Infinity";
                                            if (typeof new_state === "number" && (!validator || validator.type !== "numeric"))
                                                warning_messages.push("Warning: " + logic.updated_field + " is defined as text");
                                            if (!validator || validator.type === "text") new_state = new_state ? new_state.toString() : "";
                                            if (validator) {
                                                const errors = validate(validator, logic.updated_field, new_state);
                                                if (errors.length > 0) {
                                                    not_updated_fields = not_updated_fields.concat(errors);
                                                    update_error = true;
                                                }
                                            }
                                        } catch (error) {
                                            nan_error = true;
                                            temp = {
                                                AuditFieldName: logic.updated_field,
                                                AuditType: "Automatic Update From Config",
                                                UpdateLogic: "{" + logic.update_logic + "}",
                                                NewValue: old_current_state[logic.updated_field],
                                                OldValue: old_current_state[logic.updated_field],
                                                Valid: true,
                                                AuditedComment: "Failed Automatic Update, Error: " + error
                                            };
                                            const error_message = logic.updated_field + " update was unsuccessful: " + error;
                                            if (!not_updated_fields.includes(error_message)) not_updated_fields.push(error_message);
                                        }
                                    }
                                }

                                if (new_state == undefined) return;
                                if (temp === false && !array_updated && !nan_error) {
                                    if (result.CurrentState[logic.updated_field] !== undefined) {
                                        let t = result.CurrentState;
                                        t.external_users = external_users_list;
                                        custom_state.state = t;
                                        result.CurrentState[logic.updated_field] = f(t);
                                        log_messages.push({
                                            environment: environment,
                                            application_version: buildNumber,
                                            audit_type: "Update subrecord field",
                                            user: audit_info.UserName,
                                            audited_value_valid: false,
                                            collection: collectionName,
                                            RecordId: recordId,
                                            old_value: old_current_state[logic.updated_field],
                                            new_value: result.CurrentState[logic.updated_field],
                                            updated_field: logic.updated_field,
                                            log_type: "Automatic update"
                                        });
                                        custom_state.state = result.CurrentState;
                                        if (!updated_tables.includes(logic.updated_field) && !logic.dependency_fields.includes(logic.updated_field))
                                            new_changed_fields.push(logic.updated_field);
                                        // temp = {
                                        // 	AuditFieldName: logic.updated_field,
                                        // 	UpdateLogic:'{' + logic.update_logic + '}',
                                        // 	NewValue: result.CurrentState[logic.updated_field],
                                        // 	OldValue: old_current_state[logic.updated_field],
                                        // 	Valid: false,
                                        // 	AuditedComment: 'Successful Automatic Update',
                                        // };
                                    } else {
                                        if (logic.updated_field !== "None") {
                                            const error_message = 'Automatic update failed due to "' + logic.updated_field + '" field not existing.';
                                            if (!not_updated_fields.includes(error_message)) not_updated_fields.push(error_message);
                                        }
                                    }
                                }
                                if (temp) AuditArrayValueList.push(temp);
                                auto_updated_fields.push(logic.updated_field);
                            }
                        });
                        auto_changed_fields = new_changed_fields;
                        if (auto_changed_fields.length === 0 && updated_tables.length > 0) {
                            auto_changed_fields = updated_tables;
                            updated_tables = [];
                        }
                        if (update_error) auto_changed_fields = [];
                    }
                    delete result.CurrentState["external_users"];
                    auditSessionData.AuditValueArray = AuditValueArray;
                    if (update_error) {
                        auditSessionData.AuditType = "Automatic Update From Config";
                        auditSessionData.UpdateLogic = AuditValueArray[0].UpdateLogic;
                    }
                    let update_audit_state = false;
                    if (AuditValueArray.length > 0) {
                        update_audit_state = true;
                        result.AuditSessions.push(auditSessionData);
                    }
                    if (!update_error && AuditArrayValueList.length) {
                        update_audit_state = true;
                        for (let i = 0; i < AuditArrayValueList.length; i++) {
                            AuditNumber++;
                            let auditSessionData = {
                                AuditDate: auditDate,
                                RegisteredUserEmail: audit_info.UserName,
                                ConfidenceScore: audit_info.ConfidenceScore,
                                NoteOnConfidenceScore: audit_info.NoteOnConfidenceScore,
                                AuditNumber: AuditNumber,
                                AuditType: AuditArrayValueList[i].UpdateLogic ? "Automatic Update From Config" : "Manual Update",
                                UpdateLogic: AuditArrayValueList[i].UpdateLogic,
                                AuditValueArray: []
                            };
                            AuditArrayValueList[i].UpdateLogic = undefined;
                            auditSessionData.AuditValueArray = [AuditArrayValueList[i]];
                            result.AuditSessions.push(auditSessionData);
                        }
                    }
                    let AuditState = Object.assign({}, result.AuditState);
                    if (audit_info.ConfidenceScore !== AuditState.ConfidenceScore || audit_info.NoteOnConfidenceScore !== AuditState.NoteOnConfidenceScore) {
                        update_audit_state = true;
                        AuditNumber = result.AuditSessions.length > 0 ? result.AuditSessions[result.AuditSessions.length - 1].AuditNumber + 1 : 1;
                        let auditSessionData = {
                            AuditDate: auditDate,
                            RegisteredUserEmail: audit_info.UserName,
                            ConfidenceScore: audit_info.ConfidenceScore,
                            NoteOnConfidenceScore: audit_info.NoteOnConfidenceScore,
                            AuditNumber: AuditNumber,
                            AuditType: "Manual Update",
                            AuditValueArray: [
                                {
                                    AuditFieldName: "ConfidenceScore",
                                    NewValue: audit_info.ConfidenceScore,
                                    OldValue: AuditState.ConfidenceScore,
                                    Valid: false,
                                    AuditedComment: "Successful Update"
                                }
                            ]
                        };
                        log_messages.push({
                            environment: environment,
                            application_version: buildNumber,
                            audit_type: "Update ConfidenceScore",
                            user: audit_info.UserName,
                            audited_value_valid: false,
                            collection: collectionName,
                            RecordId: recordId,
                            old_value: AuditState.ConfidenceScore,
                            new_value: audit_info.ConfidenceScore,
                            updated_field: "ConfidenceScore",
                            log_type: "Manual audit"
                        });
                        result.AuditSessions.push(auditSessionData);
                    }
                    if (update_audit_state) {
                        AuditState.AuditNumber = AuditNumber;
                        AuditState.ConfidenceScore = audit_info.ConfidenceScore;
                        AuditState.LastEditedAt = auditDate;
                        AuditState.LastEditedBy = audit_info.UserName;
                        AuditState.NoteOnConfidenceScore = audit_info.NoteOnConfidenceScore;
                        result.AuditState = AuditState;
                    }
                    log_messages.reverse();
                    if (not_updated_fields.length) {
                        not_updated_fields.unshift("Your configuration is inconsistent");
                        res.send({
                            success: false,
                            not_updated_fields: not_updated_fields
                        });
                        utils.logKabana(log_messages, "record_audit", false, not_updated_fields, req);
                        return;
                    }
                    if (update_error) {
                        res.send({
                            success: false,
                            error: auto_update_error_message
                        });
                        utils.logKabana(log_messages, "record_audit", false, update_error, req);
                        return;
                    }

                    if (!not_updated_fields.length) not_updated_fields = false;
                    if (warning_messages.length) not_updated_fields = not_updated_fields.length ? not_updated_fields.concat(warning_messages) : warning_messages;
                    //fs.appendFile('log1.txt', '65464564\n', function (err) {});

                    if (is_new_record) {
                        var new_record = new productSchema(result);
                        new_record["RecordId"] = lastRecordId + 1;
                        new_record.save(function (err, r) {
                            if (err) {
                                res.send({
                                    success: false,
                                    error: error
                                });
                                utils.logKabana(log_messages, "record_audit", true, not_updated_fields, req);
                            } else
                                res.send({
                                    success: true,
                                    new_record: r,
                                    collectionName: collectionName,
                                    not_updated_fields: not_updated_fields
                                });
                        });
                    } else {
                        result.updateOne(result).exec();
                        res.send({
                            success: update_audit_state,
                            warnings: warnings,
                            not_updated_fields: not_updated_fields
                        });
                        utils.logKabana(log_messages, "record_audit", true, not_updated_fields, req);
                    }
                })
                .catch((error) => {
                    console.log(error);
                    res.send({
                        success: false,
                        error: "An error occurred while processing your request."
                    });
                });
        })
        .catch((err) => console.error(err));
};
