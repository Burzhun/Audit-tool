const utils = require("./utils");
const revision = require("../revision");

class CustomStateGetter {
    constructor() {
        return new Proxy(this, this);
    }
    get(target, prop) {
        if (this.state[prop] === undefined) throw prop + " does not exist in CurrentState";
        return this.state[prop];
    }
}
function set(obj, path, value) {
    var schema = obj; // a moving reference to internal objects within obj
    var pList = path.split(".");
    var len = pList.length;
    for (var i = 0; i < len - 1; i++) {
        var elem = pList[i];
        if (!schema[elem]) schema[elem] = {};
        schema = schema[elem];
    }
    schema[pList[len - 1]] = value;
    return obj;
}
exports.globalUpdate = function (req, res) {
    const { recordId, collectionName } = req.body;
    var productSchema = utils.getProductSchema(collectionName);
    var configSchema = require("../models/configSchema");
    configSchema
        .findOne({ CollectionRelevantFor: collectionName })
        .then((config) => {
            const global_automatic_updates = config["global_automatic_updates"];
            if (global_automatic_updates.length === 0) {
                res.send({ success: false, error: error });
                return;
            }
            config["start_time"] = new Date().getTime();
            productSchema.findOne({ RecordId: recordId }).then(function (record) {
                //console.log(record['CurrentState']['amounts_and_rates']);
                runPipeline(config, global_automatic_updates, [record], collectionName, req, productSchema).then((data) => {
                    res.send(data);
                });
            });
        })
        .catch((error) => {
            if (error.toString() === "[object Object]") error = JSON.stringify(error);
            res.send({
                success: false,
                error: error
            });
        });
};

exports.globalUpdateAll = function (req, res) {
    const { collectionName } = req.body;
    var productSchema = utils.getProductSchema(collectionName);
    var configSchema = require("../models/configSchema");
    configSchema
        .findOne({ CollectionRelevantFor: collectionName })
        .then((config) => {
            const global_automatic_updates = config["global_automatic_updates"];
            if (global_automatic_updates.length === 0) {
                res.send({ success: false, error: error });
                return;
            }
            //productSchema.find().lean().then(function(records,index) {
            config["start_time"] = new Date().getTime();
            productSchema
                .find({})
                .lean()
                .then(function (records, index) {
                    runPipeline(config, global_automatic_updates, records, collectionName, req, productSchema).then((data) => {
                        res.send(data);
                        return;
                    });
                    //runPipeline(global_automatic_updates,record);
                });
        })
        .catch((error) => {
            res.send({
                success: false,
                error: error
            });
        });
};

