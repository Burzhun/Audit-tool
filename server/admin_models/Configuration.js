const mongoose = require("mongoose");
const { Types } = mongoose.Schema;
const Config = require("../models/config");

const configurationSchema = new mongoose.Schema(Config);

configurationSchema.static("getConfigurableFields", (role = "Internal") => {
    const internal_type = [
        "UnDisplayableFields",
        "UnEditableFields",
        "Visibility",
        "DefaultFieldsToDisplayInAuditSession",
        "DefaultNestedFieldsSearch",
        "FieldsToDisplayOnMiddleScreen",
        "DefaultFieldsToDisplayInSearchResultView",
        "SearchFields",
        "SearchFieldNames",
        "DefaultSearchFieldName",
        "add_new_record",
        "DefaultSortings",
        "TableSettings",
        "AllowCopyFunction",
        "BusinessRules",
        "FloatDisplayPrecision",
        "ExternalUsersQuery",
        "ConfidenceScores",
        "user_functions",
        "AuditDropdownVisible",
        "CopyToText",
        "ComplexFields",
        "DefaultUrl"
    ];
    if (role === "Internal") return internal_type;
    else return internal_type.concat(["Available Records", "Managers Access"]);
});

configurationSchema.static("getAuditStateFields", () => ["AuditNumber", "ConfidenceScore", "NoteOnConfidenceScore", "LastEditedAt", "LastEditedBy"]);

configurationSchema.static("getGeneralFields", () => ["RecordId"]);

configurationSchema.static("auditStatePrefix", "AuditState");
configurationSchema.static("currentStatePrefix", "CurrentState");

module.exports = mongoose.model("Configuration", configurationSchema);
