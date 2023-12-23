const revision = require("../revision");

async function interbank_request_api(url) {
    try {
        const fetch = require("node-fetch");
        let response = await fetch(url);
        if (response.ok) {
            // если HTTP-статус в диапазоне 200-299
            let json = await response.json();
            return { data: json, url: url };
        } else {
            return false;
        }
    } catch (error) {
        return { error: error.toString(), url };
    }
}

const check_date = (item) => {
    if (typeof item === "string" && !isNaN(Date.parse(item)) && item.match(/[0-9]{4}\-[0-9]{2}\-[0-9]{2}.*[0-9]{2}\:[0-9]{2}\:[0-9]{2}/g) !== null) {
        item = new Date(item);
        return item.toISOString();
    }
    if (typeof item === "object" && !isNaN(Date.parse(item))) {
        return new Date(Date.parse(item)).toISOString();
    }
    return item;
};

function get_interbank_api_url(record, api_config, sub_record = null) {
    //console.log(api_config);
    let data = {
        token: api_config.token,
        mode: api_config.mode || "closest"
    };
    Object.keys(api_config.dependency_fields).forEach((url_key) => {
        const field = api_config.dependency_fields[url_key];
        if (field.indexOf(".") > 0) {
            const subField = field.split(".")[1];
            if (sub_record[subField]) {
                data[url_key] = check_date(sub_record[subField]);
            }
        } else {
            if (record.CurrentState[field]) data[url_key] = check_date(record.CurrentState[field]);
        }
    });
    const base_url = api_config.base_url;
    const url =
        base_url +
        "?" +
        Object.keys(data)
            .map((value) => `${value}=${encodeURIComponent(data[value])}`)
            .join("&");
    return url;
}

