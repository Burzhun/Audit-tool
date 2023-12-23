import moment from "moment";

let currentState = {};
let config = {};
let fullKey = "";
let current_validator = null;
// Do not forget to register a new validator
// function in validators_func object in this file.
const checkField = (field, config) => {
    const ar = field.split(".");
    if (ar.length === 1) return config.DefaultFieldsToDisplayInAuditSession.includes(field);
    if (ar.length === 2) {
        return config.DefaultFieldsToDisplayInAuditSession.find((cf) => cf.name && cf.name === ar[0] && cf.AllSubDocumentFields.includes(ar[1]));
    }
    if (ar.length === 3) {
        const t = config.DefaultFieldsToDisplayInAuditSession.find((cf) => cf.name && cf.name === ar[0] && cf.AllSubDocumentFields.includes(ar[1]));
        if (t && t.nested_fields) return t.nested_fields.find((cf) => cf.name && cf.name === ar[1] && cf.AllSubDocumentFields.includes(ar[2]));
    }
    return false;
};

const convertConstraint = (key, constraint) => {
    const ar_key = key.split(".");
    const ar_constraint = constraint.split(".");
    if (ar_constraint.length === ar_key.length && ar_constraint.length > 1 && ar_constraint[ar_constraint.length - 2] === ar_key[ar_key.length - 2]) {
        const full_key_ar = fullKey.split(".");
        if (full_key_ar[full_key_ar.length - 1] === ar_key[ar_key.length - 1]) {
            full_key_ar[full_key_ar.length - 1] = ar_constraint[ar_constraint.length - 1];
            const element = document.getElementById(`${full_key_ar.join("_").replace(/\s/g, "")}_value`);
            if (element) {
                constraint = parseFloat(check_inf(element.innerText));
            }
        }
    } else if (ar_constraint.length === 1) {
        const element = document.getElementById(`${constraint}_value`);
        if (element) {
            constraint = parseFloat(check_inf(element.innerText));
        }
    }
    return constraint;
};

// TYPES
const numeric = (item) => {
    if (!item) return false;
    return !isNaN(item) || item.toLowerCase() === "inf" || item.toLowerCase() === "-inf";
};

const text = (item) => typeof item === "string";

const date = (item) => !isNaN(Date.parse(item)) && item.match(/[0-9]{4}\-[0-9]{2}\-[0-9]{2}.*[0-9]{2}\:[0-9]{2}\:[0-9]{2}/g) !== null;

const isodate = (item) => !isNaN(Date.parse(item)) && item.match(/[0-9]{4}\-[0-9]{2}\-[0-9]{2}.*[0-9]{2}\:[0-9]{2}\:[0-9]{2}/g) !== null;

