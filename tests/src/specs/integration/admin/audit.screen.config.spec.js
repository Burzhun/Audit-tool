import {CONFIGURATION, TESTING_HALINA, TESTING_HALINA_REFERENCE} from '../../../utils/db.params';
import {getApiCall, mongoDBRequest, putApiCall} from '@fxc/ui-test-framework';
import {recreateConfig} from '../../../utils/db.utils';
import faker from 'faker';
import {DBParams} from '../../../utils/params';
import {ApiEndPoints} from "../../../utils/end.points";


const collectionName = TESTING_HALINA;

/**
 * @namespace AuditScreenConfiguration
 */
describe('API-check of an audit screen configuration', () => {
    beforeEach(async () => {
        await recreateConfig(collectionName, {refConfig: TESTING_HALINA_REFERENCE});
    });
    /**
     * @memberOf AuditScreenConfiguration
     * @name Change number of digits after decimal to display in the UI
     * @description
     * The Admin tries to change the number of digits after the decimal .
     * Check that collection configuration can be updated with FloatDisplayPrecision parameter
     * and then retrieved from the DB.
     * @link https://rm.fxcompared.com/issues/14714
     */
    const testValues = [{value: 2, pass: true}, {value: 11, pass: false}, {value: 2.5, pass: false}, {
        value: 0,
        pass: true
    }, {value: -1, pass: false}, {value: faker.lorem.word(), pass: false}]
    const fields = [DBParams.AUTHOR, DBParams.CLIENT_TYPE, DBParams.COLLECTED_DATE, DBParams.POPULATION, DBParams.CURRENCY_TO]
    fields.forEach(field => {
        testValues.forEach(el => {
            test(`Test-14714-Admin updates config with FloatDisplayPrecision param of value ${el.value} and field=${field}`, async () => {
                const collectionConfig = await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor: collectionName});
                const url = `/configurations/collections/${collectionName}/update`;  //backend
                const urlParams = {
                    name: collectionName,
                    email: process.env.DV_USER
                };

                const fieldValidator = collectionConfig.Validators.filter(item => item.name === field);
                const toPass = !!(fieldValidator[0].type === 'numeric' && el.pass);
                const data = {name: field, value: el.value}
                const payload = {
                    user_type: 'internal',
                    activeCollection: collectionName,
                    field: 'FloatDisplayPrecision',
                    data: [data]
                }
                const updateResponse = await putApiCall(global.agent, url, payload, global.cookies);
                const getResponse = await getApiCall(global.agent, ApiEndPoints.FETCH_CONFIG, urlParams, global.cookies);
                const expectedVal = toPass ? [data] : [];
                expect(getResponse.body.success).toBe(true);
                expect(updateResponse.statusCode).toBe(200);
                expect(updateResponse.body.data.FloatDisplayPrecision).toEqual(expectedVal);
                expect(getResponse.body.config.FloatDisplayPrecision).toEqual(expectedVal);
            });
        });
    });
});