function interbank_api(record, collectionName, audit_info, config, api_config, api_changed_fields, environment) {
    return new Promise((resolve, reject) => {
        try {
            let log_messages = [];
            let api_error = false;
            if (!api_config.dependency_fields || typeof api_config.dependency_fields !== "object") api_error = true;
            else {
                const dependency_fields_keys = Object.keys(api_config.dependency_fields);
                if (dependency_fields_keys.length === 0 || typeof api_config.dependency_fields[dependency_fields_keys[0]] !== "string") {
                    api_error = true;
                } else {
                    if (!api_config.fields_to_update || typeof api_config.fields_to_update !== "object") api_error = true;
                }
                if (!api_config.url_field) api_error = true;
            }
            if (api_error)
                resolve({
                    error: "Interbank API request failed. Update the configuration for api request."
                });
            const dependency_fields = Object.keys(api_config.dependency_fields).map((key) => api_config.dependency_fields[key]);
            const array_fields = dependency_fields.filter((f) => f.indexOf(".") > 0);
            const array_sub_fields = array_fields.map((f) => {
                return f.split(".")[1];
            });
            const array_field = array_fields.length > 0 ? array_fields[0] : null;
            let changed_records = [];
            let api_updated_fields = [];
            let error = false;
            let resolved = false;
            var new_updated_fields = [];
            const buildNumber = revision.getBuildNumber();
            if (array_field) {
                let interbank_update_all = api_changed_fields.find((f) => dependency_fields.includes(f));
                if (interbank_update_all) {
                    changed_records = record.CurrentState[array_field.split(".")[0]];
                } else {
                    api_changed_fields
                        .filter((f) => {
                            return f["field"] && !f["deleted"] && array_fields.includes(f["field"]);
                        })
                        .forEach((f) => {
                            record.CurrentState[array_field.split(".")[0]].forEach((sub_record) => {
                                const sub_field = array_field.split(".")[1];
                                if (sub_record["_id"].toString() === f["id_value"].toString()) {
                                    changed_records.push(sub_record);
                                }
                            });
                        });
                }
            } else {
                const update_fields = Object.keys(api_config.fields_to_update)
                    .map((f) => {
                        return f[Object.keys(f)[0]];
                    })
                    .filter((f) => f.indexOf(".") > 0);
                if (update_fields.length === 0) {
                    if (api_changed_fields.find((f) => dependency_fields.includes(f))) {
                        const url = get_interbank_api_url(record, api_config, null);
                        interbank_request_api(url).then((result) => {
                            if (result && result.data) {
                                const data = result.data;
                                Object.keys(api_config.fields_to_update)
                                    .concat("url_custom_field")
                                    .forEach((key) => {
                                        if (result.data[key] || (key === "url_custom_field" && api_config.url_field)) {
                                            const update_value = key === "url_custom_field" ? url : result.data[key];
                                            const update_key_value = key === "url_custom_field" ? api_config.url_field : api_config.fields_to_update[key];

                                            log_messages.push({
                                                environment: environment,
                                                application_version: buildNumber,
                                                audit_type: "Update field",
                                                user: audit_info.UserName,
                                                replica_set: "rep0",
                                                database: "webappdb",
                                                collection: collectionName,
                                                RecordId: record["RecordId"],
                                                audited_value_valid: false,
                                                AuditSession: JSON.stringify({
                                                    AuditFieldName: update_key_value,
                                                    NewValue: update_value,
                                                    OldValue: record.CurrentState[update_key_value],
                                                    Valid: false
                                                }),
                                                log_type: "Interbank update"
                                            });
                                            record.CurrentState[update_key_value] = update_value;
                                            new_updated_fields.push(update_key_value);
                                        }
                                        if (!result.data[key] && key !== "url_custom_field") {
                                            resolve({
                                                error: "Interbank API request failed. The request didn't return " + key + " field"
                                            });
                                        }
                                    });
                                resolve({
                                    new_updated_fields: new_updated_fields,
                                    record: record,
                                    log_messages: log_messages
                                });
                                resolved = true;
                                return;
                            } else {
                                if (result.error) error = result.error;
                                else error = "Interbank API request failed - audit update blocked for safety. Contact support";
                                resolve({
                                    error: error
                                });
                            }
                        });
                    } else {
                        if (resolved) return;
                        resolved = true;
                        resolve({
                            new_updated_fields: [],
                            record: record
                        });
                    }
                } else {
                    resolved = true;
                    resolve({
                        new_updated_fields: [],
                        record: record
                    });
                }
            }
            if (resolved) return;
            if (changed_records.length > 0) {
                var grouped_records = {};
                changed_records.forEach((sub_record) => {
                    const id = sub_record["_id"].toString();
                    const url = get_interbank_api_url(record, api_config, sub_record);
                    if (grouped_records[url]) grouped_records[url].push(id);
                    else grouped_records[url] = [id];
                });
                const n = Object.keys(grouped_records).length;
                let i = 0;
                Object.keys(grouped_records).forEach((url) => {
                    interbank_request_api(url).then((result) => {
                        i++;
                        const is_last = i === n;
                        if (result && result.data) {
                            if (Object.keys(api_config.fields_to_update).includes("result.rate")) {
                                if (result.data.rate && result.data.rate === 0.0)
                                    resolve({
                                        error: "Interbank API request returned IB rate equal to 0.0 - audit update blocked for safety. Please check relevant API inputs."
                                    });
                            }
                            const data = result.data;
                            Object.keys(api_config.fields_to_update)
                                .concat("url_custom_field")
                                .forEach((key) => {
                                    if (result.data[key] || (key === "url_custom_field" && api_config.url_field)) {
                                        const update_value = key === "url_custom_field" ? url : result.data[key];
                                        const update_key_value = key === "url_custom_field" ? api_config.url_field : api_config.fields_to_update[key];
                                        const update_key_parts = update_key_value.split(".");
                                        if (update_key_parts.length > 1) {
                                            if (record.CurrentState[update_key_parts[0]]) {
                                                record.CurrentState[update_key_parts[0]].forEach((sub_record, sub_record_index) => {
                                                    if (grouped_records[url].includes(sub_record["_id"].toString())) {
                                                        var el = record.CurrentState[update_key_parts[0]][sub_record_index];
                                                        el[update_key_parts[1]] = update_value;
                                                        log_messages.push({
                                                            environment: environment,
                                                            application_version: buildNumber,
                                                            audit_type: "Update field",
                                                            user: audit_info.UserName,
                                                            replica_set: "rep0",
                                                            database: "webappdb",
                                                            collection: collectionName,
                                                            RecordId: record["RecordId"],
                                                            audited_value_valid: false,
                                                            AuditSession: JSON.stringify({
                                                                AuditFieldName: update_key_value.replace(".", "." + sub_record["_id"].toString() + "."),
                                                                NewValue: el,
                                                                OldValue: record.CurrentState[update_key_parts[0]][sub_record_index],
                                                                Valid: false
                                                            }),
                                                            log_type: "Interbank update"
                                                        });
                                                        record.CurrentState[update_key_parts[0]][sub_record_index] = el;
                                                        new_updated_fields.push({
                                                            field: update_key_value,
                                                            id_value: sub_record["_id"]
                                                        });
                                                    }
                                                });
                                            }
                                        } else {
                                            record.CurrentState[update_key_value] = update_value;
                                            new_updated_fields.push(update_key_value);
                                        }
                                    }
                                    if (!result.data[key] && key !== "url_custom_field") {
                                        resolve({
                                            error: "Interbank API request failed. The request didn't return " + key + " field"
                                        });
                                    }
                                });
                            if (is_last) {
                                resolve({
                                    new_updated_fields: new_updated_fields,
                                    record: record,
                                    log_messages: log_messages
                                });
                            }
                        } else {
                            if (result.error) error = result.error;
                            else error = "Interbank API request failed - audit update blocked for safety. Contact support";
                            resolve({
                                error: error
                                // record: record
                            });
                        }
                    });
                });
                if (Object.keys(grouped_records).length === 0)
                    resolve({
                        new_updated_fields: [],
                        record: record
                    });
            } else {
                if (array_field) {
                    resolve({
                        new_updated_fields: [],
                        record: record
                    });
                    return;
                }
            }
        } catch (e) {
            resolve({
                error: e
            });
        }
    });
}

module.exports = { interbank_request_api, interbank_api };
