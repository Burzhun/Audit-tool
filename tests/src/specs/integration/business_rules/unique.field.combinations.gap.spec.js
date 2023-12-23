import {mongoDBRequest, postApiCall} from '@fxc/ui-test-framework';
import {CONFIGURATION, FX_FEES_0_2, TEST_FX_FEE_0_2, UPDATE_ONE} from '../../../utils/db.params';
import {recreateCollection} from '../../../utils/db.utils';
import faker from 'faker';
import {ApiEndPoints} from '../../../utils/end.points';

const recordId = 4;
const collectionName = TEST_FX_FEE_0_2;
let curDocument, constraintConfig, errorMsg;

/**
 * @namespace UniqueFieldsCombinations
 */
describe('UniqueFieldCombinations tests', () => {
    beforeAll(async () => {
        // repopulate collection
        await recreateCollection(collectionName, {refCol: FX_FEES_0_2, refConfig: FX_FEES_0_2});
        // update collection config
        const collectionConfig = await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor: collectionName});
        constraintConfig = collectionConfig.BusinessRules.filter(item => item.RuleType === 'UniqueFieldCombinations')[0];
        errorMsg = 'Error 1 Your recent changes has created a duplicated table - please check your table settings'
    });
    ['same_single', 'same_multiple', 'same_multiple_diff_order', 'empty', 'diff'].forEach(combination => {
        [true, false].forEach(enabled => {
            test(`Test-14354-Check unique field combination ${combination} and enabled= ${enabled}`, async () => {
                /**
                 * @memberOf UniqueFieldsCombinations
                 * @name Check unique field combination
                 * @description
                 * The user sets unique field combination in
                 * the config.
                 * The user sets the next fields as unique combination:
                 * "CurrentState.fees.Countries to", "CurrentState.fees.Payout method", "CurrentState.fees.Payment method"
                 * Check that when unique field combination is checked when sending request to update data on form.
                 * Check that when rule is disabled
                 * then everything should pass.
                 * @author halina.hulidava
                 * @link https://rm.fxcompared.com/issues/14354
                 * @since 2021-04-21
                 * @version 2021-06-03
                 */
                curDocument = await postApiCall(global.agent, ApiEndPoints.GET_RECORD, {
                    value: recordId,
                    collectionName
                }, global.cookies)
                const curState = JSON.parse(curDocument.text).data[0].CurrentState.fees;
                const constraintsToBeSet = {
                    RuleType: 'UniqueFieldCombinations',
                    Rules: [{
                        outerFields: [],
                        complexFields: ['CurrentState.fees.Countries to', 'CurrentState.fees.Payout method', 'CurrentState.fees.Payment method'],
                        errorMessage: errorMsg,
                        enabled,
                        name: 'Unique tables within a record'
                    }]
                }
                for (const item of [{$pull: {BusinessRules: {RuleType: 'UniqueFieldCombinations'}}}, {$push: {BusinessRules: constraintsToBeSet}}]) {
                    await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor: collectionName}, UPDATE_ONE, null, item)
                }
                curDocument = await postApiCall(global.agent, ApiEndPoints.GET_RECORD, {
                    value: recordId,
                    collectionName
                }, global.cookies);
                let countriesTo1, countriesTo2, paymentMethod1, paymentMethod2, payoutMethod1, payoutMethod2,
                    currencyTo1, currencyTo2;
                switch (combination) {
                    case 'empty':
                        countriesTo1 = countriesTo2 = paymentMethod1 = paymentMethod2 = payoutMethod1 = payoutMethod2 = [];
                        break
                    case 'same_single':
                        countriesTo1 = countriesTo2 = [faker.address.countryCode()];
                        paymentMethod1 = paymentMethod2 = [faker.company.companyName()]
                        payoutMethod1 = payoutMethod2 = [faker.company.companyName()]
                        break
                    case 'same_multiple':
                        countriesTo1 = countriesTo2 = [faker.address.countryCode(), faker.address.countryCode()];
                        paymentMethod1 = paymentMethod2 = [faker.company.companyName()]
                        payoutMethod1 = payoutMethod2 = [faker.company.companyName()]
                        currencyTo1 = currencyTo2 = []
                        break
                    case 'same_multiple_diff_order':
                        countriesTo1 = [faker.address.countryCode(), faker.address.countryCode()];
                        countriesTo2 = countriesTo1.reverse();
                        paymentMethod1 = paymentMethod2 = [faker.company.companyName()]
                        payoutMethod1 = payoutMethod2 = [faker.company.companyName()]
                        currencyTo1 = currencyTo2 = []
                        break
                    case 'diff':
                        countriesTo1 = [faker.address.countryCode()];
                        countriesTo2 = [faker.address.countryCode()];
                        paymentMethod1 = payoutMethod1 = [faker.company.companyName()]
                        paymentMethod2 = payoutMethod2 = [faker.company.companyName()]
                }
                const params = {
                    recordId,
                    changedValues: {
                        'fees.index0.Countries to': {value: countriesTo1, valid: false},
                        'fees.index0.Payment method': {value: paymentMethod1, valid: false},
                        'fees.index0.Payout method': {value: payoutMethod1, valid: false},
                        'fees.index1.Countries to': {value: countriesTo2, valid: false},
                        'fees.index1.Payment method': {value: paymentMethod2, valid: false},
                        'fees.index1.Payout method': {value: payoutMethod2, valid: false}
                    },
                    audit_info: {UserName: process.env.DV_USER, ConfidenceScore: null, NoteOnConfidenceScore: null},
                    collectionName
                }
                if (combination === 'same_multiple_diff_order' || combination === 'same_multiple') {
                    params.changedValues['fees.index0.Currency to'] = {value: null, valid: false}
                    params.changedValues['fees.index1.Currency to'] = {value: null, valid: false}

                }
                const saveDataResp = await postApiCall(global.agent, ApiEndPoints.SAVE_DATA, params, global.cookies);
                let respStatus;
                if (enabled) {
                    respStatus = combination === 'diff';
                } else {
                    //if disabled expected to pass always
                    respStatus = true;
                }
                if (saveDataResp.body.success) {
                    await mongoDBRequest(collectionName, {RecordId: recordId}, UPDATE_ONE, null, {$set: {'CurrentState.fees': curState}});
                }
                expect(saveDataResp.body.success).toBe(respStatus);
                if (!respStatus) {
                    saveDataResp.body.not_updated_fields.forEach(item => {
                        expect(item).toEqual(errorMsg);
                    })
                } else {
                    //todo: add check in the db
                }
            });
        });
    });
})