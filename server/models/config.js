const mongoose = require("mongoose");
const Config = new mongoose.Schema({
    CollectionRelevantFor: { type: String },
    DefaultFieldsToDisplayInAuditSession: { type: Array },
    DefaultFieldsToDisplayInSearchResultView: { type: Array },
    DefaultNestedFieldsSearch: { type: Array },
    FieldsToDisplayOnMiddleScreen: { type: Array },
    DefaultSearchFieldName: { type: String },
    user_type: { type: String },
    UnEditableFields: { type: Array },
    SearchFieldNames: { type: Array },
    UnDisplayableFields: { type: Array },
    user_functions: { type: Object },
    DefaultUrl: { type: Object },
    Charts: { type: Object },
    Validators: { type: Array },
    global_automatic_updates: { type: Array },
    update_logics: { type: Array },
    api_updates: { type: Array },
    updates_manual_overwrite_fields: { type: Array },
    ib_api_auto_update: { type: Object },
    ConfidenceScores: { type: Object },
    ConfidenceScoreRequired: { type: Boolean },
    add_new_record: { type: Object },
    image_edit_options: { type: Object },
    s3_bucket_name: { type: String },
    s3_folder_name: { type: String },
    user_type: { type: String },
    ImageFieldNames: { type: Array },
    AllowImageAndPdfDownloads: { type: Boolean },
    allow_image_file_upload: { type: Object },
    BusinessRules: { type: Object },
    FloatDisplayPrecision: { type: Array },
    AccessibleRecords: { type: Object },
    ExternalUsersQuery: { type: Object },
    DisplayImages: { type: Boolean },
    AllowCopyFunction: { type: Boolean },
    AuditDropdownVisible: { type: Boolean },
    ComplexFields: { type: Array },
    DefaultSortings: { type: Array },
    TableSettings: { type: Array },
    image_upload_destination: { type: Object },
    Visibility: { type: Object },
    CopyToText: { type: Object },
    ManagerAccessible: { type: Boolean },
    LastUpdateDate: { type: String },
    LastUpdateBy: { type: String }
});

Config.methods.getExternalQuery = function (user) {
    if (!this.ExternalUsersQuery || !this.ExternalUsersQuery.pipeline) return "";
    let query = this.ExternalUsersQuery.pipeline;
    let data = { first_name: user.FirstName, last_name: user.LastName, email: user.RegisteredUserEmail };
    data.full_name = data.first_name + " " + data.last_name;
    Object.keys(data).forEach((key) => {
        query = query.split(`{${key}}`).join(`'${data[key]}'`);
    });
    return query;
};

module.exports = Config;
