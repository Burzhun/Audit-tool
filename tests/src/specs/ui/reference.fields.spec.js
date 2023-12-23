
/**
 * @namespace ReferenceFieldsSpec
 */

import {ValidationPage} from "../../pages/website/ValidationPage";
import {
    CONFIGURATION,
    DBFields, FIND, UPDATE_ONE, USER,
    WB_COLLECTION_TRACKING,
    WB_COLLECTION_TRACKING_EXTERNAL_TESTING
} from "../../utils/db.params";
import {recreateRecord} from "../../utils/db.utils";
import {UiEndPoints} from "../../utils/end.points";
import {mongoDBRequest} from "@fxc/ui-test-framework";
import _ from "lodash";

/**
 * @memberOf ReferenceFieldsSpec
 * @name Reference fields to fields from another collection
 * @description
 * User checks that list of RegisteredUserEmails is equal
 * to list of external users from db.
 * @author dshundrina
 * @since 2021-09-07
 * @version 2021-09-07
 */
test('Reference fields to fields from another collection', async () => {
    const validation = new ValidationPage();
    const collectionName = WB_COLLECTION_TRACKING_EXTERNAL_TESTING;
    const recordID = 790;
    await recreateRecord(collectionName, recordID, {
        refCol: WB_COLLECTION_TRACKING,
        refConfig: WB_COLLECTION_TRACKING
    });
    for (const item of [{$pull : {Validators : {name : "collection_table.RegisteredUserEmail"}}}, {$push : {Validators : {
                name : "collection_table.RegisteredUserEmail",
                type : "external_user_email",
                constraints : {}
            }}}]) {
        await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor: collectionName}, UPDATE_ONE, null, item);
    }
    const externalUsers = await mongoDBRequest(USER,{role: "external"}, FIND);
    const externalUsersList = externalUsers.map(item => item.RegisteredUserEmail);
    await validation.goToPageWithDefaultView(UiEndPoints.goToDetailsUrl(collectionName, recordID));
    await validation.addField('RegisteredUserEmail');
    const rowIds = await validation.get_all_ids_from_field_with_sub_ranges(DBFields.COLLECTION_TABLE);
    await validation.select_sub_table_row_by_id(rowIds[0]);
    await validation.selectValidationForSubtableField("RegisteredUserEmail", false);
    const usersListFromPage = await validation.getListOfRegisteredUserEmails("RegisteredUserEmail");
    expect(_.isEqual(externalUsersList, usersListFromPage.split("\n"))).toBe(true);
});