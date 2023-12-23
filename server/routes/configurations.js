const express = require("express");
var { VerifyToken } = require("../middleware/verify");
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
    getFieldstoCreate,
    updateFieldstoCreate,
    getNestedSearchFields,
    updateNestedSearchFields
} = require("../handlers/configurations");

const router = express.Router();

router.post("/collections", getCollections);
router.post("/fields", VerifyToken, getConfigurationFields);

router.post("/:name", getConfiguration);
router.post("/collections/:name/fields/editable", getEditableFields);
router.put("/collections/:name/fields/editable", updateEditableFields);
router.post("/collections/:name/fields/fieldstocreate", getFieldstoCreate);
router.put("/collections/:name/fields/fieldstocreate", updateFieldstoCreate);
router.post("/collections/:name/fields/displayable", getDisplayableFields);
router.put("/collections/:name/fields/displayable", updateDisplayableFields);
router.post("/collections/:name/fields/audit", getAuditSessionFields);
router.put("/collections/:name/fields/audit", updateAuditSessionFields);
router.post("/collections/:name/fields/nested-search", getNestedSearchFields);
router.put("/collections/:name/fields/nested-search", updateNestedSearchFields);
router.post("/collections/:name/visibility", getCollectionVisibility);
router.put("/collections/:name/visibility", updateCollectionVisibility);
router.post("/collections/:name/records/creation", getCollectionRecordCreation);
router.put("/collections/:name/records/creation", updateCollectionRecordCreation);
router.post("/collections/:name/fields/middle-screen", getMiddleScreenFields);
router.put("/collections/:name/fields/middle-screen", updateMiddleScreenFields);
router.post("/collections/:name/fields/search-result", getSearchResultFields);
router.put("/collections/:name/fields/search-result", updateSearchResultFields);
router.post("/collections/:name/fields/search", getSearchFields);
router.put("/collections/:name/fields/search", updateSearchFields);
router.put("/collections/:name/update", updateConfigFields);

module.exports = router;
