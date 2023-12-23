const mongoose = require("mongoose");
const autoIncrement = require("mongoose-auto-increment");
var Product = require("../models/productSchema");
var User = require("../models/userSchema");
var moment = require("moment");
const Net = require("net");
const { time } = require("console");
const requestIp = require("request-ip");
const configSchema = require("../models/configSchema");

exports.getProductSchema = function (collectionName) {
    Product.plugin(autoIncrement.plugin, {
        model: collectionName,
        field: "RecordId",
        startAt: 100,
        incrementBy: 1
    });
    return mongoose.model(collectionName, Product, collectionName);
};

exports.getUserSchema = function () {
    return mongoose.model("User", User, "User");
};

exports.prepareQuery = function (operator, field, value, config) {
    let query = {};
    const date_regex = /\d{4}\-\d{2}\-\d{2}/;
    const field_name = field.indexOf(".") > 0 ? field.split(".")[1] : field;
    let validator = config["Validators"] ? config["Validators"].find((t) => t.name === field_name) : null;
    if (field_name === "ConfidenceScore") {
        if (operator === "in") operator = "=";
        if (operator === "nin") operator = "!=";
        validator = { type: "numeric_array" };
    }
    switch (operator) {
        case "=": {
            if (validator && (validator.type === "numeric_array" || validator.type === "text_array")) {
                query[field] = {
                    $in: (Array.isArray(value.val) ? value.val : [value.val]).map((t) => (validator.type === "numeric_array" ? t : RegExp(t, "i")))
                };
                return query;
            }
            if (value.type === "date") {
                const match = value.val.toISOString().match(date_regex);
                if (validator && validator.type === "isodate") {
                    if (match && match.length > 0) {
                        query[field] = {
                            $gt: new Date(match[0] + "T00:00:00"),
                            $lt: new Date(match[0] + "T23:59:00")
                        };
                        return query;
                    }
                }
                if (match && match.length > 0) value.val = { $regex: match[0].toString(), $options: "i" };
                else
                    value.val = {
                        $regex: (value.val || "").toString(),
                        $options: "i"
                    };
            } else {
                if (value.type === "string") {
                    value.val = {
                        $regex: (value.val || "").toString().replace(/\(/g, "\\(").replace(/\)/g, "\\)"),
                        $options: "i"
                    };
                }
            }
            if (value.type === "numeric" && value.val === "") return {};
            query[field] = value.val;
            break;
        }
        case "===": {
            if (validator && (validator.type === "numeric_array" || validator.type === "text_array")) {
                query[field] = {
                    $all: Array.isArray(value.val) ? value.val : [value.val]
                };
                return query;
            }
            if (value.type === "date") {
                value.val = value.val.match(date_regex)[0];
            } else {
                if (value.type === "string") {
                    value.val = value.val;
                }
            }
            query[field] = value.val;
            break;
        }
        case ">": {
            query[field] = { $gt: value.val };
            break;
        }
        case "<": {
            query[field] = { $lt: value.val };
            break;
        }
        case "<x<": {
            if (value.type === "date") {
                value[0].val = value[0].val.match(date_regex) ? value[0].val.match(date_regex)[0] : "0";
                value[1].val = value[1].val.match(date_regex) ? value[1].val.match(date_regex)[0] : "9";
            }
            query[field] = { $gt: value[0].val, $lt: value[1].val };
            break;
        }
        case "in": {
            if (validator && (validator.type === "numeric_array" || validator.type === "text_array"))
                query[field] = {
                    $all: value.val.map((t) => (validator.type === "numeric_array" ? t : RegExp(t, "i")))
                };
            else
                query[field] = {
                    $in: typeof value.val === "number" ? [value.val] : value.val.map((t) => (field === "RecordId" ? t : RegExp(t, "i")))
                };
            break;
        }
        case "nin": {
            if (validator && (validator.type === "numeric_array" || validator.type === "text_array"))
                query[field] = {
                    $nin: value.val.map((t) => (validator.type === "numeric_array" ? t : RegExp(t, "i")))
                };
            else
                query[field] = {
                    $nin: typeof value.val === "number" ? [value.val] : value.val.map((t) => (field === "RecordId" ? t : RegExp(t, "i")))
                };
            break;
        }
        case "!=": {
            if (validator && (validator.type === "numeric_array" || validator.type === "text_array"))
                query[field] = {
                    $nin: value.val.map((t) => (validator.type === "numeric_array" ? t : RegExp(t, "i")))
                };
            else {
                const ar = Array.isArray(value.val) ? value.val : [value.val];
                query[field] = {
                    $nin: typeof value.val === "number" ? ar : ar.map((t) => (field === "RecordId" ? t : RegExp(t, "i")))
                };
            }
            break;
        }
    }
    return query;
};

