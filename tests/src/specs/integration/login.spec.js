import faker from 'faker';
import {ApiTexts} from '../../utils/texts';
import {ApiEndPoints} from '../../utils/end.points';
import {postApiCall} from '@fxc/ui-test-framework';


/**
 * @namespace LoginSpec
 */

describe('Login spec', () => {
    /**
     * @name Login with email and password
     * @description User logs in with email and password.
     * Check that user can be logged in
     * with only valid login-password pair
     * @param email
     * @param password
     * @memberOf LoginSpec
     */
    let email, password;
    [true, false].forEach(loginValid => {
        [true, false].forEach(passwordValid => {
            test(`Login with valid email=${loginValid} and valid password=${passwordValid}`, async () => {
                email = loginValid ? process.env.DV_USER : faker.internet.email();
                password = passwordValid ? process.env.DV_PSWD : faker.internet.password();
                let resp;
                try {
                    resp = await postApiCall(global.agent, ApiEndPoints.LOGIN, {email, password});
                    if (loginValid && passwordValid) {
                        expect(resp.body.success).toBe(true);
                        expect(resp.body.status).toBe(ApiTexts.SUCCESS);
                        expect(resp.body).toHaveProperty(ApiTexts.TOKEN);
                    } else {
                        expect(resp.body.success).toBe(false);
                        if (loginValid && !passwordValid) {
                            expect(resp.body.status).toBe(ApiTexts.PASSWORD_INCORRECT);
                        } else {
                            expect(resp.body.status).toBe(ApiTexts.USER_NOT_FOUND);
                        }
                    }
                } catch (err) {
                    expect(err).toBe(null);
                }
            });
        })
    });
})