const email = (item) => {
    const re = /^(([^<>()\]\\.,;:\s@"]+(\.[^<>()\]\\.,;:\s@"]+)*)|(".+"))@(([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(item).toLowerCase());
};

const url = (item) => {
    const re = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._~#=]{1,256}\.[a-zA-Z0-9()]{1,10}\b([-a-zA-Z0-9()@:%_.~#?&/=]*)/;
    return re.test(item);
};

const enumerate = (item, allowed) => allowed.includes(item);

const check_inf = (item) => {
    if (typeof item !== "string") return item;
    return item.toLowerCase() === "inf" ? Infinity : item.toLowerCase() === "-inf" ? -Infinity : item;
};

// CONSTRAINTS
const positive = (key, item, constraint) => {
    if (constraint) {
        return check_inf(item) >= 0;
    }
    return check_inf(item) < 0;
};

const gte = (key, item, constraint) => {
    if (typeof constraint === "string" && checkField(constraint, config)) {
        constraint = convertConstraint(key, constraint);
    }
    if (typeof constraint === "string" && constraint.startsWith('ISODate("')) {
        constraint = constraint.replace('ISODate("', "").replace('")', "");
    }
    if (date(item) && date(constraint)) {
        return moment(item.replace("Z", "")).unix() >= moment(constraint.replace("Z", "")).unix();
    }
    return check_inf(item) >= constraint;
};

const lte = (key, item, constraint) => {
    if (typeof constraint === "string" && checkField(constraint, config)) {
        constraint = convertConstraint(key, constraint);
    }
    if (typeof constraint === "string" && constraint.startsWith('ISODate("')) {
        constraint = constraint.replace('ISODate("', "").replace('")', "");
    }
    if (date(item) && date(constraint)) {
        return moment(item.replace("Z", "")).unix() <= moment(constraint.replace("Z", "")).unix();
    }
    return check_inf(item) <= constraint;
};

const gt = (key, item, constraint) => {
    if (typeof constraint === "string" && checkField(constraint, config)) {
        constraint = convertConstraint(key, constraint);
    }
    if (typeof constraint === "string" && constraint.startsWith('ISODate("')) {
        constraint = constraint.replace('ISODate("', "").replace('")', "");
    }
    if (date(item) && date(constraint)) {
        return moment(item.replace("Z", "")).unix() > moment(constraint.replace("Z", "")).unix();
    }
    return check_inf(item) > constraint;
};

const lt = (key, item, constraint) => {
    if (typeof constraint === "string" && checkField(constraint, config)) {
        constraint = convertConstraint(key, constraint);
    }
    if (typeof constraint === "string" && constraint.startsWith('ISODate("')) {
        constraint = constraint.replace('ISODate("', "").replace('")', "");
    }
    if (date(item) && date(constraint)) {
        return moment(item.replace("Z", "")).unix() < moment(constraint.replace("Z", "")).unix();
    }
    return check_inf(item) < constraint;
};
const maxLength = (key, item, constraint) => item.length <= constraint;

const minLength = (key, item, constraint) => item.length >= constraint;

const pattern = (key, item, constraint) => {
    const re = new RegExp(constraint);
    return re.test(item);
};

const notEmpty = (key, item, constraint) => {
    if (constraint) {
        if (item === 0) {
            return true;
        }
        return item;
    }
};

const nullable = (key, item, constraint) => {
    if (constraint === false) {
        if (item === null || item === "") {
            return false;
        }
    }
    return true;
};

const lt_now = (key, item, constraint) => {
    if (constraint && date(item)) {
        return item.replace("Z", "") <= moment().format().substring(0, 19);
    }
    return true;
};

const validators_func = {
    numeric,
    enumerate,
    text,
    date,
    isodate,
    email,
    positive,
    gte,
    gt,
    lte,
    lt,
    lt_now,
    maxLength,
    minLength,
    pattern,
    url,
    notEmpty,
    nullable,
};

const CURRENCY_CODES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "SEK", "AED", "NZD"];
const COUNTRY_CODES = [];

const getAllowedValues = (constraints) => {
    switch (constraints.values) {
        case "CURRENCY_CODES":
            return CURRENCY_CODES;
        case "COUNTRY_CODES":
            return COUNTRY_CODES;
        default:
            return constraints.values.map((val) => val);
    }
};

// returns list of error messages
const validate_enum = (item, constraints) => {
    const errors = [];
    const { multiple } = constraints;
    const values = getAllowedValues(constraints);
    if (item === "" || item === undefined) {
        if (constraints.nullable === false) {
            errors.push("Item can not be empty");
        }
        return errors;
    }
    if (multiple) {
        const arr = Array.isArray(item) ? item : (item || "").split(",");
        for (let i = 0; i < arr.length; i++) {
            if (!enumerate(arr[i].trim(), values)) {
                errors.push(`Item ${arr[i]} is not allowed!`);
            }
        }
    } else if (!enumerate(item, values)) {
        errors.push(`Item ${item} is not allowed!`);
    }
    return errors;
};

function prepare_date(value) {}

// Find proper validator in validators_func
// returns list of error messages
const exec_validation = (key, item, validators) => {
    const validate_options = validators.find((item1) => item1.name === key);
    if (!validate_options || !validate_options.type) return [];
    const constraints = validate_options.constraints ? validate_options.constraints : [];
    const errors = [];
    if (!item.value && (constraints.nullable === undefined || constraints.nullable === true)) {
        return [];
    }
    current_validator = validate_options;
    if (validate_options.type === "enumerate" || validate_options.type === "enumerate_array") {
        return validate_enum(item.value, constraints);
    }

    if (validators_func[validate_options.type] && !validators_func[validate_options.type](item.value)) {
        errors.push(`Not allowed data for ${validate_options.type} field`);
    }
    const array_field = validate_options.type === "numeric_array" || validate_options.type === "text_array";
    Object.keys(constraints).map((constr) => {
        if (constr === "Custom Function") return;
        if (array_field && ["gte", "lte", "gt", "lt", "positive", "maxLength", "pattern", "minLength"].includes(constr)) {
            item.value.split(",").forEach((item_value) => {
                if (!validators_func[constr](key, item_value, constraints[constr])) {
                    errors.push(`Not satisfied for constraint ${constr} = ${constraints[constr]} for value ${item_value}`);
                }
            });
            return;
        }
        if (!validators_func[constr](key, item.value, constraints[constr])) {
            if (constr === "lt_now") {
                errors.push("Not satisfied for constraint: Date should be less the current date");
            } else {
                errors.push(`Not satisfied for constraint ${constr} = ${constraints[constr]}`);
            }
        }
        return constr;
    });
    return errors;
};

