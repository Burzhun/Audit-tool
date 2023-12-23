var moment = require("moment");
var configSchema = require("./models/configSchema");
var SqlString = require("sqlstring");

const createDOMPurify = require("dompurify");
const { JSDOM } = require("jsdom");
const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

function sanitize(value) {
    let s = SqlString.escape(DOMPurify.sanitize(value));
    if (value[0] !== "'") {
        if (s[0] === "'" && s[s.length - 1] === "'") {
            s = s.substring(1, s.length - 1);
        }
    }
    return s;
}
function convertDataTypes(value, operator, field, config, array_field = false, search = false) {
    const field_parts = field.split(".");
    if (!search) {
        if (Array.isArray(value)) {
            value = value.map((t) => sanitize(t));
        }
        if (typeof value === "string") value = sanitize(value);
    }
    const field_name = field.indexOf(".") > 0 && !array_field ? field.split(".")[1] : field;
    const validator = config["Validators"] ? config["Validators"].find((t) => t.name === field_name) : null;
    if (field_name === "ImageLinks") return { type: "boolean", val: value };
    if (field_name === "RecordId") return { type: "numeric", val: value };
    if (field_name === "ConfidenceScore") {
        if (!Array.isArray(value) && operator === "=") value = value.split(",");
        if (Array.isArray(value) && value.length === 1 && operator !== "=") return { type: "numeric", val: parseFloat(value[0]) };
        return { type: "numeric", val: value.map((t) => parseFloat(t)) };
    }
    if (field_name === "ConfidenceScore" || field_name === "AuditNumber") return { type: "numeric", val: parseFloat(value) };
    if (field_name === "NoteOnConfidenceScore") return { type: "string", val: value };
    if (value === "---") return { val: null };
    if (!validator) {
        return { type: "string", val: Array.isArray(value) ? value : value || null };
    }
    if (validator.type == "bool" && value === "false") return { type: "bool", val: false };
    if (!value && value !== 0 && value !== "") {
        if (validator.type == "bool") {
            if (!validator.constraints) return { type: "bool", val: false };
            if (validator.constraints["nullable"] !== false && value === undefined) return { type: "bool", val: null };
            return { type: "bool", val: false };
        }
        return { type: "null", val: null };
    }
    if (value == "") return { val: null };
    switch (validator.type) {
        case "numeric": {
            if (Array.isArray(value)) return { type: "numeric", val: value.map((v) => parseFloat(v)) };
            if (isNaN(value)) {
                if (value.toLowerCase() === "inf") return { type: "numeric", val: Infinity };
                if (value.toLowerCase() === "-inf") return { type: "numeric", val: -Infinity };
                return { type: "numeric", val: parseFloat(value) };
            }
            return { type: "numeric", val: parseFloat(value) };
        }
        case "enumerate": {
            if (validator.constraints && validator.constraints.values && validator.constraints.values.length > 0) {
                const v = validator.constraints.values[0];
                if (typeof v === "number") {
                    if (Array.isArray(value)) return { type: "numeric", val: value.map((v) => parseFloat(v)) };
                    return { type: "numeric", val: parseFloat(value) };
                }
            }
            if (Array.isArray(value)) return { type: "numeric", val: value.map((v) => v.toString()) };
            return { type: "string", val: value.toString() };
        }
        case "enumerate_array": {
            return search ? { type: "string", val: Array.isArray(value) ? value : value.toString() } : { type: "array", val: value };
        }
        case "text_array": {
            return search ? { type: "string", val: Array.isArray(value) ? value : value.toString().split(",") } : { type: "string", val: value.toString().split(",") };
        }
        case "numeric_array": {
            return search
                ? { type: "numeric", val: (Array.isArray(value) ? value : value.toString().split(",")).map((f) => parseFloat(f)) }
                : {
                      type: "numeric",
                      val: value
                          .toString()
                          .split(",")
                          .map((f) => parseFloat(f))
                  };
        }
        case "date": {
            try {
                return { type: "date", val: value };
            } catch (e) {
                console.error(e);
                return { type: "string", val: value };
            }
        }
        case "isodate": {
            try {
                if (Array.isArray(value)) return { type: "date", val: value.map((v) => new Date(v)) };
                return { type: "date", val: new Date(value) };
            } catch (e) {
                console.error(e);
                return { type: "string", val: value };
            }
        }
        case "boolean": {
            return { type: "boolean", val: value === "true" };
        }
        case "bool": {
            const val = value.toString().toLowerCase() === "true";
            return { type: "bool", val: val ? val : value === false || value === "False" ? false : undefined };
        }
        default: {
            return { type: "string", val: Array.isArray(value) ? value : value.toString() };
        }
    }
}

module.exports = convertDataTypes;