function checkIfUpdated(set_array, record, fieldsList) {
    if (fieldsList.length === 0) return set_array;
    const sesions = record.AuditSessions;
    let sessions_array = [];
    if (!sesions) return set_array;
    sesions.forEach((s) => {
        sessions_array = sessions_array.concat(s["AuditValueArray"]);
    });
    fieldsList.forEach((fieldName) => {
        const parts = fieldName.split(".");
        let newFieldName = "CurrentState." + fieldName;
        switch (parts.length) {
            case 1:
                if (set_array[newFieldName] !== undefined && sessions_array.find((s) => s["AuditFieldName"] === fieldName)) {
                    delete set_array[newFieldName];
                }
                break;
            case 2:
                newFieldName = "CurrentState." + parts[0];
                if (set_array[newFieldName]) {
                    const [field, subField] = parts;
                    const update_sessions = sessions_array.filter((s) => {
                        const ar = s["AuditFieldName"].split(".");
                        if (ar.length === 3 && ar[0] === field && ar[2] === subField) {
                            return true;
                        }
                        return false;
                    });
                    if (update_sessions.length > 0) {
                        update_sessions.forEach((update_session) => {
                            const key = "CurrentState." + update_session["AuditFieldName"];
                            const ar = update_session["AuditFieldName"].split(".");
                            if (record.CurrentState[ar[0]]) {
                                const old_record = record.CurrentState[ar[0]].find((r) => r["_id"].toString() === ar[1]);
                                if (old_record) {
                                    //set_array[key] = old_record[ar[2]];
                                    let updated_data = set_array[newFieldName];
                                    let update_index = updated_data.findIndex((r) => r["_id"].toString() === ar[1]);
                                    if (update_index >= 0) {
                                        //console.log(updated_data[update_index]);
                                        updated_data[update_index][subField] = old_record[subField];
                                        set_array[newFieldName] = updated_data;
                                        //console.log(updated_data[update_index]);
                                    }
                                }
                            }
                        });
                    }
                } else {
                    Object.keys(set_array).forEach((key) => {
                        const ar = key.split(".");
                        if (ar.length === 4 && !isNaN(ar[2]) && ar[1] + "." + ar[3] === fieldName) {
                            let s = "";
                            if (record.CurrentState[ar[1]] && record.CurrentState[ar[1]][ar[2]] && record.CurrentState[ar[1]][ar[2]][ar[3]] !== undefined) {
                                s = ar[1] + "." + record.CurrentState[ar[1]][ar[2]]["_id"].toString() + "." + ar[3];
                            }
                            if (
                                s &&
                                sessions_array.find((session) => {
                                    if (session.AuditFieldName === s && session.Valid === false) {
                                        return true;
                                    }
                                })
                            ) {
                                delete set_array[key];
                            }
                        }
                    });
                }
                break;
            case 4:
                if (sessions_array.length > 0) {
                    Object.keys(set_array).forEach((key) => {
                        const ar = key.split(".");
                        if (ar.length === 6 && parts[0] === ar[1] && parts[1] === ar[3] && parts[2] === "[]" && parts[3] === ar[5]) {
                            let row_id = null;
                            try {
                                row_id = record.CurrentState[ar[1]][ar[2]][ar[3]][ar[4]]["_id"].toString();
                            } catch {
                                return;
                            }
                            if (row_id) {
                                const s = [ar[1], ar[2], ar[3], row_id, ar[5]].join(".");
                                if (
                                    sessions_array.find((session) => {
                                        if (session.AuditFieldName === s && session.Valid === false) {
                                            return true;
                                        }
                                    })
                                ) {
                                    delete set_array[key];
                                }
                            }
                        }
                    });
                }

                break;
        }
    });

    return set_array;
}

