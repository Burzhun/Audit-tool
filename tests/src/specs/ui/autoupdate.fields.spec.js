/**
 * @namespace AutoUpdateFieldsToUserCollectionSpec
 */
import {mongoDBRequest} from "@fxc/ui-test-framework/utils/db.utils";
import {
    COLLECTIONS,
    CONFIGURATION,
    DBFields, DELETE_ONE, INSERT_ONE, USER,
    WB_COLLECTION_TRACKING,
    WB_COLLECTION_TRACKING_REFERENCE
} from "../../utils/db.params";
import {UPDATE_ONE} from "@fxc/ui-test-framework/utils/db.params";
import {recreateRecord} from "../../utils/db.utils";
import {ValidationPage} from "../../pages/website/ValidationPage";
import {UiEndPoints} from "../../utils/end.points";
import _ from "lodash";
import faker from 'faker';
import {getRandomIntInclusive} from "@fxc/ui-test-framework";

/**
 * @memberOf AutoUpdateFieldsToUserCollectionSpec
 * @name Auto-update access to User collection
 * @description
 */
test("Auto-update access to User collection", async () => {
    const collectionName = WB_COLLECTION_TRACKING;
    const recordID = 790;
    const validation = new ValidationPage();
    const externalUserEmail = faker.internet.email();
    const externalUser = {
        "FirstName" : faker.name.firstName(),
        "LastName" : faker.name.lastName(),
        "RegisteredUserEmail" : externalUserEmail,
        "role" : "external",
        "Location" : "Paris",
        "UserId" : getRandomIntInclusive(10000, 20000)
    }
    await mongoDBRequest(USER, externalUser, INSERT_ONE, null, );
    await recreateRecord(collectionName, recordID, {
        refCol: WB_COLLECTION_TRACKING_REFERENCE,
        refConfig: WB_COLLECTION_TRACKING
    });

    for (const item of [{$pull: {update_logics: {name : "External email"}}}, {
        $push: {
            update_logics: {
                name: "External email",
                description: "External email",
                dependency_fields: [
                    "collection_table"
                ],
                update_logic: "{\n  const users = CurrentState['external_users'];\n  var table = CurrentState['collection_table'];\n  table.forEach((row,i)=>{\n    if(row['RegisteredUserEmail']){\n    console.log(users);\n      const user = users.find(u=>u.RegisteredUserEmail===row['RegisteredUserEmail'])\n      if(user){\n        row['Researcher Name'] = user.FirstName+' '+user.LastName;\n        row['Researcher Location (City, Country)'] = user.Location || '';\n        row['Upwork_Id'] = user.Upwork_Id || null;\n        row['UpworkProfileUrlId'] = user.Upwork_Profile_Id || null;\n        table[i] = row;\n      }\n    }\n  });\n  return table;\n}",
                updated_field: "collection_table",
                useExternalUsers: true
            }
        }
    }]) {
        await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor : collectionName}, UPDATE_ONE, null, item)
    }
    await validation.goToPageWithDefaultView(UiEndPoints.goToDetailsUrl(collectionName, recordID));
    await validation.addField('RegisteredUserEmail');
    await validation.addField('Upwork_Id');
    const rowIds = await validation.get_all_ids_from_field_with_sub_ranges(DBFields.COLLECTION_TABLE);
    await validation.select_sub_table_row_by_id(rowIds[0]);
    const fieldArr = ["Researcher Name", "Researcher Location (City, Country)", "Upwork_Id", "UpworkProfileUrlId"];
    const prevUserData = [];
    for (const item of fieldArr) {
        const data = await validation.getResearcherData(rowIds[0], item);
        prevUserData.push(data)
    }
    await validation.selectValidationForSubtableField("RegisteredUserEmail", false);
    await validation.setNewEmail("RegisteredUserEmail",externalUserEmail);
    await validation.save_form_changes();
    await validation.handleAlert();
    await validation.select_sub_table_row_by_id(rowIds[0]);
    const newUserData = [];
    for (const item of fieldArr) {
        const data = await validation.getResearcherData(rowIds[0], item);
        newUserData.push(data)
    }
    await mongoDBRequest(COLLECTIONS.user, {RegisteredUserEmail: externalUserEmail}, DELETE_ONE);
    expect(_.isEqual(prevUserData, newUserData)).toBe(false);
})