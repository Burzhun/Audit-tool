var moment = require("moment");
var lodash = require("lodash");

// Do not forget to register a new validator
// function in validators_func object in this file.

// TYPES
const numeric = (item) => {
    if (!item) return false;
    return (
        !isNaN(item) ||
        item.toString().toLowerCase() === "inf" ||
        item.toString().toLowerCase() === "-inf"
    );
};

const text = (item) => {
    return typeof item === "string";
};

const date = (item) => {
    if (!item) return false;
    return (
        !isNaN(Date.parse(item)) &&
        item.match(
            /[0-9]{4}\-[0-9]{2}\-[0-9]{2}.*[0-9]{2}\:[0-9]{2}\:[0-9]{2}/g
        ) !== null
    );
};

const isodate = (item) => {
    if (!item) return false;
    return (
        !isNaN(Date.parse(item)) &&
        item.match(
            /[0-9]{4}\-[0-9]{2}\-[0-9]{2}.*[0-9]{2}\:[0-9]{2}\:[0-9]{2}/g
        ) !== null
    );
};

const email = (item) => {
    var re =
        /^(([^<>()\]\\.,;:\s@"]+(\.[^<>()\]\\.,;:\s@"]+)*)|(".+"))@(([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(item).toLowerCase());
};

const url = (item) => {
    const re =
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._~#=]{1,256}\.[a-zA-Z0-9()]{1,10}\b([-a-zA-Z0-9()@:%_.~#?&/=]*)/;
    return re.test(item);
};

const enumerate = (item, allowed) => {
    return allowed.includes(item);
};
const check_inf = (item) => {
    return item.toString().toLowerCase() === "inf"
        ? Infinity
        : item.toString().toLowerCase() === "-inf"
        ? -Infinity
        : item;
};

// CONSTRAINTS
const positive = (item, constraint) => {
    if (constraint) {
        return check_inf(item) >= 0;
    }
    return check_inf(item) < 0;
};

const gte = (item, constraint) => {
    if (typeof constraint === "string" && constraint.startsWith('ISODate("'))
        constraint = constraint.replace('ISODate("', "").replace('")', "");
    if (date(item) && date(constraint)) {
        return (
            moment(item.replace("Z", "")).unix() >=
            moment(constraint.replace("Z", "")).unix()
        );
    }
    return check_inf(item) >= constraint;
};

const lte = (item, constraint) => {
    if (typeof constraint === "string" && constraint.startsWith('ISODate("'))
        constraint = constraint.replace('ISODate("', "").replace('")', "");
    if (date(item) && date(constraint)) {
        return (
            moment(item.replace("Z", "")).unix() <=
            moment(constraint.replace("Z", "")).unix()
        );
    }
    return check_inf(item) <= constraint;
};

const gt = (item, constraint) => {
    if (typeof constraint === "string" && constraint.startsWith('ISODate("'))
        constraint = constraint.replace('ISODate("', "").replace('")', "");
    if (date(item) && date(constraint)) {
        return (
            moment(item.replace("Z", "")).unix() >
            moment(constraint.replace("Z", "")).unix()
        );
    }
    return check_inf(item) > constraint;
};

const lt = (item, constraint) => {
    if (typeof constraint === "string" && constraint.startsWith('ISODate("'))
        constraint = constraint.replace('ISODate("', "").replace('")', "");
    if (date(item) && date(constraint)) {
        return (
            moment(item.replace("Z", "")).unix() <
            moment(constraint.replace("Z", "")).unix()
        );
    }
    return check_inf(item) < constraint;
};
const maxLength = (item, constraint) => {
    return item.length <= constraint;
};

const minLength = (item, constraint) => {
    return item.length >= constraint;
};

const pattern = (item, constraint) => {
    const re = new RegExp(constraint);
    return re.test(item);
};

const notEmpty = (item, constraint) => {
    if (constraint) {
        if (item === 0) {
            return true;
        }
        return item;
    }
};

const nullable = (item, constraint) => {
    if (constraint === false) {
        if (item === null || item === "") {
            return false;
        }
    }
    return true;
};

const validators_func = {
    numeric: numeric,
    enumerate: enumerate,
    text: text,
    date: date,
    isodate: isodate,
    email: email,
    positive: positive,
    gte: gte,
    gt: gt,
    lte: lte,
    lt: lt,
    maxLength: maxLength,
    minLength: minLength,
    pattern: pattern,
    url: url,
    notEmpty: notEmpty,
    nullable: nullable,
};

const CURRENCY_CODES = [
    "USD",
    "EUR",
    "GBP",
    "CAD",
    "AUD",
    "JPY",
    "SEK",
    "AED",
    "NZD",
];
const COUNTRY_CODES = [];

const getAllowedValues = (constraints) => {
    switch (constraints["values"]) {
        case "CURRENCY_CODES":
            return CURRENCY_CODES;
        case "COUNTRY_CODES":
            return COUNTRY_CODES;
        default:
            return constraints["values"].map((val) => {
                return val;
            });
    }
};

// returns list of error messages
const validate_enum = (item, constraints) => {
    let errors = [];
    const multiple = constraints["multiple"];
    const values = getAllowedValues(constraints);
    if (item === "") {
        if (constraints["nullable"] === false)
            errors.push("Item can not be empty");
        return errors;
    }
    if (multiple) {
        const arr = item.split(",");
        for (let i = 0; i < arr.length; i++) {
            if (!enumerate(arr[i].trim(), values)) {
                errors.push(`Item ${arr[i]} is not allowed!`);
            }
        }
    } else {
        if (!enumerate(item, values)) {
            errors.push(`Item ${item} is not allowed!`);
        }
    }
    return errors;
};

// Find proper validator in validators_func
// returns list of error messages
const exec_validation = (key, item, validators) => {
    const validate_options = validators.filter(
        (item) => item["name"] === key
    )[0];
    if (!validate_options || !validate_options["type"]) return [];
    const constraints = validate_options["constraints"]
        ? validate_options["constraints"]
        : [];
    let errors = [];
    if (
        !item["value"] &&
        (constraints["nullable"] === undefined ||
            constraints["nullable"] === true)
    ) {
        return [];
    }
    if (validate_options["type"] === "enumerate") {
        return validate_enum(item["value"], constraints);
    }
    if (!validators_func[validate_options["type"]](item["value"])) {
        errors.push(`Not allowed data for ${validate_options["type"]} field`);
    }
    Object.keys(constraints).map((constr) => {
        if (!validators_func[constr](item["value"], constraints[constr])) {
            errors.push(
                `Not satisfied for constraint ${constr} = ${constraints[constr]}`
            );
        }
        return constr;
    });
    return errors;
};

// Parse config, validate certain fields, listed in config['Validators']
// returns Object: {fieldName: ['error_msg1', 'errormsg_2', ...]
const validate = (validator, name, value) => {
    const constraints = validator["constraints"]
        ? validator["constraints"]
        : [];
    let errors = [];
    if (
        !value &&
        (constraints["nullable"] === undefined ||
            constraints["nullable"] === true)
    ) {
        return [];
    }
    if (validator["type"] === "enumerate") {
        return validate_enum(value, constraints);
    }
    if (!Object.keys(validators_func).includes(validator["type"])) return [];
    if (!validators_func[validator["type"]](value)) {
        errors.push(`Not allowed data for ${validator["type"]} field`);
    }
    Object.keys(constraints).map((constr) => {
        if (!validators_func[constr](value, constraints[constr])) {
            errors.push(
                `Not satisfied for constraint ${constr} = ${constraints[constr]} for field ${name}`
            );
        }
        return constr;
    });
    return errors;
};

const compareRows = (row, prevRow, rangeFields, ruleType, gap) => {
    const fields = rangeFields.map((f) => f.split(".").pop());
    const s = fields.map((f) => row[f]).join("_");
    const s1 = fields.map((f) => prevRow[f]).join("_");
    if (s === s1) return null;
    const row_values = fields
        .map((f) => parseFloat(row[f]))
        .sort((a, b) => a - b);
    const prev_row_values = fields
        .map((f) => parseFloat(prevRow[f]))
        .sort((a, b) => a - b);

    if (row_values.length !== prev_row_values.length) return null;
    let prev_value = prev_row_values[0];
    let next_value = row_values[0];
    if (row_values.length > 1) {
        prev_value = prev_row_values[prev_row_values.length - 1];
        next_value = row_values[0];
    }
    let condition =
        ruleType === "Range"
            ? next_value !== prev_value + parseFloat(gap)
            : next_value < prev_value;
    if (ruleType === "NoGaps") condition = next_value > prev_value + 1;
    return condition;
};

const checkCustomValidators = (config, state) => {
    let errors = {};
    const validators = config.Validators.filter(
        (v) => v.constraints && v.constraints["Custom Function"]
    );
    validators.forEach((validator) => {
        const ar = validator.name.split(".");
        if (ar.length === 2) {
            if (state[ar[0]] && Array.isArray(state[ar[0]])) {
                state[ar[0]].forEach((element, i) => {
                    const new_function = validator.constraints[
                        "Custom Function"
                    ]
                        .split("this[")
                        .join("this_field[");
                    try {
                        var f = new Function(
                            ["CurrentState", "this_field"],
                            new_function
                        );
                        const error = f(state, element);

                        if (error) {
                            const key = [ar[0], "index" + i, ar[1]].join(".");
                            if (!errors[key]) errors[key] = [error];
                            else errors[key].push(error);
                        }
                    } catch (e) {
                        console.log(e);
                    }
                });
            }
        }
        if (ar.length === 3) {
            if (state[ar[0]] && Array.isArray(state[ar[0]])) {
                state[ar[0]].forEach((element, i) => {
                    if (element[ar[1]] && Array.isArray(element[ar[1]])) {
                        element[ar[1]].forEach((row) => {
                            const new_function = validator.constraints[
                                "Custom Function"
                            ]
                                .split("this[")
                                .join("this_field[");
                            const f = new Function(
                                ["CurrentState", "this_field", "row"],
                                new_function
                            );
                            const error = f(state, element, row);
                            if (error) {
                                const key = [
                                    ar[0],
                                    "index" + i,
                                    ar[1],
                                    ar[2],
                                    row["_id"].toString(),
                                ].join(".");
                                if (!errors[key]) errors[key] = [error];
                                else errors[key].push(error);
                            }
                        });
                    }
                });
            }
        }
    });
    return errors;
};

const checkBusinessRules = (config, state) => {
    let errors = [];
    const validator_errors = checkCustomValidators(config, state);
    if (config.BusinessRules && config.BusinessRules.length > 0) {
        config.BusinessRules.forEach((br) => {
            if (
                br.RuleType === "Range" ||
                br.RuleType === "NoOverlapping" ||
                br.RuleType === "NoGaps"
            ) {
                br.Rules.forEach((rule) => {
                    if (
                        !rule.enabled ||
                        !rule.rangeFields ||
                        rule.rangeFields.length === 0
                    )
                        return;
                    if (rule.rangeFields[0].split(".").length === 4) {
                        const start_ar = rule.rangeFields[0].split(".");
                        const end_ar =
                            rule.rangeFields[rule.rangeFields.length - 1].split(
                                "."
                            );
                        const object_name = start_ar[1];
                        if (
                            state[object_name] &&
                            Array.isArray(state[object_name])
                        ) {
                            state[object_name].forEach((ob, index) => {
                                if (
                                    rule.disableField &&
                                    ob[rule.disableField.split(".").pop()] ===
                                        false
                                )
                                    return;
                                const table_name = start_ar[2];
                                if (
                                    ob[table_name] &&
                                    Array.isArray(ob[table_name]) &&
                                    ob[table_name].length > 1
                                ) {
                                    var groupedTable =
                                        rule.groupFields &&
                                        rule.groupFields.length > 0
                                            ? lodash.groupBy(
                                                  ob[table_name],
                                                  function (r) {
                                                      return rule.groupFields
                                                          .map(
                                                              (f) =>
                                                                  r[
                                                                      f
                                                                          .split(
                                                                              "."
                                                                          )
                                                                          .pop()
                                                                  ] || ""
                                                          )
                                                          .join("_");
                                                  }
                                              )
                                            : { t: ob[table_name] };
                                    Object.values(groupedTable).forEach(
                                        (table) => {
                                            const old_table = table.slice(0);
                                            table.sort(
                                                (a, b) =>
                                                    a[start_ar[3]] -
                                                    b[start_ar[3]]
                                            );
                                            let checked_rows = [];
                                            for (
                                                var i = 1;
                                                i < table.length;
                                                i++
                                            ) {
                                                const row = table[i];
                                                const prev_row = table[i - 1];
                                                if (
                                                    row[start_ar[3]] ===
                                                        prev_row[start_ar[3]] &&
                                                    row[end_ar[3]] ===
                                                        prev_row[end_ar[3]]
                                                )
                                                    continue;
                                                let json_code = JSON.stringify(
                                                    rule.rangeFields.map(
                                                        (r) =>
                                                            prev_row[
                                                                r
                                                                    .split(".")
                                                                    .pop()
                                                            ]
                                                    )
                                                );
                                                if (
                                                    checked_rows.includes(
                                                        json_code
                                                    )
                                                )
                                                    continue;
                                                let condition = compareRows(
                                                    row,
                                                    prev_row,
                                                    rule.rangeFields,
                                                    br.RuleType,
                                                    rule.gap || 0
                                                );
                                                if (condition) {
                                                    let row_index =
                                                        old_table.findIndex(
                                                            (r) =>
                                                                r["_id"] ===
                                                                row["_id"]
                                                        );
                                                    if (row_index < 0)
                                                        row_index = i;
                                                    let message =
                                                        rule.errorMessage
                                                            ? rule.errorMessage
                                                                  .replace(
                                                                      "{lowest_field}",
                                                                      start_ar[3]
                                                                  )
                                                                  .replace(
                                                                      "{row_number}",
                                                                      row_index +
                                                                          1
                                                                  )
                                                                  .replace(
                                                                      "{table_number}",
                                                                      index + 1
                                                                  )
                                                                  .replace(
                                                                      "{table_name}",
                                                                      object_name +
                                                                          "." +
                                                                          table_name
                                                                  )
                                                                  .replace(
                                                                      "{gap}",
                                                                      rule.gap ||
                                                                          0
                                                                  )
                                                                  .replace(
                                                                      "{group_fields}",
                                                                      rule.groupFields
                                                                          .map(
                                                                              (
                                                                                  f
                                                                              ) =>
                                                                                  f
                                                                                      .split(
                                                                                          "."
                                                                                      )
                                                                                      .pop() ||
                                                                                  ""
                                                                          )
                                                                          .join(
                                                                              ", "
                                                                          )
                                                                  )
                                                            : `${rule.name} error`;

                                                    errors.push(message);
                                                } else {
                                                    checked_rows.push(
                                                        json_code
                                                    );
                                                }
                                            }
                                        }
                                    );
                                }
                            });
                        }
                    }
                    if (rule.rangeFields[0].split(".").length === 3) {
                        const start_ar = rule.rangeFields[0].split(".");
                        const end_ar =
                            rule.rangeFields[rule.rangeFields.length - 1].split(
                                "."
                            );
                        const table_name = state[start_ar[1]];
                        if (
                            state[table_name] &&
                            Array.isArray(state[table_name]) &&
                            end_ar.length === 3 &&
                            table_name === end_ar[1]
                        ) {
                            if (table.length > 1) {
                                var groupedTable =
                                    rule.groupFields &&
                                    rule.groupFields.length > 0
                                        ? lodash.groupBy(
                                              state[table_name],
                                              function (r) {
                                                  return rule.groupFields
                                                      .map(
                                                          (f) =>
                                                              r[
                                                                  f
                                                                      .split(
                                                                          "."
                                                                      )
                                                                      .pop()
                                                              ] || ""
                                                      )
                                                      .join("_");
                                              }
                                          )
                                        : { t: state[table_name] };
                                let checked_rows = [];
                                Object.values(groupedTable).forEach(
                                    (grouped_table) => {
                                        const old_table =
                                            grouped_table.slice(0);
                                        grouped_table.sort(
                                            (a, b) =>
                                                a[start_ar[2]] - b[start_ar[2]]
                                        );
                                        for (
                                            var i = 1;
                                            i < grouped_table.length;
                                            i++
                                        ) {
                                            const row = grouped_table[i];
                                            const prev_row =
                                                grouped_table[i - 1];
                                            if (
                                                row[start_ar[2]] ===
                                                    prev_row[start_ar[2]] &&
                                                row[end_ar[2]] ===
                                                    prev_row[end_ar[2]]
                                            )
                                                continue;
                                            let json_code = JSON.stringify(
                                                rule.rangeFields.map(
                                                    (r) =>
                                                        prev_row[
                                                            r.split(".").pop()
                                                        ]
                                                )
                                            );
                                            if (
                                                checked_rows.includes(json_code)
                                            )
                                                continue;
                                            let condition = compareRows(
                                                row,
                                                prev_row,
                                                rule.rangeFields,
                                                br.RuleType,
                                                rule.gap || 0
                                            );
                                            if (condition) {
                                                let row_index =
                                                    old_table.findIndex(
                                                        (r) =>
                                                            r["_id"] ===
                                                            row["_id"]
                                                    );
                                                if (row_index < 0)
                                                    row_index = i;
                                                let message = rule.errorMessage
                                                    .replace(
                                                        "{lowest_field}",
                                                        start_ar[2]
                                                    )
                                                    .replace(
                                                        "{row_number}",
                                                        row_index + 1
                                                    )
                                                    .replace(
                                                        "{table_number}",
                                                        index + 1
                                                    )
                                                    .replace(
                                                        "{table_name}",
                                                        start_ar[1]
                                                    )
                                                    .replace(
                                                        "{gap}",
                                                        rule.gap || 0
                                                    )
                                                    .replace(
                                                        "{group_fields}",
                                                        rule.groupFields
                                                            .map(
                                                                (f) =>
                                                                    f
                                                                        .split(
                                                                            "."
                                                                        )
                                                                        .pop() ||
                                                                    ""
                                                            )
                                                            .join(", ")
                                                    );

                                                errors.push(message);
                                            } else {
                                                checked_rows.push(json_code);
                                            }
                                        }
                                    }
                                );
                            }
                        }
                    }
                });
            }
            if (br.RuleType === "UniqueFieldCombinations") {
                br.Rules.forEach((rule) => {
                    if (!rule.enabled || !rule.complexFields.length) return;
                    const complexFieldName =
                        rule.complexFields[0].split(".")[1];
                    if (
                        state[complexFieldName] &&
                        Array.isArray(state[complexFieldName]) &&
                        state[complexFieldName].length > 1
                    ) {
                        let rows = [];
                        state[complexFieldName].forEach((element) => {
                            let row = {};
                            rule.outerFields.forEach((f) => {
                                const field = f.split(".")[1];
                                row[field] = state[field];
                            });
                            rule.complexFields.forEach((f) => {
                                const field = f.split(".")[2];
                                row[field] = element[field];
                            });
                            if (rows.find((r) => checkDuplicateRow(r, row))) {
                                const er = rule.errorMessage
                                    ? rule.errorMessage.replace(
                                          "{complex_fields}",
                                          "\n" +
                                              rule.complexFields
                                                  .map((f) =>
                                                      f.split(".").pop()
                                                  )
                                                  .map(
                                                      (f) => `'${f}': ${row[f]}`
                                                  )
                                                  .join("\n")
                                      )
                                    : `${rule.name} error`;
                                errors.push(er);
                            } else {
                                rows.push(row);
                            }
                        });
                    }
                });
            }
        });
    }
    return [errors, validator_errors];
};

const checkDuplicateRow = (row1, row2) => {
    for (var i = 0; i < Object.keys(row1).length; i++) {
        const key = Object.keys(row1)[i];
        if (Array.isArray(row1[key])) {
            let duplicate_value = false;
            if (!Array.isArray(row2[key]))
                duplicate_value = row2[key]
                    ? row1[key].find((v) => row2[key].split(",").includes(v))
                    : false;
            else duplicate_value = row1[key].find((v) => row2[key].includes(v));
            if (!duplicate_value) return false;
        } else {
            if (Array.isArray(row2[key])) {
                if (
                    !(
                        row1[key] &&
                        row1[key].split(",").find((v) => row2[key].includes(v))
                    )
                )
                    return false;
            } else if (row1[key] !== row2[key]) return false;
        }
    }

    return true;
};

module.exports = {
    validate,
    checkBusinessRules,
    numeric,
    text,
    date,
    isodate,
    email,
    url,
    enumerate,
    check_inf,
    gt,
    gte,
    lt,
    lte,
    positive,
};
