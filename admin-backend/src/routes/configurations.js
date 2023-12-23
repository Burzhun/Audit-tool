const express = require('express');
const {
  getConfiguration,
  getCollections,
  getConfigurationFields,
  getEditableFields,
  getDisplayableFields,
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
} = require('../handlers/configurations');

const router = express.Router();

router.post('/collections', getCollections);
router.get('/fields', getConfigurationFields);

router.post('/:name', getConfiguration);
router.get('/collections/:name/fields/editable', getEditableFields);
router.put('/collections/:name/fields/editable', updateEditableFields);
router.get('/collections/:name/fields/displayable', getDisplayableFields);
router.put('/collections/:name/fields/displayable', updateDisplayableFields);
router.get('/collections/:name/fields/audit', getAuditSessionFields);
router.put('/collections/:name/fields/audit', updateAuditSessionFields);
router.get('/collections/:name/visibility', getCollectionVisibility);
router.put('/collections/:name/visibility', updateCollectionVisibility);
router.get('/collections/:name/records/creation', getCollectionRecordCreation);
router.put('/collections/:name/records/creation', updateCollectionRecordCreation);
router.get('/collections/:name/fields/middle-screen', getMiddleScreenFields);
router.put('/collections/:name/fields/middle-screen', updateMiddleScreenFields);
router.get('/collections/:name/fields/search-result', getSearchResultFields);
router.put('/collections/:name/fields/search-result', updateSearchResultFields);
router.get('/collections/:name/fields/search', getSearchFields);
router.put('/collections/:name/fields/search', updateSearchFields);
router.put('/collections/:name/update', updateConfigFields);

module.exports = router;
