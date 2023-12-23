import {recreateCollection} from '../../../utils/db.utils';
import {
    AGGREGATE,
    CONFIGURATION,
    FIND_ONE,
    FX_FEES_WB_REFERENCE,
    FX_FEES_WB_TESTING,
    GLOB_TEST_WITH_EXC,
    GLOB_TEST_WITH_EXC_FOR_APP,
    IMTI_V_95,
    IMTI_V_95_PRISTINE,
    UPDATE_ONE
} from '../../../utils/db.params';
import faker from 'faker';
import {mongoDBRequest, postApiCall} from '@fxc/ui-test-framework';
import _ from 'lodash';
import {ApiEndPoints} from '../../../utils/end.points';

let apiResp;

/**
 * @namespace GlobalUpdates
 */
describe('Check global updates for single document', () => {
    beforeEach(async () => {
        // propagate test data
        for (const col of [GLOB_TEST_WITH_EXC, GLOB_TEST_WITH_EXC_FOR_APP]) {
            await recreateCollection(col, {refCol: IMTI_V_95_PRISTINE, refConfig: IMTI_V_95});
        }
    });

    test('Global update single document', async () => {
        /**
         * @memberOf GlobalUpdates
         * @name Check global update single document
         * @description Check single document global update
         * for pipeline by script and for pipeline in app.
         */
        const recordId = 9167;
        const resp = await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor: GLOB_TEST_WITH_EXC_FOR_APP}, FIND_ONE);
        let record;
        for (const item of resp.global_automatic_updates) {
            const f = new Function(['CurrentState', 'aggr_result'], item.update_function);
            const aggrData = await mongoDBRequest(GLOB_TEST_WITH_EXC_FOR_APP, eval(item.aggregation_pipeline), AGGREGATE);
            record = await mongoDBRequest(GLOB_TEST_WITH_EXC_FOR_APP, {RecordId: recordId}, FIND_ONE);
            const obj = {}
            for (const field of item.matching_fields) {
                if (record.CurrentState.hasOwnProperty(field)) {
                    obj[field] = record.CurrentState[field]
                }
            }
            const foundMatchers = aggrData.filter(item => _.isMatch(item, obj))
            if (foundMatchers) {
                const newState = f(record.CurrentState, foundMatchers[0]);
                await mongoDBRequest(GLOB_TEST_WITH_EXC_FOR_APP, {RecordId: recordId}, UPDATE_ONE, null, newState);
            }
        }
        console.log('finished script update');
        const params = {
            collectionName: GLOB_TEST_WITH_EXC,
            audit_info: {UserName: process.env.HOST},
            host: process.env.HOST,
            recordId
        }
        console.log('starting app update');
        apiResp = await postApiCall(global.agent, ApiEndPoints.GLOBAL_UPDATE_SINGLE, params, global.cookies);
        console.log('finished app update');
        expect(apiResp.body.success).toBe(true);

        const updApp = await mongoDBRequest(GLOB_TEST_WITH_EXC, {RecordId: recordId}, FIND_ONE);
        const updScript = await mongoDBRequest(GLOB_TEST_WITH_EXC_FOR_APP, {RecordId: recordId}, FIND_ONE);
        [updApp, updScript].forEach(item => {
            for (const field of ['matched_data1', 'matched_data2', 'matched_data3', 'update_doc1', 'update_doc2', 'update_doc3']) {
                delete item.CurrentState[field]
            }
        })
        expect(updApp.CurrentState).toEqual(updScript.CurrentState);
    });
    test('Test-12234-Check global update on already audited as valid document', async () => {
        /**
         * @memberOf GlobalUpdates
         * @name Test-12234-Check global update on already audited as valid document
         * @description The user audits document and sets field as valid=true.
         * The user clicks on global update button.
         * Check that global update audit does not
         * overwrite audited fields
         */
        const recordId = 7140;
        const collectionName = GLOB_TEST_WITH_EXC_FOR_APP
        for (const item of [{$pull: {UnEditableFields: 'any_amount_with_negative_fx_margin'}},
            {$push: {updates_manual_overwrite_fields: 'any_amount_with_negative_fx_margin'}}]) {
            await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor: collectionName}, UPDATE_ONE, null, item);
        }
        for (const item of [{
            $push: {
                'AuditSessions.0.AuditValueArray': {
                    AuditFieldName: 'any_amount_with_negative_fx_margin',
                    NewValue: true,
                    OldValue: true,
                    AuditedComment: 'Set high level field to true',
                    Valid: true
                }
            }
        }, {
            $set: {'CurrentState.any_amount_with_negative_fx_margin': true}
        }
        ]) {
            await mongoDBRequest(collectionName, {RecordId: recordId}, UPDATE_ONE, null, item)
        }
        const params = {
            collectionName,
            audit_info: {UserName: process.env.HOST},
            host: process.env.HOST,
            recordId
        }
        apiResp = await postApiCall(global.agent, ApiEndPoints.GLOBAL_UPDATE_SINGLE, params, global.cookies);
        expect(apiResp.body.success).toBe(true);
        const updDoc = await mongoDBRequest(collectionName, {RecordId: recordId}, FIND_ONE);
        expect(updDoc.CurrentState.any_amount_with_negative_fx_margin).toBe(true);
    });
    test('Test-12191-Check always running pipeline', async () => {
        /**
         * @memberOf GlobalUpdates
         * @name Test-12191-Check always running pipeline
         * @description The user adds aggregation function
         * that should be run on single document.
         * But specifies field allDocumentsShouldBeUpdated
         * to true:
         * {
         *       "matching_fields" : [
         *           "organization_id"
         *       ],
         *       "updatable_fields" : [
         *           "any_qa_issues",
         *           "amounts_and_rates.amount_margin_approved",
         *           "matched_data3",
         *           "update_doc3",
         *           "test_field"
         *       ],
         *       "aggregation_pipeline" : "[\n    {'match': {"RecordId": 1200}}\n]",
         *       "allDocumentsShouldBeUpdated": true
         *   }
         * The user runs global update and checks that document that does not match pipeline was updated too.
         */
        const collectionName = GLOB_TEST_WITH_EXC_FOR_APP
        const recordId = 7141;
        const pipeline = {
            allDocumentsShouldBeUpdated: true,
            matching_fields: [
                'RecordId'
            ],
            'updatable_fields': [
                'name_of_researcher'
            ],
            'update_function': '{\n var update_doc={}; \n update_doc[\'CurrentState.name_of_researcher\']=\'Updated globally\'; \nreturn {$set: update_doc};}',
            'aggregation_pipeline': '[\n    {\'$match\': {\'RecordId\': 1}}\n]',
            'description': 'Check field type.'
        };
        const params = {
            collectionName,
            audit_info: {UserName: process.env.HOST},
            host: process.env.HOST,
            recordId
        }
        await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor: collectionName}, UPDATE_ONE, null, {$push: {global_automatic_updates: pipeline}});
        apiResp = await postApiCall(global.agent, ApiEndPoints.GLOBAL_UPDATE_SINGLE, params, global.cookies);
        expect(apiResp.body.success).toBe(true);
        const updDoc = await mongoDBRequest(collectionName, {RecordId: recordId}, FIND_ONE);
        expect(updDoc.CurrentState.name_of_researcher).toBe('Updated globally');
    });
    [
        [{
            name: 'qa_field',
            type: 'bool',
            newValue: true,
            oldValue: null,
            valid: false
        }, {
            name: 'low_level_field',
            type: 'bool',
            newValue: true,
            oldValue: null,
            valid: false
        }],
        [{
            name: 'qa_field',
            type: 'bool',
            newValue: false,
            oldValue: null,
            valid: false
        }, {
            name: 'low_level_field',
            type: 'bool',
            newValue: false,
            oldValue: null,
            valid: false
        }],
        [{
            name: 'qa_field',
            type: 'numeric',
            newValue: 2,
            oldValue: 10,
            valid: false
        }, {
            name: 'low_level_field',
            type: 'numeric',
            newValue: 2,
            oldValue: 10,
            valid: false
        }],
        [{
            name: 'qa_field',
            type: 'text',
            newValue: faker.lorem.word(),
            oldValue: null,
            valid: false
        }, {
            name: 'low_level_field',
            type: 'text',
            newValue: faker.lorem.word(),
            oldValue: null,
            valid: false
        }],

    ].forEach(item => {
        test(`Manual updates with ${JSON.stringify(item)}`, async () => {
            /**
             * @memberOf GlobalUpdates
             * @name Manual updates
             * @description The user creates collection with global updates.
             * The user goes to the document and initiates pipeline by clicking on
             * the button.
             * The user manually changes globally updated fields.
             * for high level field: any_qa_issue.
             * And for low-level: amount_margin_approved.
             * The user sets new data and saves document.
             * The user clicks on update button and checks that exception fields are not updated.
             * Make check for different field types.
             * The user returns on search form and checks that global update for all the collection
             * does not overwrites exception fields
             */
            const qaField = item.filter(el => el.name === 'qa_field')[0];
            const lowLevelField = item.filter(el => el.name === 'low_level_field')[0];
            const collectionName = GLOB_TEST_WITH_EXC_FOR_APP;
            const recordId = 444;
            const pipeline = [{
                matching_fields: [
                    'organization_id',
                ],
                updatable_fields: [
                    'qa_field'
                ],
                update_function: `{\n var update_doc={}; \n update_doc['CurrentState.qa_field']=${qaField.oldValue}; \nreturn {$set: update_doc};}`,
                'aggregation_pipeline': '[\n    {\'$project\': {\n        \'organization_id\': \'$CurrentState.organization_id\' \n    }},\n    {\'$group\': {\n        \'_id\': {\'organization_id\': \'$organization_id\'},\n        \'organization_id\': {\'$first\': \'$organization_id\'}\n    }},\n    {\'$project\': {\n        \'organization_id\': \'$organization_id\',\n        \'_id\': 0\n    }}\n]',
                'description': 'Check field type.'
            }, {
                matching_fields: [
                    'organization_id',
                ],
                'updatable_fields': [
                    'amounts_and_rates.low_level_field'
                ],
                'update_function': `{\n var update_doc={}; \n update_doc['CurrentState.amounts_and_rates.$[].low_level_field']=${lowLevelField.oldValue}; \nreturn {$set: update_doc};}`,
                'aggregation_pipeline': '[\n    {\'$project\': {\n        \'organization_id\': \'$CurrentState.organization_id\' \n    }},\n    {\'$group\': {\n        \'_id\': {\'organization_id\': \'$organization_id\'},\n        \'organization_id\': {\'$first\': \'$organization_id\'}\n    }},\n    {\'$project\': {\n        \'organization_id\': \'$organization_id\',\n        \'_id\': 0\n    }}\n]',
                'description': 'Check field type.'
            }];
            await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor: collectionName}, UPDATE_ONE, null, {
                $push: {
                    global_automatic_updates: {$each: pipeline},
                    DefaultFieldsToDisplayInAuditSession: qaField.name,
                    Validators: {
                        $each: [{
                            name: qaField.name,
                            type: qaField.type,
                            constraints: {}
                        }, {
                            name: `amounts_and_rates.${lowLevelField.name}`,
                            type: lowLevelField.type,
                            constraints: {}
                        }]
                    }
                }
            });
            const toBeSet = {
                $set: {
                    updates_manual_overwrite_fields: [
                        qaField.name,
                        `amounts_and_rates.${lowLevelField.name}`]
                }
            };
            await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor: collectionName}, UPDATE_ONE, null, toBeSet);
            //make global update
            const params = {
                collectionName,
                audit_info: {UserName: process.env.HOST},
                host: process.env.HOST,
                recordId
            }
            apiResp = await postApiCall(global.agent, ApiEndPoints.GLOBAL_UPDATE_SINGLE, params, global.cookies);
            const primaryDoc = await mongoDBRequest(collectionName, {RecordId: recordId});
            const auditedRow = primaryDoc.CurrentState.amounts_and_rates[0]._id.toString();
            const updValues = {
                recordId,
                changedValues: {
                    [qaField.name]: {value: qaField.newValue, valid: qaField.valid},
                    amounts_and_rates: {
                        [auditedRow]: {
                            [lowLevelField.name]: {
                                value: lowLevelField.newValue,
                                valid: lowLevelField.valid
                            }
                        }
                    }
                },
                audit_info: {UserName: process.env.DV_USER, ConfidenceScore: 3},
                collectionName
            };
            apiResp = await postApiCall(global.agent, ApiEndPoints.SAVE_DATA, updValues, global.cookies);
            expect(apiResp.body.success).toBe(true);
            // check db values updated:
            let updDoc = await mongoDBRequest(collectionName, {RecordId: recordId}, FIND_ONE);
            expect(updDoc.CurrentState[qaField.name]).toEqual(qaField.newValue);
            updDoc.CurrentState.amounts_and_rates.forEach(el => {
                if (el._id.toString() === auditedRow) {
                    expect(el[lowLevelField.name]).toEqual(lowLevelField.newValue);
                }
            });
            //make global update
            apiResp = await postApiCall(global.agent, ApiEndPoints.GLOBAL_UPDATE_SINGLE, params, global.cookies);
            expect(apiResp.body.success).toBe(true);
            // check db values not updated for manual field:
            updDoc = await mongoDBRequest(collectionName, {RecordId: recordId}, FIND_ONE);
            expect(updDoc.CurrentState[qaField.name]).toEqual(qaField.newValue);
        });
    });
    test('Test chained updates', async () => {
        /**
         * @memberOf GlobalUpdates
         * @name Test chained updates
         * @description
         * Check results for chained update.
         * Compare results by script and by app.
         * Chained pipeline should be applied according to the
         * results of previous pipeline.
         */
        const collectionName = GLOB_TEST_WITH_EXC;
        const recordId = 444;
        const pipeline = [{
            matching_fields: [
                'organization_id'
            ],
            updatable_fields: [
                'qa_field'
            ],
            update_function: '{var update_doc={}; update_doc[\'CurrentState.qa_field\']=5; return {$set: update_doc};}',
            aggregation_pipeline: '[\n    {\'$project\': {\n        \'organization_id\': \'$CurrentState.organization_id\' \n    }},\n    {\'$group\': {\n        \'_id\': {\'organization_id\': \'$organization_id\'},\n        \'organization_id\': {\'$first\': \'$organization_id\'}\n    }},\n    {\'$project\': {\n        \'organization_id\': \'$organization_id\',\n        \'_id\': 0\n    }}\n]',
            description: 'Check field type.'
        },
            {
                matching_fields: [
                    'organization_id'
                ],
                updatable_fields: [
                    'qa_field_2'
                ],
                update_function: '\n{\nvar update_doc={}; \nupdate_doc[\'CurrentState.qa_field_2\']=CurrentState.qa_field + 5; \nreturn {$set: update_doc};}',
                aggregation_pipeline: '[\n    {\'$project\': {\n        \'organization_id\': \'$CurrentState.organization_id\' \n    }},\n    {\'$group\': {\n        \'_id\': {\'organization_id\': \'$organization_id\'},\n        \'organization_id\': {\'$first\': \'$organization_id\'}\n    }},\n    {\'$project\': {\n        \'organization_id\': \'$organization_id\',\n        \'_id\': 0\n    }}\n]',
                description: 'Check field type.'
            },
            {
                matching_fields: [
                    'organization_id'
                ],
                updatable_fields: [
                    'qa_field_3'
                ],
                update_function: '\n{\nvar update_doc={}; \nupdate_doc[\'CurrentState.qa_field_3\']=CurrentState.qa_field_2 + 4; \nreturn {$set: update_doc};}',
                aggregation_pipeline: '[\n    {\'$project\': {\n        \'organization_id\': \'$CurrentState.organization_id\' \n    }},\n    {\'$group\': {\n        \'_id\': {\'organization_id\': \'$organization_id\'},\n        \'organization_id\': {\'$first\': \'$organization_id\'}\n    }},\n    {\'$project\': {\n        \'organization_id\': \'$organization_id\',\n        \'_id\': 0\n    }}\n]',
                description: 'Check field type.'
            }];
        await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor: collectionName}, UPDATE_ONE, null, {
            $push: {
                global_automatic_updates: {$each: pipeline},
                Validators: {
                    $each: [{name: 'qa_field', type: 'numeric', constraints: {}},
                        {name: 'qa_field_2', type: 'numeric', constraints: {}},
                        {name: 'qa_field_3', type: 'numeric', constraints: {}}
                    ]
                }
            }
        });
        await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor: collectionName}, UPDATE_ONE, null, {
            $set: {
                'CurrentState.qa_field': 3,
                'CurrentState.qa_field_2': 0,
                'CurrentState.qa_field_3': 1,
                updates_manual_overwrite_fields: ['qa_field_2']
            }
        });
        const params = {
            collectionName,
            audit_info: {UserName: process.env.HOST},
            host: process.env.HOST,
            recordId
        }
        apiResp = await postApiCall(global.agent, ApiEndPoints.GLOBAL_UPDATE_SINGLE, params, global.cookies);
        expect(apiResp.body.success).toBe(true);
        const qaField = {
            name: 'qa_field_2',
            valid: false,
            newValue: 25
        }
        const updValues = {
            recordId,
            changedValues: {
                [qaField.name]: {value: qaField.newValue, valid: qaField.valid},
            },
            audit_info: {UserName: process.env.DV_USER, ConfidenceScore: null},
            collectionName
        };
        apiResp = await postApiCall(global.agent, ApiEndPoints.SAVE_DATA, updValues, global.cookies);
        expect(apiResp.body.success).toBe(true);
        const updDoc = await mongoDBRequest(collectionName, {RecordId: recordId});
        expect(updDoc.CurrentState.qa_field).toEqual(5);
        expect(updDoc.CurrentState.qa_field_2).toEqual(qaField.newValue);
        expect(updDoc.CurrentState.qa_field_3).toEqual(14);
        // todo: add check elk
    });
    test('Test-12092-Check failing pipeline', async () => {
        /**
         * @memberOf GlobalUpdates
         * @name Check failing pipeline
         * @description
         * The user creates function with error and set it to pipeline.
         * The user runs global update.
         * Check that error is returned and no data is updated with the pipeline.
         * @author halina.hulidava
         * @since 2021-04-01
         * @version 2021-06-03
         */
        const collectionName = GLOB_TEST_WITH_EXC_FOR_APP;
        const recordId = 445;
        const pipelineDesc = faker.lorem.sentence();
        const pipeline = {
            allDocumentsShouldBeUpdated: true,
            matching_fields: [
                'RecordId'
            ],
            updatable_fields: [
                'name_of_researcher'
            ],
            update_function: '{\n var update_doc={}; \n update_doc[\'CurrentState.name_of_researcher\']=\'text\'++; \nreturn {$set: update_doc};}',
            aggregation_pipeline: `[\n    {'$match': {'RecordId': ${recordId}}}\n]`,
            description: pipelineDesc
        };
        await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor: collectionName}, UPDATE_ONE, null, {$set: {global_automatic_updates: [pipeline]}});
        const params = {
            collectionName,
            audit_info: {UserName: process.env.HOST},
            host: process.env.HOST,
            recordId
        };
        apiResp = await postApiCall(global.agent, ApiEndPoints.GLOBAL_UPDATE_SINGLE, params, global.cookies);
        expect(apiResp.body.success).toBe(false);
        expect(apiResp.body).toHaveProperty('error');
    });
});
describe('Updates for collection with nested fields', () => {
    const collectionName = FX_FEES_WB_TESTING;
    const recordId = 770;
    beforeAll(async () => {
        await recreateCollection(collectionName, {refCol: FX_FEES_WB_REFERENCE, refConfig: FX_FEES_WB_REFERENCE});
    });
    test(`Update Manual Overwrite fields within the nested table`, async () => {
        /**
         * @memberOf GlobalUpdates
         * @name Check Update Manual Overwrite fields within the nested table
         * @description
         * Check that manual update is not overwritten by
         * global update document for nested table fields
         * @author halina.hulidava
         * @since 2021-06-24
         * @version 2021-06-24
         * @link https://rm.fxcompared.com/issues/16197
         */
        const manualUpdatedFields = ["fees.fee_table.[].amount_fee_approved", "any_qa_issues"];
        const pipeline = {
            "name": "auto_approve_amount_fee_approved_for_CS_3",
            "description": "auto_approve_amount_fee_approved_for_CS_3",
            // "update_function": "{fee['fee_table'].forEach((amount) => {\n    amount['amount_fee_approved'] = true;\n   });\n }",
            "update_function": "{\n" +
                "    var update_doc = {};\n" +
                "    CurrentState['fees'].forEach((fee, i) => {\n" +
                "        fee['fee_table'].forEach((row, j)=>{\n" +
                "            update_doc['CurrentState.fees.' + i.toString() + '.fee_table.' + j.toString() + '.amount_fee_approved'] =  true;\n" +
                "        });\n" +
                "    });\n" +
                "    return {$set: update_doc};\n" +
                "}",
            "aggregation_pipeline": `[\n    {'$match': {'RecordId': ${recordId}}}\n]`,
            matching_fields: [
                'RecordId'
            ],
            "updatable_fields": [
                "fees.fee_table.[].amount_fee_approved"
            ]
        }
        await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor: collectionName}, UPDATE_ONE, null,
            {$set: {updates_manual_overwrite_fields: manualUpdatedFields, global_automatic_updates: [pipeline]}});
        const currentDoc = await mongoDBRequest(collectionName, {RecordId: recordId});
        const updFeeTableItem = currentDoc.CurrentState.fees[0].fee_table[0]._id.toString();
        const params = {
            recordId,
            changedValues: {
                "fees.index0.fee_table": {
                    [updFeeTableItem]: {
                        amount_fee_approved: {
                            value: false,
                            valid: false
                        }
                    }
                }
            },
            audit_info: {UserName: process.env.DV_USER, ConfidenceScore: 3, NoteOnConfidenceScore: "1"},
            collectionName
        }
        apiResp = await postApiCall(global.agent, ApiEndPoints.SAVE_DATA, params, global.cookies);
        expect(apiResp.body.success).toBe(true);
        let updDoc = await mongoDBRequest(collectionName, {RecordId: recordId});
        expect(updDoc.CurrentState.fees[0].fee_table[0].amount_fee_approved).toBe(false);
        const globalParams = {
            collectionName,
            audit_info: {UserName: process.env.HOST},
            host: process.env.HOST,
            recordId
        }
        apiResp = await postApiCall(global.agent, ApiEndPoints.GLOBAL_UPDATE_SINGLE, globalParams, global.cookies);
        expect(apiResp.body.success).toBe(true);
        updDoc = await mongoDBRequest(collectionName, {RecordId: recordId});
        expect(updDoc.CurrentState.fees[0].fee_table[0].amount_fee_approved).toBe(false);
    });
});