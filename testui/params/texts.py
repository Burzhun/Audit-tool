from params.db_params import UN_DISPLAYABLE_FIELDS, UN_EDITABLE_FIELDS, VISIBILITY, ALLOW_NEW_RECORD_CREATION, \
    DEFAULT_AUDIT_FIELDS, FIELDS_TO_DISPLAY_ON_MIDDLE_SCREEN, DEFAULT_FIELDS_TO_DISPLAY_IN_SEARCH_RESULT_VIEW, \
    SEARCH_FIELDS

EDIT_AUDITED_FIELDS = "You are going to edit audited fields"
GOING_TO_COPY = "Are you going to copy this record?"
SUCCESSFULLY_COPIED = "Successfully copied"
SUCCESSFULLY_UPDATED = "Successfully updated"
AUTOMATIC_UPDATE = "Automatic Update"
API_CALLS = "API Calls"
IMAGES = "Images"
CHARTS = "Charts"
CIRCULAR_DEPENDENCE = "Circular dependence"
SUCCESSFUL_AUTOMATIC_UPDATE = "Successful Automatic Update"
AUTOMATIC_UPDATE_FROM_CONFIG = f"{AUTOMATIC_UPDATE} From Config"
INCONSISTENT_CONF = "Your configuration is inconsistent"
HEADER = {
    UN_DISPLAYABLE_FIELDS: "Set undisplayable fields",
    UN_EDITABLE_FIELDS: "Set uneditable fields",
    VISIBILITY: "Set collection visibility",
    ALLOW_NEW_RECORD_CREATION: "Set new record creation",
    DEFAULT_AUDIT_FIELDS: "Set default audit session fields",
    FIELDS_TO_DISPLAY_ON_MIDDLE_SCREEN: "Set middle screen fields",
    DEFAULT_FIELDS_TO_DISPLAY_IN_SEARCH_RESULT_VIEW: "Set search result view default fields",
    SEARCH_FIELDS: "Set search fields"
}
SELECT_ALL = "Select All"
UNSELECT_ALL = "Unselect All"
NOT_ALLOWED_DATA = "Not allowed data"
NOT_SATISFIED = "Not satisfied"
NO_CHANGED_DATA = "You have not changed any data. Please make audit and try again"
RETURNS_NAN = "Auto update function returned NaN or Infinity"
CANNOT_BE_NULL = "cannot be null"
DEFINED_AS_TEXT = "defined as text"
LESS_THAN = "Less than (<)"
GREATER_THAN = "Greater than (>)"
BETWEEN = "Between (<x<)"
EQUAL_TO = "Equal (==)"
EXTERNAL_AUDIT = "external audit"
COPY_NOT_ALLOWED = "Copy Functionality Not Allowed for this Dataset"
API_REQUEST_FAILED = "Interbank API request failed. Update the configuration for api request."
UPDATE_SUBRECORD_FIELD = "Update subrecord field"
MANUAL_AUDIT = "Manual audit"
GLOBAL_UPDATE = "Global update"
PSWD_LENGTH_NOTIFICATION = "Password must be more than 4 characters."
SIGN_UP_SUCCESS = "SIGN UP SUCCESS"
NO_ACCESS_GRANTED = "Your account have not been granted access. Contact administrator to get access."
ALREADY_REGISTERED_USER = "User with this email is already registered"
PIPELINE_ERROR = "Pipeline error"
SAME_VALUE = "the same as the value in database"
FIELD_VALIDATION = "Field Validation"
SEARCH_SCREEN = "Search Screen"
SHOULD_BE_DATE_STRINGS = "should be date strings"
DELETE_VALIDATOR = "Do you want to delete this validator"
SET_FIELD_NAME = "You need to set field name"
USER_ACCESS = "User Access"
AUDIT_SCREEN = "Audit Screen"
FIELD_NOT_IN_SCHEMA_OVERVIEWS = "Field is not in SchemaOverviews"
FIELD_NOT_IN_DATASET_ONLY_IN_CONFIGURATION_VALIDATORS = "Field not in dataset, only in configuration's validators"
EMPTY_CONSTRAINTS_NOT_ALLOWED = "Empty constraints are not allowed"
VALUE_SHOULD_BE_GREATER_THAN = "value should be greater than"
VALIDATOR_WITHOUT_TYPE = "Validator without type"
PSWD_CHANGED_SUCCESS = "Password changed successfully"
DELETE_USER_CONFIRMATION_MESSAGE = "Are you sure you want to delete this user?"
USER_DELETED_MESSAGE = "User was deleted"
VALUES_CONSTRAINT_MUST_BE_SET = "Values constraint must be set"
