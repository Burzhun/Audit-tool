const tab_fields = {
    "Search Screen": ["add_new_record", "DefaultFieldsToDisplayInSearchResultView", "DefaultSearchFieldName", "SearchFieldNames", "DefaultUrl"],
    "Audit Screen": [
        "AllowCopyFunction",
        "ConfidenceScores",
        "ComplexFields",
        "ConfidenceScoreRequired",
        "DefaultFieldsToDisplayInAuditSession",
        "DefaultNestedFieldsSearch",
        "DefaultSortings",
        "TableSettings",
        "AuditDropdownVisible",
        "FloatDisplayPrecision",
        "user_functions",
        "FieldsToDisplayOnMiddleScreen",
        "CopyToText",
        "UnDisplayableFields",
        "UnEditableFields"
    ],
    Images: ["allow_image_file_upload", "DisplayImages", "image_edit_options", "ImageFieldNames", "AllowImageAndPdfDownloads"],
    Charts: ["Charts"],
    "User Access": ["Visibility", "Managers Access"],
    "API Calls": ["ib_api_auto_update"],
    "Automatic Updates": ["global_automatic_updates", "update_logic", "update_logic", "updates_manual_overwrite_fields"],
    BusinessRules: ["BusinessRules"]
};
const tab_fields_external = {
    "Search Screen": ["add_new_record", "DefaultFieldsToDisplayInSearchResultView", "DefaultSearchFieldName", "SearchFieldNames"],
    "Audit Screen": ["AllowCopyFunction", "DefaultFieldsToDisplayInAuditSession", "DefaultSortings", "FieldsToDisplayOnMiddleScreen", "UnDisplayableFields", "UnEditableFields"],
    Images: ["allow_image_file_upload", "DisplayImages", "image_edit_options", "ImageFieldNames", "AllowImageAndPdfDownloads"],
    Charts: ["Charts"],
    "User Access": ["ExternalUsersQuery"]
};
const dashboard_tab_fieldlist = (tab_name, all_fields, user_type = "Internal") => {
    const is_internal = user_type === "internal";
    return tab_fields[tab_name] ? (is_internal ? tab_fields : tab_fields_external)[tab_name].filter((f) => all_fields.includes(f)) : [];
};
export default dashboard_tab_fieldlist;
