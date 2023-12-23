import {mongoDBRequest, postApiCall} from '@fxc/ui-test-framework';
import {CONFIGURATION, FX_FEES_0_2, TEST_FX_FEE_0_2, UPDATE_ONE} from '../../../utils/db.params';
import {recreateCollection} from '../../../utils/db.utils';
import faker from 'faker';
import {ApiEndPoints} from '../../../utils/end.points';

const recordId = 1;
const rangeGap = 0.01
const collectionName = TEST_FX_FEE_0_2;
/**
 * @namespace RangeGapSpec
 */

describe('range gaps tests', () => {
    beforeAll(async () => {
        // repopulate collection
        await recreateCollection(collectionName, {refCol: FX_FEES_0_2, refConfig: FX_FEES_0_2});
    });
    ['below_gap', 'equal_gap', 'above_gap'].forEach(gap => {
        [true, false].forEach(withGroup => {
            [true, false].forEach(enabled => {
                test(`Test-14193-Check adding new row with value ${gap} ${enabled}`, async () => {
                    /**
                     * @memberOf RangeGapSpec
                     * @name Check adding new row with value
                     * @description
                     * The user sets up gap configuration with and without grouping.
                     * The user tries to update data and set up new row
                     * below, above or equal to the gap.
                     * The user checks that if gaps rules are switched off then
                     * update should always pass.
                     * @author halina.hulidava
                     * @link https://rm.fxcompared.com/issues/14193
                     * @since 2021-04-21
                     * @version 2021-06-03
                     */
                        // generate value to be set in test
                    const errorMessage = faker.lorem.sentence();
                    const groupFields = withGroup ? ['CurrentState.fees.fee_table.Fee type'] : [''];
                    const gapToBeSet = {
                        RuleType: 'Range',
                        Rules: [{
                            rangeFields: ['CurrentState.fees.fee_table.Amount higher', 'CurrentState.fees.fee_table.Amount lower'],
                            groupFields,
                            gap: rangeGap,
                            errorMessage,
                            enabled: enabled,
                            name: 'Amount range gap unique'
                        }]
                    }
                    for (const item of [{$pull: {BusinessRules: {RuleType: 'Range'}}}, {$push: {BusinessRules: gapToBeSet}}]) {
                        await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor: collectionName}, UPDATE_ONE, null, item)
                    }
                    const curDocument = await postApiCall(global.agent, ApiEndPoints.GET_RECORD, {
                        value: recordId,
                        collectionName
                    }, global.cookies)
                    const feeTable = JSON.parse(curDocument.text).data[0].CurrentState.fees[0].fee_table
                    const curState = JSON.parse(curDocument.text).data[0].CurrentState.fees;
                    const latestAmount = feeTable[0]['Amount higher']
                    let valueToBeAdded;
                    switch (gap) {
                        case 'below_gap':
                            valueToBeAdded = 0.005
                            break
                        case 'above_gap':
                            valueToBeAdded = rangeGap + 0.02
                            break
                        default:
                            valueToBeAdded = rangeGap
                    }
                    let arrChanged = withGroup ? [true, false] : [false]
                    /**
                     * If with group we need to check if there are different
                     * groups or the same
                     */
                    for (const item of arrChanged) {
                        const params = {
                            recordId,
                            changedValues: {
                                'fees.index0.fee_table': {
                                    [feeTable[1]._id]: {}
                                }
                            },
                            audit_info: {
                                UserName: process.env.DV_USER,
                                ConfidenceScore: null,
                                NoteOnConfidenceScore: null
                            },
                            collectionName
                        }
                        let changedVal = {
                            'Amount lower': {
                                value: latestAmount + valueToBeAdded,
                                valid: false
                            }
                        }
                        if (item) {
                            changedVal['Fee type'] = {value: feeTable[0]['Fee type'], valid: false}
                        }
                        params.changedValues['fees.index0.fee_table'][feeTable[1]._id] = changedVal
                        const saveDataResp = await postApiCall(global.agent, ApiEndPoints.SAVE_DATA, params, global.cookies);
                        /**
                         * set back fees state
                         */
                        if (saveDataResp.body.success) {
                            await mongoDBRequest(collectionName, {RecordId: recordId}, UPDATE_ONE, null, {$set: {'CurrentState.fees': curState}});
                        }
                        let respStatus;
                        if (enabled) {
                            respStatus = (gap === 'equal_gap' && !withGroup) || (withGroup && gap === 'equal_gap' && item) || (withGroup && !item);
                        } else {
                            //if disabled expected to pass always
                            respStatus = true;
                        }
                        expect(saveDataResp.body.success).toBe(respStatus);
                        if (!respStatus) {
                            saveDataResp.body.not_updated_fields.forEach(item => {
                                expect(item).toEqual(errorMessage);
                            });
                        }
                    }
                });
            });
        });
    });
})