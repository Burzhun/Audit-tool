import {LoginSignupPage} from "../../pages/website/LoginSignupPage";
import faker from 'faker';
import {AlertTexts, LoginSignUpTexts} from '../../utils/texts';
import {UiEndPoints} from '../../utils/end.points';
import sleep from 'sleep';
import {DBParams, Styles} from '../../utils/params';
import {DELETE_ONE} from '../../utils/db.params';
import {handleApiCall, mongoDBRequest} from '@fxc/ui-test-framework';

/**
 * @namespace LoginSignUpSpec
 */
const loginPage = new LoginSignupPage();
describe('Check login and signup', () => {
    beforeAll(async () => {
        //remove local storage
        try {
            // await prepareTestData();
            await driver.executeScript("localStorage.removeItem('jwtToken')");
            await driver.navigate().refresh();
        } catch (e) {
            console.log(e);
        }
        await loginPage.goToPage();
    });
    /**
     * @memberOf LoginSignUpSpec
     * @name Login test
     * @description
     * The user tries to login with
     * valid and invalid credentials
     * @author halina.hulidava
     * @since 2021-05-20
     * @version 2021-06-02
     * @example Login with valid email and password. Check that logout link is present
     * Login with invalid login. Check that notification about user not found appears
     * Login with valid login and invalid password. Check that notification about wrong credentials appears.
     */
    [true, false].forEach(login => {
        [true, false].forEach(password => {
            const loginInput = login ? process.env.DV_USER : faker.internet.email();
            const passwordInput = password ? process.env.DV_PSWD : faker.internet.password();

            test(`login with email=${loginInput} password=${passwordInput}`, async (done) => {
                expect(await loginPage.gotoLoginForm()).toBe(true);
                await loginPage.fillLoginSignUpForm(loginInput, passwordInput);
                const driverCap = await global.driver.getCapabilities();
                if (driverCap.getBrowserName().toLowerCase() === 'chrome') {
                    await driver.manage().logs().get('performance');
                }
                await driver.manage().logs().get('performance');
                await loginPage.submitLoginSignUpForm();
                //clear logs
                if (driverCap.getBrowserName().toLowerCase() === 'chrome') {
                    sleep.sleep(1);
                    const logs = await global.driver.manage().logs().get('performance');
                    // check api call is done with proper data
                    const req = handleApiCall(logs, UiEndPoints.AUTH_LOGIN);
                    expect(JSON.parse(req[0].request.postData).email).toBe(loginInput);
                    expect(JSON.parse(req[0].request.postData).password).toBe(passwordInput);
                }

                if (login && password) {
                    expect(await loginPage.logOut()).toBe(true);
                } else {
                    sleep.sleep(1)
                    const alertText = await loginPage.handleAlert();
                    if (login) {
                        expect(alertText).toContain(AlertTexts.PASSWORD_IS_INCORRECT)
                    } else {
                        expect(alertText).toContain(AlertTexts.USER_NOT_FOUND)
                    }
                }
                done();
            });
        });
    });
    /**
     * @memberOf LoginSignUpSpec
     * @name Sign Up Spec
     * @author halina.hulidava
     * @description
     * Try to sign up with email that doesn't match email format,
     * Try to sign up with existing email,
     * Try to sign up with new email.
     * Check errors on form
     */
    test.skip('Sign up', async (done) => {
        const pswd = faker.internet.password();
        const email = faker.internet.email();
        // expect(await loginPage.goToSignUpForm()).toBe(true);
        await loginPage.goToPage(UiEndPoints.AUTH_REGISTER);
        await loginPage.submitLoginSignUpForm();
        for (const field of [LoginSignUpTexts.FIRST_NAME, LoginSignUpTexts.LAST_NAME, LoginSignUpTexts.EMAIL_ADDRESS, LoginSignUpTexts.PASSWORD]) {
            const styles = await loginPage.getFieldColor(field);
            expect(styles).toEqual(Styles.RED_COLOR);
        }
        /**
         * Try to sign up with email that doesn't match email format,
         * Try to sign up with existing email,
         * Try to sign up with new email
         */
        for (const el of [{email: faker.lorem.word(), password: pswd, success: false, error: null},
            {email: process.env.DV_USER, password: null, success: false, error: AlertTexts.USER_IS_REGISTERED},
            {email: email, password: null, success: false, error: AlertTexts.SIGN_UP_SUCCESS}]) {
            await loginPage.fillLoginSignUpForm(el.email, el.password, faker.name.firstName(), faker.name.lastName());
            await loginPage.submitLoginSignUpForm();
            if (el.success) {
                // expect user is registered alert
                expect(await loginPage.handleAlert()).toContain(AlertTexts.USER_IS_REGISTERED);
            } else {
                if (el.error === null) {
                    expect(await loginPage.getFieldColor(LoginSignUpTexts.EMAIL_ADDRESS)).toEqual(Styles.RED_COLOR);
                } else {
                    let alertText = await loginPage.handleAlert();
                    expect(alertText).toContain(el.error);
                }
            }

        }
        /**
         * Clear db
         */
        await mongoDBRequest(DBParams.USERS, {RegisteredUserEmail: email}, DELETE_ONE);
        done();
    });
});