async function runPipeline(config, global_automatic_updates, records, collectionName, req, productSchema) {
    let error = false;
    var t = [];
    var bulk_array = [];
    let set_array = null;
    var log = {};
    let execute_bulk = false;
    var bulk = productSchema.collection.initializeOrderedBulkOp();
    var custom_state = new CustomStateGetter();
    var before_load_time = config["start_time"];
    var after_load_time = new Date().getTime();
    var log_messages = [];
    const environment = process.env.host && process.env.host === "production" ? "production" : "staging";
    const old_stats = await productSchema.collection.stats();
    const buildNumber = revision.getBuildNumber();
    for (var index = 0; index < global_automatic_updates.length; index++) {
        var before_pipeline_time = new Date().getTime();
        let pipeline = global_automatic_updates[index];
        if (pipeline.enabled === false) continue;
        //pipeline = eval(pipeline);//.replace(/\@/g,'$').replace(/\~/g,'.'));
        try {
            pipeline.aggregation_pipeline = eval(pipeline.aggregation_pipeline);
        } catch (error_value) {
            error = error_value.toString() + " in pipeline " + index;
            log_messages = [];
            log_messages.push({
                environment: environment,
                application_version: buildNumber,
                user: req.body.audit_info.UserName,
                replica_set: "rep0",
                database: "webappdb",
                collection: collectionName,
                log_type: "Global update",
                error_stage: "aggregation evaluation",
                global_update_pipeline: {
                    index: index,
                    description: pipeline.description
                }
            });
        }
        if (error) continue;
        const matching_fields = pipeline.matching_fields;
        //t=pipeline.aggregation_pipeline;
        await productSchema
            .aggregate(pipeline.aggregation_pipeline)
            .exec()
            .catch((err) => {
                error = err.errmsg;
                log_messages = [];
                log_messages.push({
                    environment: environment,
                    application_version: buildNumber,
                    user: req.body.audit_info.UserName,
                    replica_set: "rep0",
                    database: "webappdb",
                    collection: collectionName,
                    log_type: "Global update",
                    error_stage: "aggregation",
                    global_update_pipeline: {
                        index: index,
                        description: pipeline.description
                    }
                });
            })
            .then((pipeline_results) => {
                if (!pipeline_results || error) return;
                var f = null;
                var after_pipeline_time = new Date().getTime();
                try {
                    f = new Function(["CurrentState", "aggr_result", "AuditState"], pipeline.update_function);
                } catch (error_value) {
                    log_messages = [];
                    log_messages.push({
                        environment: environment,
                        application_version: buildNumber,
                        user: req.body.audit_info.UserName,
                        replica_set: "rep0",
                        database: "webappdb",
                        collection: collectionName,
                        log_type: "Global update",
                        error_stage: "aggregation function",
                        global_update_pipeline: {
                            index: index,
                            description: pipeline.description
                        }
                    });
                    error = error_value.toString() + " in pipeline function " + index;
                }
                if (error) return;
                let aggr_result = {};
                let records_number = 0;
                records.forEach((record, record_index) => {
                    if (error) return;
                    aggr_result = { results: [] };
                    let is_correct_record = true;
                    pipeline_results.forEach((pipeline_result) => {
                        is_correct_record = true;
                        matching_fields.forEach((field) => {
                            if (!is_correct_record) {
                                return;
                            }
                            is_correct_record = pipeline_result[field] && record["CurrentState"][field] && pipeline_result[field] === record["CurrentState"][field];
                            //	if(!is_correct_record){ console.log(record['CurrentState'][field].toString()+'  '+pipeline_result[field]);}
                        });
                        if (is_correct_record) {
                            aggr_result["results"] = aggr_result["results"].concat(pipeline_result["results"]);
                        }
                    });
                    //console.log(aggr_result);
                    if (aggr_result["results"].length === 0 && pipeline["allDocumentsShouldBeUpdated"] !== true) {
                        return;
                    }
                    //console.log(aggr_result);
                    //var CurrentState = record.CurrentState;
                    custom_state.state = JSON.parse(JSON.stringify(record.CurrentState));
                    var new_state = "";
                    try {
                        new_state = f(custom_state, aggr_result, record.AuditState);
                        set_array = new_state["$set"];
                        Object.keys(set_array).forEach((key) => {
                            if (key.indexOf(".") > 1) {
                                const parts = key.split(".");
                                if (parts.length === 4 && parts[2] === "$[]") {
                                    if (record.CurrentState[parts[1]]) {
                                        record.CurrentState[parts[1]].forEach((sub_record, sub_record_index) => {
                                            let new_key = "CurrentState." + parts[1] + "." + sub_record_index + "." + parts[3];
                                            if (set_array[new_key] === undefined) {
                                                set_array[new_key] = set_array[key];
                                            }
                                        });
                                    }
                                    delete set_array[key];
                                }
                            }
                        });
                        Object.keys(set_array).forEach((key) => {
                            if (key.indexOf(".") > 1) {
                                const parts = key.split(".");
                                if (parts.length == 2) {
                                    const field = parts[1];
                                    if (!pipeline.updatable_fields.includes(field)) {
                                        delete set_array[key];
                                    } else {
                                        records[record_index] = set(record, key, set_array[key]);
                                    }
                                }
                                if (parts.length == 4) {
                                    const field = parts[1];
                                    const field2 = parts[1] + "." + parts[3];
                                    if (!pipeline.updatable_fields.includes(field) && !pipeline.updatable_fields.includes(field2)) {
                                        delete set_array[key];
                                    } else {
                                        //if(parts[3]==='outside_of_min_max_fx_margin') console.log('found');
                                        let subArray = record["CurrentState"][parts[1]];
                                        let index_key = -1;
                                        if (isNaN(parts[2])) {
                                            index_key = subArray.findIndex((e) => {
                                                e["_id"].toString() === parts[2];
                                            });
                                        } else {
                                            index_key = parseInt(parts[2]);
                                        }
                                        if (index_key >= 0) {
                                            subArray[index_key][parts[3]] = set_array[key];
                                            let state = record["CurrentState"];
                                            state[parts[1]] = subArray;
                                            record["CurrentState"] = state;
                                            records[record_index] = record;
                                            //if(index_key===0) console.log(records[record_index]['CurrentState']['amounts_and_rates'][0]);
                                        }
                                    }
                                }
                            }
                        });

                        //if(set_array['CurrentState.amounts_and_rates']) { console.log(aggr_result['results']); console.log(index);}
                        set_array = checkIfUpdated(set_array, record, config.updates_manual_overwrite_fields);

                        new_state["$set"] = set_array;
                        if (Object.keys(set_array).length > 0) {
                            bulk.find({ RecordId: record["RecordId"] }).update(new_state);
                            execute_bulk = true;
                            records_number++;
                        }
                        //if(set_array['CurrentState.amounts_and_rates']) console.log(set_array['CurrentState.amounts_and_rates'][0]);

                        //productSchema.updateOne({RecordId: record['RecordId']},new_state,{ multi: true },function(err) {if(err)
                    } catch (error_value) {
                        log_messages = [];
                        log_messages.push({
                            environment: environment,
                            application_version: buildNumber,
                            user: req.body.audit_info.UserName,
                            replica_set: "rep0",
                            database: "webappdb",
                            collection: collectionName,
                            log_type: "Global update",
                            error_stage: "aggregation result",
                            global_update_pipeline: {
                                index: index,
                                description: pipeline.description
                            }
                        });
                        error = error_value;
                        log["data"] = record;
                        log["aggr_results"] = aggr_result["results"];
                    }
                    //console.log(Object.keys(set_array));
                });
                if (!error)
                    log_messages.push({
                        environment: environment,
                        application_version: buildNumber,
                        user: req.body.audit_info.UserName,
                        records_modified: records_number,
                        replica_set: "rep0",
                        database: "webappdb",
                        collection: collectionName,
                        log_type: "Global update",
                        global_update_pipeline: {
                            records_loading: {
                                start_time: new Date(before_load_time).toISOString(),
                                end_time: new Date(after_load_time).toISOString()
                            },
                            pipeline: {
                                start_time: new Date(before_pipeline_time).toISOString(),
                                end_time: new Date(after_pipeline_time).toISOString()
                            },
                            duration: after_load_time - before_load_time + (new Date().getTime() - before_pipeline_time),
                            description: pipeline.description
                        }
                    });
            });
    }

    var before_write_time = new Date().getTime();

    var myPromise = (bulk) => {
        return new Promise((resolve, reject) => {
            bulk.execute((err, r) => {
                return err ? resolve(err) : resolve(false);
            });
        });
    };
    if (!error && execute_bulk) error = await myPromise(bulk);

    var after_write_time = new Date().getTime();
    const new_stats = await productSchema.collection.stats();
    for (var i = 0; i < log_messages.length; i++) {
        log_messages[i]["global_update_pipeline"]["duration"] = (log_messages[i]["global_update_pipeline"]["duration"] + (after_write_time - before_write_time)) / 1000;
        log_messages[i]["global_update_pipeline"]["writing"] = {
            start_time: new Date(before_write_time).toISOString(),
            end_time: new Date(after_write_time).toISOString()
        };
        log_messages[i]["collection_size_pre"] = (old_stats["totalIndexSize"] + old_stats["storageSize"]) / 1000000;
        log_messages[i]["collection_size_post"] = (new_stats["totalIndexSize"] + new_stats["storageSize"]) / 1000000;
    }

    if (error) {
        if (error.errmsg) error = error.errmsg;
        if (error.toString() === "[object Object]") error = JSON.stringify(error);
        await utils.logKabana(log_messages, "global update", false, error, req);
        return { success: false, error: error.toString(), t: set_array, log: log };
    }

    utils.logKabana(log_messages, "global update", true, "", req);

    return { success: true };
}
