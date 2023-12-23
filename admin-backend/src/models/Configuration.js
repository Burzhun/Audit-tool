const mongoose = require('mongoose');

const { Types } = mongoose.Schema;

const configurationSchema = new mongoose.Schema({
  CollectionRelevantFor: {
    type: String,
    required: true,
  },
  AllowNewRecordCreation: {
    type: Boolean,
    required: true,
  },
  NewRecordFields: {
    type: [String],
  },
  DefaultFieldsToDisplayInAuditSession: Types.Mixed,
  DefaultSearchFieldName: {
    type: String,
  },
  SearchFieldNames: {
    type: [String],
  },
  DefaultFieldsToDisplayInSearchResultView: {
    type: [String],
  },
  UnEditableFields: {
    type: [String],
  },
  Visibility: {
    public: {
      type: Boolean,
      required: true,
    },
    AllowedUsers: {
      type: [String],
    },
  },
  UnDisplayableFields: {
    type: [String],
  },
  DefaultAuditFieldsToDisplayInSearchResultView: {
    type: [String],
  },
  FieldsToDisplayOnMiddleScreen: {
    type: [String],
  },
  Validators: [], // TODO: add schema
});

configurationSchema.static('getConfigurableFields', () => [
  'UnDisplayableFields',
  'UnEditableFields',
  'Visibility',
  'AllowNewRecordCreation',
  'DefaultFieldsToDisplayInAuditSession',
  'FieldsToDisplayOnMiddleScreen',
  'DefaultFieldsToDisplayInSearchResultView',
  'SearchFields',
]);

configurationSchema.static('getAuditStateFields', () => [
  'AuditNumber',
  'ConfidenceScore',
  'NoteOnConfidenceScore',
  'LastEditedAt',
  'LastEditedBy',
]);

configurationSchema.static('getGeneralFields', () => [
  'RecordId',
]);

configurationSchema.static('auditStatePrefix', 'AuditState');
configurationSchema.static('currentStatePrefix', 'CurrentState');

module.exports = mongoose.model('Configuration', configurationSchema);
