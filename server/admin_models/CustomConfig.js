const mongoose = require("mongoose");
const { Types } = mongoose.Schema;
const Config = require("../models/config");
const customConfig = { RegisteredUserEmail: { type: String } };
const configurationSchema = new mongoose.Schema(customConfig);

configurationSchema.static("getConfigurableFields", () => [
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
    "ComplexFields",
    "add_new_record",
    "DefaultSortings",
    "TableSettings",
    "CopyToText",
    "AuditDropdownVisible",
    "user_functions",
    "ConfidenceScores",
    "BusinessRules",
    "AllowCopyFunction",
    "FloatDisplayPrecision",
    "ExternalUsersQuery",
    "DefaultUrl",
    "LastUpdateDate",
    "LastUpdateBy"
]);

configurationSchema.static("getAuditStateFields", () => ["AuditNumber", "ConfidenceScore", "NoteOnConfidenceScore", "LastEditedAt", "LastEditedBy"]);

configurationSchema.static("getGeneralFields", () => ["RecordId"]);

configurationSchema.static("auditStatePrefix", "AuditState");
configurationSchema.static("currentStatePrefix", "CurrentState");

module.exports = mongoose.model("CustomConfigurations", configurationSchema);
