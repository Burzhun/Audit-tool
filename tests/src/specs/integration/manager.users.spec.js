/**
 * @namespace ManagerUsersSpec
 */

import {COLLECTIONS, DELETE_ONE} from "../../utils/db.params";
import {getApiCall, mongoDBRequest, postApiCall} from "@fxc/ui-test-framework";
import {ApiEndPoints} from "../../utils/end.points";
import faker from 'faker';

/**
 * @memberOf ManagerUsersSpec
 * @name Manager users checks
 * @description
 * Create manager user.
 * Check that user can login via app.
 * Check adding collection for external users
 * Check adding and removing new external user.
 * Check changing external user.
 * @author dshundrina
 * @since 2021-08-11
 * @version 2021-08-11
 * @link https://rm.fxcompared.com/issues/16054
 */
test('Manager users checks', async ()  => {
    //todo: check manager user can't get list of internal users
    const email = faker.internet.email();
    const firstName = faker.name.firstName();
    const lastName = faker.name.lastName();
    const userEmail = faker.internet.email();
    const externalParams = {
        data: {
            FirstName: faker.name.firstName(),
            LastName: faker.name.lastName(),
            Location: "London",
            Upwork_Id: "",
            Upwork_Profile_Id: ""
        },
        email: userEmail
    };
    const resp = await postApiCall(global.agent, ApiEndPoints.CREATE_USER, {
        email : email,
        first_name: firstName,
        last_name: lastName,
        usertype: "Manager"
    }, global.cookies);
    const password = resp.body.password;
    const userApiResp = await postApiCall(global.agent, ApiEndPoints.LOGIN, {email, password});
    expect(userApiResp.body.success).toBe(true);
    const newUserCookies = {'Cookie': "token=" + userApiResp.body.token};
    const createExternalUser = await postApiCall(global.agent, ApiEndPoints.CREATE_USER, {
        email: userEmail,
        first_name: faker.name.firstName(),
        last_name: faker.name.lastName(),
        usertype: "External"
    }, newUserCookies);
    expect(createExternalUser.body.success).toBe(true);
    const externalUsersResp = await getApiCall(global.agent, ApiEndPoints.EXTERNAL_USERS, {email}, newUserCookies);
    const internalUsersResp = await getApiCall(global.agent, ApiEndPoints.INTERNAL_USERS, {email}, newUserCookies);
    for (const apiCallParams of [{endPoint: ApiEndPoints.UPDATE_USER_FIELDS, params: externalParams}, {endPoint: ApiEndPoints.DELETE_USER, params: {email: userEmail}}]) {
        const externalUserUpdate = await postApiCall(global.agent, apiCallParams.endPoint, apiCallParams.params, newUserCookies);
        expect(externalUserUpdate.body.success).toBe(true)
    }
    await mongoDBRequest(COLLECTIONS.user, {RegisteredUserEmail: email}, DELETE_ONE);
    expect(externalUsersResp.body.success).toBe(true);
    // expect(internalUsersResp.body.success).toBe(false);
});
