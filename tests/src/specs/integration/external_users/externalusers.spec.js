import {
    COLLECTIONS,
    CONFIGURATION,
    DELETE_ONE,
    UPDATE_ONE,
    USER,
    WB_COLLECTION_TRACKING_FOR_TESTING
} from "../../../utils/db.params";
import {getApiCall, mongoDBRequest, postApiCall} from "@fxc/ui-test-framework";
import {ApiEndPoints} from "../../../utils/end.points";
import faker from 'faker';
import {FIND} from "@fxc/ui-test-framework/utils/db.params";
import _ from "lodash";


/**
 * @namespace ExternalUsersSpec
 */
describe("External users spec", () => {
    /**
     * @memberOf ExternalUsersSpec
     * @name Collection for external user
     * @description
     * Create external user.
     * Check that user can login via app.
     * Check adding collection for external user
     * @author dshundrina
     * @since 2021-06-14
     * @version 2021-09-15
     * @link https://rm.fxcompared.com/issues/15410
     */
    test('Collection for external user', async () => {
        const collectionName = USER;
        const email = faker.internet.email();
        const firstName = faker.name.findName();
        const lastName = faker.name.lastName();
        const resp = await postApiCall(global.agent, ApiEndPoints.CREATE_USER, {
            email : email,
            first_name: firstName,
            last_name: lastName,
            usertype: "External"
        }, global.cookies);
        const password = resp.body.password;
        await mongoDBRequest(collectionName, {RegisteredUserEmail: email}, UPDATE_ONE, null,
            {$set: {role: 'external'}});
        const params = {
            email : email,
            data: [WB_COLLECTION_TRACKING_FOR_TESTING]
        };
        const userCollectionsList = [];
        const collectionsList = await mongoDBRequest(CONFIGURATION, {"user_type":"external"}, FIND);
        for (const collection of collectionsList) {
            if (collection.Visibility.public == true) {
                userCollectionsList.push(collection.CollectionRelevantFor)
            }
        }
        const apiResp = await postApiCall(global.agent, ApiEndPoints.SET_EXTERNAL_USER_RECORDS, params, global.cookies);
        expect(apiResp.body.success).toBe(true);
        const curDoc = await mongoDBRequest(collectionName, {RegisteredUserEmail: email});
        expect(curDoc.AccessableCollections).toEqual(params.data);
        const userApiResp = await postApiCall(global.agent, ApiEndPoints.LOGIN, {email, password});
        expect(userApiResp.body.success).toBe(true);
        const newUserCookies = {'Cookie': "token=" + userApiResp.body.token}
        const configsApiResp = await getApiCall(global.agent, ApiEndPoints.GET_CONFIGS, email, newUserCookies);
        expect(configsApiResp.body.success).toBe(true);
        const collectionListFromApiResp = [];
        for (const item of configsApiResp.body.configs) {
            collectionListFromApiResp.push(item.CollectionRelevantFor)
        }
        expect(_.isEqual(collectionListFromApiResp.sort(), userCollectionsList.sort())).toBe(true);
        await mongoDBRequest(COLLECTIONS.user, {RegisteredUserEmail: email}, DELETE_ONE);
    });
});