import {recreateCollection} from "../../../utils/db.utils";
import {CONFIGURATION, FX_FEES_WB_REFERENCE, FX_FEES_WB_TESTING, UPDATE_ONE} from "../../../utils/db.params";
import {ApiEndPoints} from "../../../utils/end.points";
import {mongoDBRequest, postApiCall} from "@fxc/ui-test-framework";
import faker from 'faker';

const collectionName = FX_FEES_WB_TESTING;
const recordId = 1;
const rangeGap = 0.01
let feeTable, curDocument;
/**
 * @namespace ExtendBusinessRulesSpec
 */
describe('Extend business rules', () => {
    beforeAll(async () => {
        await recreateCollection(collectionName, {refCol: FX_FEES_WB_REFERENCE, refConfig: FX_FEES_WB_REFERENCE});
    });
    ['noIntersection', 'partialIntersection', 'fullIntersection'].forEach(intersection => {
        [true, false].forEach(sameGroup => {
            test(`Extend business rules ${intersection} withGroup=${sameGroup}`, async () => {
                /**
                 * @memberOf ExtendBusinessRulesSpec
                 * @name Extend business rules
                 * @description
                 * The user sets configuration for turn off business rules.
                 * Then the user checks saving data.
                 * @link https://rm.fxcompared.com/issues/15310
                 * @author dshundrina
                 * @since 2021-06-18
                 * @version 2021-06-18
                 */
                const errorMessage = faker.lorem.word();
                const groupFields = ['CurrentState.fees.fee_table.Fee type']
                const overlapSet = {
                    RuleType: 'NoOverlapping',
                    Rules: [
                        {
                            rangeFields: ['CurrentState.fees.fee_table.Amount From',
                                'CurrentState.fees.fee_table.Amount To'
                            ],
                            groupFields,
                            errorMessage,
                            enabled: true,
                            name: 'Amount range overlapping',
                            disableField: 'CurrentState.fees.amount_range'
                        }
                    ]
                }
                for (const item of [{$set: {BusinessRules: [overlapSet]}}]) {
                    await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor: collectionName}, UPDATE_ONE, null, item)
                }
                const gapToBeSet = {
                    RuleType: 'Range',
                    Rules: [{
                        rangeFields: ['CurrentState.fees.fee_table.Amount From',
                            'CurrentState.fees.fee_table.Amount To'],
                        groupFields,
                        gap: rangeGap,
                        errorMessage,
                        enabled: true,
                        name: 'Amount range gap unique',
                        disableField: 'CurrentState.fees.amount_range'
                    }]
                }
                for (const item of [{$pull: {BusinessRules: {RuleType: 'Range'}}}, {$push: {BusinessRules: gapToBeSet}}]) {
                    await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor: collectionName}, UPDATE_ONE, null, item)
                }
                await postApiCall(global.agent, ApiEndPoints.SAVE_DATA, {
                    recordId: recordId,
                    collectionName: collectionName,
                    changedValues: {'fees.index0.amount_range': {value: false, valid: false}},
                    audit_info: {UserName: process.env.DV_USER, ConfidenceScore: null, NoteOnConfidenceScore: null}
                }, global.cookies);

                curDocument = await postApiCall(global.agent, ApiEndPoints.GET_RECORD, {
                    value: recordId,
                    collectionName
                }, global.cookies);
                feeTable = JSON.parse(curDocument.text).data[0].CurrentState.fees[0].fee_table;
                const feeIds = feeTable.map(item => item._id);
                let amountTo1, amountFrom1, amountTo2, amountFrom2, feeType1, feeType2;
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
                        amountTo1 = null;
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
                                'Amount From': {value: amountFrom1, valid: false},
                                'Amount To': {value: amountTo1, valid: false},
                                'Fee Type': {value: feeType1, valid: false}
                            },
                            [feeIds[1]]: {
                                'Amount From': {value: amountFrom2, valid: false},
                                'Amount To': {value: amountTo2, valid: false},
                                'Fee Type': {value: feeType2, valid: false}
                            }
                        }
                    },
                    audit_info: {
                        UserName: process.env.DV_USER, ConfidenceScore: 1,
                        NoteOnConfidenceScore: null
                    },
                    collectionName
                }
                const saveDataResp = await postApiCall(global.agent, ApiEndPoints.SAVE_DATA, params, global.cookies);
                expect(saveDataResp.body.success).toBe(true);
                expect(saveDataResp.body.not_updated_fields).toBe(false);
            });
        });
    });
});


