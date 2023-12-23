const getCollections = require('./collectionConfiguration/getCollections');
const getConfigurationFields = require('./collectionConfiguration/getConfigurationFields');
const getConfiguration = require('./helpers/getConfiguration');
const getDisplayableFields = require('./displayableFields/getDisplayableFields');
const getEditableFields = require('./editableFields/getEditableFields');
const updateDisplayableFields = require('./displayableFields/updateDisplayableFields');
const updateEditableFields = require('./editableFields/updateEditableFields');
const getCollectionVisibility = require('./collectionVisibility/getCollectionVisibility');
const updateCollectionVisibility = require('./collectionVisibility/updateCollectionVisibility');
const getCollectionRecordCreation = require('./collectionRecordCreation/getCollectionRecordCreation');
const updateCollectionRecordCreation = require('./collectionRecordCreation/updateCollectionRecordCreation');
const getAuditSessionFields = require('./auditSessionFields/getAuditSessionFields');
const updateAuditSessionFields = require('./auditSessionFields/updateAuditSessionFields');
const getMiddleScreenFields = require('./middleScreenFields/getMiddleScreenFields');
const updateMiddleScreenFields = require('./middleScreenFields/updateMiddleScreenFields');
const getSearchResultFields = require('./searchResultFields/getSearchResultFields');
const updateSearchResultFields = require('./searchResultFields/updateSearchResultFields');
const getSearchFields = require('./searchFields/getSearchFields');
const updateSearchFields = require('./searchFields/updateSearchFields');
const updateConfigFields = require('./configurationFields/updateConfigurationField');
const getFieldstoCreate = require('./fieldstocreate/getFields');
const setFieldstoCreate = require('./fieldstocreate/updateFields');
const updateFieldstoCreate = require('./fieldstocreate/updateFields');
const getNestedSearchFields = require('./nestedSearchFields/getNestedSearchFields');
const updateNestedSearchFields = require('./nestedSearchFields/updateNestedSearchFields');

module.exports = {
  getConfiguration,
  getCollections,
  getConfigurationFields,
  getDisplayableFields,
  getEditableFields,
  updateDisplayableFields,
  updateEditableFields,
  getCollectionVisibility,
  updateCollectionVisibility,
  getCollectionRecordCreation,
  updateCollectionRecordCreation,
  getAuditSessionFields,
  updateAuditSessionFields,
  getMiddleScreenFields,
  updateMiddleScreenFields,
  getSearchResultFields,
  updateSearchResultFields,
  getSearchFields,
  updateSearchFields,
  updateConfigFields,
  getFieldstoCreate,
  updateFieldstoCreate,
  getNestedSearchFields,
  updateNestedSearchFields
};
