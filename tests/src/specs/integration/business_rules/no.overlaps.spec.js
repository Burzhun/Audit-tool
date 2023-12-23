import {mongoDBRequest, postApiCall} from '@fxc/ui-test-framework';
import {CONFIGURATION, FX_FEES_0_2, TEST_FX_FEE_0_2, UPDATE_ONE} from '../../../utils/db.params';
import {recreateCollection} from '../../../utils/db.utils';
import faker from 'faker';
import {ApiEndPoints} from '../../../utils/end.points';

const recordId = 1;
const collectionName = TEST_FX_FEE_0_2;
let feeTable, curDocument;
/**
 * @namespace NoOverlaps
 */

describe('Business rules no overlaps tests', () => {
    beforeAll(async () => {
        // repopulate collection
        await recreateCollection(collectionName, {refCol: FX_FEES_0_2, refConfig: FX_FEES_0_2});
    });
    ['noIntersection', 'partialIntersection', 'fullIntersection'].forEach(intersection => {
        [true, false, null].forEach(sameGroup => {
            [true, false].forEach(enabled => {
                test(`Test-14337-Check Business Rules: NoRangeOverlaps with ${intersection} and withGroup=${sameGroup} enabled=${enabled}`, async () => {
                    /**
                     * @memberOf NoOverlaps
                     * @name Check Business Rules: NoRangeOverlaps with and without groupping
                     * @description The user sets configuration for intersection.
                     * The user sets grouping rule (or does not set it).
                     * Check that if there is a grouping rule and intersection by it
                     * then user is not allowed to update intersected data in the group.
                     *
                     * Check that if there is no grouping rule
                     * then user is not allowed update intersected data in the set.
                     * @link https://rm.fxcompared.com/issues/14386
                     * @author halina.hulidava
                     * @since 2021-05-01
                     * @version 2021-06-03
                     */
                        // generate value to be set in test
                    const errorMessage = faker.lorem.sentence();
                    const groupFields = sameGroup === null ? [''] : ['CurrentState.fees.fee_table.Fee type']
                    const overlapSet = {
                        RuleType: 'NoOverlapping',
                        Rules: [
                            {
                                rangeFields: ['CurrentState.fees.fee_table.Amount higher',
                                    'CurrentState.fees.fee_table.Amount lower'
                                ],
                                groupFields,
                                errorMessage,
                                enabled,
                                name: 'Amount range overlapping'
                            }
                        ]
                    }
                    for (const item of [{$set: {BusinessRules: [overlapSet]}}]) {
                        await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor: collectionName}, UPDATE_ONE, null, item)
                    }
                    curDocument = await postApiCall(global.agent, ApiEndPoints.GET_RECORD, {
                        value: recordId,
                        collectionName
                    }, global.cookies);
                    feeTable = JSON.parse(curDocument.text).data[0].CurrentState.fees[0].fee_table;
                    const feeIds = feeTable.map(item => item._id);
                    const curState = JSON.parse(curDocument.text).data[0].CurrentState.fees;
                    let amountTo1, amountFrom1, feeType1, amountTo2, amountFrom2, feeType2;
                    switch (intersection) {
                        case 'noIntersection':
                            amountFrom1 = 1;
                            amountFrom2 = 5.01;
                            amountTo1 = 5;
                            amountTo2 = 10;
                            break
                        case 'partialIntersection':
                            amountFrom1 = 1;
                            amountFrom2 = 2;
                            amountTo1 = 2.01;
                            amountTo2 = 6;
                            break
                        case 'fullIntersection':
                            amountFrom1 = 3;
                            amountFrom2 = 3.01;
                            amountTo1 = 10;
                            amountTo2 = 9.9999;
                    }
                    if (sameGroup) {
                        feeType1 = faker.lorem.word();
                        feeType2 = feeType1;
                    } else {
                        feeType1 = faker.lorem.word();
                        feeType2 = faker.lorem.word();
                    }
                    const params = {
                        recordId,
                        changedValues: {
                            'fees.index0.fee_table': {
                                [feeIds[0]]: {
                                    'Amount lower': {value: amountFrom1, valid: false},
                                    'Amount higher': {value: amountTo1, valid: false},
                                    'Fee type': {value: feeType1, valid: false}
                                },
                                [feeIds[1]]: {
                                    'Amount lower': {value: amountFrom2, valid: false},
                                    'Amount higher': {value: amountTo2, valid: false},
                                    'Fee type': {value: feeType2, valid: false}
                                }
                            }
                        },
                        audit_info: {
                            UserName: process.env.DV_USER, ConfidenceScore: null,
                            NoteOnConfidenceScore: null
                        },
                        collectionName
                    }
                    const saveDataResp = await postApiCall(global.agent, ApiEndPoints.SAVE_DATA, params, global.cookies);
                    //set back fees state
                    let expectedStatus;
                    if (enabled) {
                        expectedStatus = sameGroup !== false && intersection === 'noIntersection' || sameGroup === false;
                    } else {
                        expectedStatus = true;
                    }
                    expect(saveDataResp.body.success).toBe(expectedStatus);
                    if (saveDataResp.body.success) {
                        const updData = await mongoDBRequest(collectionName, {RecordId: recordId});
                        //Check updated current data
                        updData.CurrentState.fees[0].fee_table.forEach(item => {
                            for (const k in params.changedValues['fees.index0.fee_table']) {
                                if (item._id.toString() === k) {
                                    expect(item['Amount lower']).toEqual(params.changedValues['fees.index0.fee_table'][k]['Amount lower'].value);
                                    expect(item['Amount higher']).toEqual(params.changedValues['fees.index0.fee_table'][k]['Amount higher'].value);
                                }
                            }
                        });
                        /**
                         * Check audit Sessions
                         */
                        updData.AuditSessions[updData.AuditSessions.length - 1].AuditValueArray.forEach(item => {
                            for (const k in params.changedValues['fees.index0.fee_table']) {
                                if (item.AuditFieldName.includes(k)) {
                                    for (const auditKey in params.changedValues['fees.index0.fee_table'][k]) {
                                        if (item.AuditFieldName.includes(auditKey)) {
                                            expect(item.NewValue).toEqual(params.changedValues['fees.index0.fee_table'][k][auditKey].value);
                                            expect(item.Valid).toEqual(params.changedValues['fees.index0.fee_table'][k][auditKey].valid);
                                            expect(item.AuditedComment).toBeNull();
                                            JSON.parse(curDocument.text).data[0].CurrentState.fees[0].fee_table.forEach(prevItem => {
                                                if (item.AuditFieldName.includes(prevItem._id)) {
                                                    for (const prevKey in prevItem) {
                                                        if (item.AuditFieldName.includes(prevKey)) {
                                                            expect(item.OldValue).toEqual(prevItem[prevKey]);
                                                        }
                                                    }
                                                }
                                            });
                                        }
                                    }
                                }
                            }
                        });
                        await mongoDBRequest(collectionName, {RecordId: recordId}, UPDATE_ONE, null, {$set: {'CurrentState.fees.0.fee_table': curState[0].fee_table}});
                    } else {
                        expect(saveDataResp.body.not_updated_fields).toContain(errorMessage);
                    }
                });
            });
        });
    });
});