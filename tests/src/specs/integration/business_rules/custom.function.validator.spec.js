import {mongoDBRequest, postApiCall} from '@fxc/ui-test-framework';
import {CONFIGURATION, FX_FEES_0_3, TEST_FX_FEE_0_3, UPDATE_ONE} from '../../../utils/db.params';
import {recreateCollection} from '../../../utils/db.utils';
import faker from 'faker';
import {ApiEndPoints} from '../../../utils/end.points';

const collectionName = TEST_FX_FEE_0_3;
let curDocument, validationConfig;

const fieldName = 'fees.Currency To';
const recordId = 3;
const multiCountryWithCurrencyError = faker.lorem.sentence();
const singleCountryWithOutCurrencyError = faker.lorem.sentence();

/**
 * @namespace CustomFunctionValidator
 */

describe('Custom function validator', () => {
    beforeAll(async () => {
        // repopulate collection
        await recreateCollection(collectionName, {refCol: FX_FEES_0_3, refConfig: FX_FEES_0_3});
        // update collection config
        const collectionConfig = await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor: collectionName})
        validationConfig = collectionConfig.Validators.filter(item => item.name === fieldName)[0]
    });
    ['multiCountryWithCurrency', 'multiCountryWithoutCurrency', 'singleCountryWithCurrency', 'singleCountryWithoutCurrency'].forEach(item => {
        test('Test-14386-Custom Function Validator: Constrain table values in certain columns based on inputs in other columns', async () => {
            /**
             * @memberOf CustomFunctionValidator
             * @name Custom Function Validator
             * @description
             * The user sets up function where one field
             * is updatable according to other
             * field value
             * @link https://rm.fxcompared.com/issues/14386
             * @author halina.hulidava
             * @since 2021-04-28
             * @version 2021-06-03
             */
            // generate value to be set in test
            curDocument = await postApiCall(global.agent, ApiEndPoints.GET_RECORD, {
                value: recordId,
                collectionName
            }, global.cookies)
            const curState = JSON.parse(curDocument.text).data[0].CurrentState.fees;
            const ruleToSet = {...validationConfig};

            ruleToSet.constraints['Custom Function'] = `{
                var multiple_countries = this['Countries To'] && (this['Countries To'].length>1 || this['Countries To'][0].includes(' countries'));\n
                if (multiple_countries  && this['Currency To'] !== null)\n
                {
                    return '${multiCountryWithCurrencyError}';
                }\n
                if (this['Countries To'] && !multiple_countries && this['Currency To'] === null)
                {
                    return '${singleCountryWithOutCurrencyError}';
                }\n
            }`;

            for (const item of [{$pull: {Validators: {name: 'fees.Currency To'}}}, {$push: {Validators: ruleToSet}}]) {
                await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor: collectionName}, UPDATE_ONE, null, item);
            }
            let countryTo, currencyTo;
            switch (item) {
                case 'multiCountryWithCurrency':
                    countryTo = [faker.address.country(), faker.address.country()];
                    currencyTo = faker.finance.currencyCode();
                    break
                case 'multiCountryWithoutCurrency':
                    countryTo = [faker.address.country(), faker.address.country()];
                    currencyTo = '';
                    break
                case 'singleCountryWithCurrency':
                    countryTo = [faker.address.country()];
                    currencyTo = faker.finance.currencyCode();
                    break
                case 'singleCountryWithoutCurrency':
                    countryTo = [faker.address.country()];
                    currencyTo = null;
                    break
            }
            const params = {
                recordId,
                changedValues: {
                    'fees.index0.Countries To': {value: countryTo, valid: false},
                    'fees.index0.Currency To': {value: currencyTo, valid: false}
                },
                audit_info: {UserName: process.env.DV_USER, ConfidenceScore: null, NoteOnConfidenceScore: null},
                collectionName
            }
            const saveDataResp = await postApiCall(global.agent, ApiEndPoints.SAVE_DATA, params, global.cookies);
            //return back to primary state
            if (item === 'multiCountryWithCurrency' || item === 'singleCountryWithoutCurrency') {
                expect(saveDataResp.body.success).toBe(false);
                const itemError = item === 'multiCountryWithCurrency' ? multiCountryWithCurrencyError : singleCountryWithOutCurrencyError;
                saveDataResp.body.validator_errors['fees.index0.Currency To'].forEach(err => {
                    expect(err).toEqual(itemError);
                });
            } else {
                expect(saveDataResp.body.success).toBe(true);
            }
            await mongoDBRequest(collectionName, {RecordId: recordId}, UPDATE_ONE, null, {$set: {'CurrentState.fees': curState}});
        });
    });
})