var tcp_promise = (data) => {
    return new Promise((resolve, reject) => {
        const client = new Net.Socket();
        client.connect({ port: 5047, host: "logs.fxcompared.com" }, function () {
            client.write(data, (error) => {
                // console.log(data);
                //  if (error) console.log(error);
                client.destroy();
                resolve(true);
            });
        });
    });
};

var getReplicaSetName = function () {
    let url = process.env.DB_URL;
    const url_parts = url.split("?");
    let t = false;
    if (url_parts.length > 1) {
        let query_parts = url_parts[1].split("&");
        query_parts.forEach((query_part) => {
            if (query_part.includes("replicaSet=")) t = query_part.replace("replicaSet=", "");
        });
    }
    return t;
};

const environment = process.env.host && process.env.host === "production" ? "production" : "staging";
exports.logKabana = async function (messages, log_type, update_success, error, req) {
    if (log_type === "configuration_change" && messages.length) {
        configSchema.findOne({ CollectionRelevantFor: messages[0].collection, user_type: messages[0].user_type }).then(async (result) => {
            result
                .updateOne({
                    LastUpdateDate: new Date().toISOString(),
                    LastUpdateBy: messages[0].user_email || ""
                })
                .exec();
        });
    }
    var timestamp = new Date().toISOString();
    let ip = requestIp.getClientIp(req);
    const replica_set = getReplicaSetName();
    if (ip) ip = ip.replace("::ffff:", "");
    for (var index = 0; index < messages.length; index++) {
        const m = messages[index];
        m["error_string"] = error || "";
        if (Array.isArray(m["error_string"])) m["error_string"] = m["error_string"].join(";");
        if (replica_set) m["replica_set"] = replica_set;
        if (update_success && error) {
            m["notification"] = error;
            m["thrown_error_or_warning"] = "";
        }
        m["user_ip_address"] = ip;
        var message = {
            "@timestamp": timestamp,
            audit_timestamp: timestamp,
            "@version": "1",
            message: JSON.stringify(m),
            type: "json",
            log_level: "INFO",
            application: "backend",
            log_type,
            application_stack: "datavalidation",
            environment,
            event_source: "server/routes/utils.js",
            update_success: update_success
        };
        message = JSON.stringify(message);
        await tcp_promise(message);
    }
};

exports.generateEmptyRecord = async function (collectionName, config = false) {
    if (!config) {
        var configSchema = require("../models/configSchema");
        config = await configSchema.findOne({
            CollectionRelevantFor: collectionName
        });
    }
    let record = { AuditSessions: [], AuditState: {}, CurrentState: {} };
    if (config.add_new_record && config.add_new_record.on) {
        const fields_list = config.add_new_record.fields_to_create;
        fields_list.forEach((field) => {
            if (typeof field === "string") {
                record.CurrentState[field] = "";
            } else {
                record.CurrentState[field.name] = [];
            }
        });
        if (config.add_new_record.ImageLinks) record.CurrentState.ImageLinks = config.add_new_record.ImageLinks;
        record["RecordId"] = -1;
        return record;
    } else return false;
};
