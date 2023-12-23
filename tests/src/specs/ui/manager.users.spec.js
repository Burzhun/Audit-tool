/**
 * @namespace ManagerUsersSpec
 */
import sleep from "sleep";
import faker from 'faker';
import {mongoDBRequest} from "@fxc/ui-test-framework";
import {COLLECTIONS, DELETE_ONE} from "../../utils/db.params";
import {UsersPage} from "../../pages/website/UsersPage";

/**
 * @memberOf ManagerUsersSpec
 * @name Manager users checks
 * @description
 * Create manager user.
 * Check that user can login via app.
 * Check adding collection for external users
 * Check adding and removing new external user.
 * @author dshundrina
 * @since 2021-08-25
 * @version 2021-08-25
 * @link https://rm.fxcompared.com/issues/16054
 */
test('Manager users spec', async () => {
    const validation = new UsersPage();
    const managerEmail = faker.internet.email();
    const managerName = faker.name.firstName();
    const managerLastName = faker.name.lastName();
    const credentials = await validation.createNewUser(managerEmail, managerName, managerLastName, 'Manager');
    const managerCredentials = credentials.substr(credentials.indexOf(','));
    const managerPassword = managerCredentials.substr(managerCredentials.indexOf(':') + 1);
    await validation.logOut();
    await validation.logIn(managerEmail, managerPassword);
    sleep.sleep(1)
    const userEmail = faker.internet.email();
    const userName = faker.name.firstName();
    const userLastName = faker.name.lastName();
    await validation.createNewUser(userEmail,userName, userLastName, 'External');
    await validation.openUsersList('external-users');
    await validation.removeUser(userEmail);
    await validation.handleAlert();
    await mongoDBRequest(COLLECTIONS.user, {RegisteredUserEmail: managerEmail}, DELETE_ONE);
});