// Parse config, validate certain fields, listed in config['Validators']
// returns Object: {fieldName: ['error_msg1', 'errormsg_2', ...]
const validate = (conf, items, state) => {
    currentState = state;
    config = conf;
    const validators = config.Validators;
    const complex_fields = config.DefaultFieldsToDisplayInAuditSession.filter((f) => f.nested_fields).map((f) => f.name);
    const errors = {};
    if (validators) {
        const names = validators.map((item) => item.name);
        Object.keys(items).map((key) => {
            const item = items[key];
            if (!Object.keys(item).includes("value")) {
                for (const subitemid in item) {
                    const new_item_fields = item[subitemid];
                    if (item[subitemid].deleted && item[subitemid].deleted.value) continue;
                    for (const subFieldName in new_item_fields) {
                        if (subFieldName === "deleted" || new_item_fields[subFieldName].valid) continue;
                        let new_validator_name = `${key}.${subFieldName}`;
                        const name_parts = new_validator_name.split(".");
                        const error_key = `${new_validator_name}.${subitemid}`;
                        if (name_parts.length === 4 && complex_fields.includes(name_parts[0])) {
                            new_validator_name = [name_parts[0], name_parts[2], name_parts[3]].join(".");
                        }
                        if (names.includes(new_validator_name)) {
                            fullKey = `${key}.${subitemid}.${subFieldName}`;
                            const err = exec_validation(new_validator_name, new_item_fields[subFieldName], validators);
                            if (err.length > 0) {
                                errors[error_key] = err;
                            }
                        }
                    }
                }
            }
            if (item.valid) {
                return item;
            }
            fullKey = key;
            const name_parts = key.split(".");
            const error_key = key;
            if (name_parts.length === 3 && complex_fields.includes(name_parts[0])) {
                key = [name_parts[0], name_parts[2]].join(".");
            }
            if (names.includes(key)) {
                const err = exec_validation(key, item, validators);
                if (err.length > 0) {
                    errors[error_key] = err;
                }
            }
            return item;
        });
    }
    return errors;
};

const checkBusinessRules = (config, state) => {
    const errors = [];
    if (config.BusinessRules && config.BusinessRules.length > 0) {
        config.BusinessRules.forEach((br) => {
            if (br.RuleType === "Range") {
                br.Rules.forEach((rule) => {
                    if (rule.startField.split(".").length === 4) {
                        const start_ar = rule.startField.split(".");
                        const end_ar = rule.endField.split(".");
                        if (state[start_ar[1]] && Array.isArray(state[start_ar[1]]) && end_ar.length === 4 && start_ar[1] === end_ar[1] && start_ar[2] === end_ar[2]) {
                            state[start_ar[1]].forEach((ob, index) => {
                                if (ob[start_ar[2]] && Array.isArray(ob[start_ar[2]]) && ob[start_ar[2]].length > 1) {
                                    for (let i = 1; i < ob[start_ar[2]].length; i++) {
                                        const row = ob[start_ar[2]][i];
                                        const prev_row = ob[start_ar[2]][i - 1];
                                        if (row[start_ar[3]] !== prev_row[end_ar[3]] + parseFloat(rule.gap)) {
                                            errors.push(`The value ${start_ar[3]} in row ${i + 1} in table ${start_ar[2]} is not correct in ${start_ar[1]} object ${index}.`);
                                        }
                                    }
                                }
                            });
                        }
                    }
                    if (rule.startField.split(".").length === 3) {
                        const start_ar = rule.startField.split(".");
                        const end_ar = rule.endField.split(".");
                        if (state[start_ar[1]] && Array.isArray(state[start_ar[1]]) && end_ar.length === 3 && start_ar[1] === end_ar[1]) {
                            const table = state[start_ar[1]];
                            if (table.length > 1) {
                                for (let i = 1; i < table.length; i++) {
                                    const row = table[i];
                                    const prev_row = table[i - 1];
                                    if (row[start_ar[2]] !== prev_row[end_ar[2]] + parseFloat(rule.gap)) {
                                        errors.push(`The value ${start_ar[2]} in row ${i + 1} in table ${start_ar[1]} is not correct.`);
                                    }
                                }
                            }
                        }
                    }
                });
            }
        });
    }
    return errors;
};

export default validate;
