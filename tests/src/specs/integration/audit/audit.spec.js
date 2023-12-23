import {
    CONFIGURATION,
    DBFields,
    DELETE_ONE,
    FIND,
    TESTING_HALINA,
    TESTING_HALINA_REFERENCE,
    UPDATE_ONE
} from '../../../utils/db.params';
import {arraysOfObjectsAreEqual, mongoDBRequest, postApiCall, randomFromInterval} from '@fxc/ui-test-framework';
import faker from 'faker';
import {recreateRecord} from '../../../utils/db.utils';
import {ApiEndPoints} from '../../../utils/end.points';
import {AlertTexts} from '../../../utils/texts';
import _ from 'lodash';

let curDoc, consumerMarginRowIds;
const collectionName = TESTING_HALINA;
const recordId = 2;
/**
 * @namespace AuditSpec
 */
describe('Audit api check', () => {
    beforeEach(async () => {
        await recreateRecord(TESTING_HALINA, recordId, {
            refCol: TESTING_HALINA_REFERENCE,
            refConfig: TESTING_HALINA_REFERENCE
        })
        curDoc = await mongoDBRequest(collectionName, {RecordId: recordId});
        consumerMarginRowIds = curDoc.CurrentState.ConsumerMargins.map(row => row._id.toString());
    });
    /**
     * @memberOf AuditSpec
     * @name Audit datetime fields
     * @description
     * The user tries to validate
     * high and low level fields without comments.
     * Check that comments are set the same format in the DB
     */
    [true, false].forEach(comment => {
        test(`Check audit for dt field, comment setup is ${comment}`, async () => {
            const hofValue = {name: 'area_km2', value: randomFromInterval(1000, 10000).toString(), valid: false};
            const lowLevelFieldValue = {
                name: 'amount',
                value: randomFromInterval(1100, 10000).toString(),
                valid: false
            };
            if (comment) {
                hofValue.comment = faker.lorem.words();
                lowLevelFieldValue.comment = faker.lorem.words();
            }
            const params = {
                recordId,
                changedValues: {
                    [hofValue.name]: {value: hofValue.value, valid: hofValue.valid},
                    ConsumerMargins: {
                        [consumerMarginRowIds[0]]: {
                            [lowLevelFieldValue.name]: {
                                value: lowLevelFieldValue.value,
                                valid: lowLevelFieldValue.valid
                            }
                        }
                    }
                },
                audit_info: {UserName: process.env.DV_USER, ConfidenceScore: null, NoteOnConfidenceScore: null},
                collectionName
            }
            console.log(params);
            const apiResp = await postApiCall(global.agent, ApiEndPoints.SAVE_DATA, params, global.cookies);
            expect(apiResp.body.success).toBe(true);
            const changedRecord = await mongoDBRequest(collectionName, {RecordId: recordId});
            expect(changedRecord.AuditState.AuditNumber).toEqual(curDoc.AuditState.AuditNumber + 1);
            const prevAuditSessionsLength = 'AuditSessions' in curDoc ? curDoc.AuditSessions.length : 0;
            expect(prevAuditSessionsLength + 1).toEqual(changedRecord.AuditSessions.length);
            const auditedHofComment = comment ? hofValue.comment : null;
            const auditedLowLevelComment = comment ? lowLevelFieldValue.comment : null;
            const auditedHof = {
                AuditFieldName: hofValue.name,
                NewValue: hofValue.value,
                OldValue: curDoc.CurrentState[hofValue.name],
                Valid: hofValue.valid,
                AuditedComment: auditedHofComment
            };
            const auditedLowLevelField = {
                AuditFieldName: `ConsumerMargins.${consumerMarginRowIds[0]}.${lowLevelFieldValue.name}`,
                NewValue: lowLevelFieldValue.value,
                OldValue: curDoc.CurrentState.ConsumerMargins[0][lowLevelFieldValue.name],
                Valid: lowLevelFieldValue.valid,
                AuditedComment: auditedLowLevelComment
            };
            expect(arraysOfObjectsAreEqual(changedRecord.AuditSessions[changedRecord.AuditSessions.length - 1].AuditValueArray, [auditedHof, auditedLowLevelField])).toBe(true);
        });
    });
    /**
     * @name Autoupdate functionality to update full table
     * @memberOf AuditSpec
     * @description
     * The user audits any sub-table row
     * and checks that autoupdate pipeline
     * was applies to the whole table
     * @example
     * The user set up config to update to:
     * org_name_prev = org_name
     * org_name = null
     * After update is done check that
     * org_name_prev is filled with old org_name values.
     * Except audited field. They are filled with audited values.
     * org_name is filled with nulls
     * @link https://rm.fxcompared.com/issues/15096
     */
    test('Check autoupdate pipeline for the whole sub-table', async () => {
        /**
         * update current config for autoupdate:
         * set org_name to nulls and copy previous value to the new field
         */
        await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor: collectionName}, UPDATE_ONE, null, {
            $set: {
                update_logics: [{
                    name: 'move_all_is_correct_to_is_correct_history',
                    description: '1. When all is_correct is not null - move all values to is_correct history\n2. Clear all is_correct values set to null.',
                    dependency_fields: [
                        'ConsumerMargins'
                    ],
                    update_logic: '{     \n   let new_table = CurrentState[\'ConsumerMargins\'];\n      new_table.forEach((row, index) => {\n        row[\'org_name_prev\'] = row[\'org_name\'];\n        row[\'org_name\']=null;})\n      return new_table;\n    }',
                    updated_field: 'ConsumerMargins'
                }]
            }
        });
        const params = {
            recordId,
            changedValues: {
                ConsumerMargins: {
                    [consumerMarginRowIds[0]]: {
                        org_name: {
                            value: faker.lorem.word().slice(0, 5),
                            valid: false
                        }
                    }
                }
            },
            audit_info: {UserName: process.env.DV_USER, ConfidenceScore: null, NoteOnConfidenceScore: null},
            collectionName
        }
        const apiResp = await postApiCall(global.agent, ApiEndPoints.SAVE_DATA, params, global.cookies);
        expect(apiResp.body.success).toBe(true);
        expect(apiResp.body.not_updated_fields).toBe(false);
        //  Get updated state and compare with previous
        //  Check that all org_name_prev except first record are equal
        //  to org_name before update
        const updatedState = await mongoDBRequest(collectionName, {RecordId: recordId});
        expect(updatedState.CurrentState.ConsumerMargins.map(rec => rec.org_name_prev).slice(1)).toEqual(curDoc.CurrentState.ConsumerMargins.map(record => record.org_name).slice(1));
        expect(updatedState.CurrentState.ConsumerMargins.map(rec => rec.org_name_prev)[0]).toEqual(params.changedValues.ConsumerMargins[consumerMarginRowIds[0]].org_name.value)
        updatedState.CurrentState.ConsumerMargins.forEach(rec => {
            expect(rec.org_name).toBeNull();
        });
    });
    /**
     * @memberOf AuditSpec
     * @name Check notification for the nullable or 0
     * @description
     * The user sets up null to the fields that are in formula.
     * Check that notification is displayed to the user about NaN of Inf
     * value
     * @author dshundrina
     * @since 2021-06-07
     * @version 2021-06-07
     * @example
     * pop_density = polulation/area
     * @link https://rm.fxcompared.com/issues/15157
     */
    const fieldsToUpdate = [{name: DBFields.AREA_KM_2, value: 0}, {
        name: DBFields.AREA_KM_2,
        value: ''
    }, {name: DBFields.POPULATION, value: ''}];
    fieldsToUpdate.forEach(field => {
        test(`Check notification for the nullable or 0 updatable field ${field.name}=${field.value}`, async () => {
            const params = {
                recordId: 1,
                changedValues: {[field.name]: {value: field.value, valid: false}},
                audit_info: {UserName: process.env.DV_USER, ConfidenceScore: null, NoteOnConfidenceScore: null},
                collectionName
            }
            const resp = await postApiCall(global.agent, ApiEndPoints.SAVE_DATA, params, global.cookies);
            expect(resp.body.success).toBe(false);
            expect(resp.body.not_updated_fields[0]).toBe(AlertTexts.INCONSISTENT_CONFIGURATION);
            expect(resp.body.not_updated_fields[1].includes(AlertTexts.CANNOT_BE_NULLS)).toBe(true);
        });
    });
    /**
     * @memberOf AuditSpec
     * @name Check notification field for the field that causes update formula
     * @description
     * population_density is set as text field in DB
     * The user tries to update field population that causes formula
     * update to population_density.
     * Check that notification is displayed about
     * field is marked as text
     * @author dshundrina
     * @since 2021-06-08
     * @version 2021-06-08
     * @example
     * pop_density = polulation/area
     * @link https://rm.fxcompared.com/issues/15157
     */
    test('Check notification field for population_destiny', async () => {
        await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor: collectionName}, UPDATE_ONE, null,
            {$pull: {Validators: {name: 'population_density_(person/km2)'}}});
        const params = {
            recordId: 1,
            changedValues: {[DBFields.AREA_KM_2]: {value: randomFromInterval(1000, 10000), valid: false}},
            audit_info: {UserName: process.env.DV_USER, ConfidenceScore: null, NoteOnConfidenceScore: null},
            collectionName
        };
        const resp = await postApiCall(global.agent, ApiEndPoints.SAVE_DATA, params, global.cookies);
        expect(resp.body.success).toBe(true);
        expect(resp.body.not_updated_fields[0].includes(AlertTexts.DEFINED_AS_TEXT)).toBe(true);
    });
    /**
     * @memberOf AuditSpec
     * @name Check single audit session
     * @description
     * The user audits several high and low level fields and
     * checks that single audit session was created in DB.
     * @author dshundrina
     * @since 2021-06-09
     * @version 2021-06-09
     * @link https://rm.fxcompared.com/issues/15157
     */
    [true, false].forEach(isValid => {
        test(`Check single audit session where fields are marked as isValid=${isValid}`, async () => {
            const fields = [
                {
                    name: DBFields.GDP_GROWTH,
                    value: isValid ? '' : randomFromInterval(2, 15),
                    valid: isValid
                },
                {
                    name: DBFields.AMOUNT,
                    value: isValid ? '' : randomFromInterval(5500, 5700),
                    parent: DBFields.CONSUMER_MARGINS,
                    valid: isValid
                }
            ];
            const curDoc = await mongoDBRequest(collectionName, {RecordId: 1});
            const rowId = curDoc.CurrentState[DBFields.CONSUMER_MARGINS][0]._id.toString();
            const params = {
                recordId: 1,
                changedValues: {},
                audit_info: {UserName: process.env.DV_USER, ConfidenceScore: null, NoteOnConfidenceScore: null},
                collectionName
            };
            fields.forEach(field => {
                if ("parent" in field) {
                    params.changedValues[field.parent] = {
                        [rowId]: {
                            [field.name]: {
                                value: field.value,
                                valid: isValid
                            }
                        }
                    }
                } else {
                    params.changedValues[field.name] = {
                        value: field.value,
                        valid: field.valid
                    }
                }
            });
            const apiResp = await postApiCall(global.agent, ApiEndPoints.SAVE_DATA, params, global.cookies);
            expect(apiResp.body.success).toBe(true);
            const changedRecord = await mongoDBRequest(collectionName, {RecordId: 1});
            const prevAuditSessionsLength = "AuditSessions" in curDoc ? curDoc.AuditSessions.length : 0;
            const AuditValueArray = changedRecord.AuditSessions[changedRecord.AuditSessions.length - 1].AuditValueArray;
            expect(AuditValueArray.length).toBe(fields.length);
            fields.forEach(field => {
                const fieldName = "parent" in field ? `${field.parent}.${rowId}.${field.name}` : field.name;
                const filtered = AuditValueArray.filter(el => el.AuditFieldName === fieldName)[0];
                if ("parent" in field) {
                    expect(filtered.OldValue).toBe(curDoc.CurrentState[field.parent][0][field.name]);
                } else {
                    expect(filtered.OldValue).toBe(curDoc.CurrentState[field.name]);
                }
                if (isValid) {
                    if ("parent" in field) {
                        expect(changedRecord.CurrentState[field.parent][0][field.name]).toEqual(curDoc.CurrentState[field.parent][0][field.name]);
                    } else {
                        expect(changedRecord.CurrentState[field.name]).toEqual(curDoc.CurrentState[field.name]);
                    }
                    expect(filtered.NewValue).toBe(filtered.OldValue);
                } else {
                    if ("parent" in field) {
                        expect(changedRecord.CurrentState[field.parent][0][field.name]).toEqual(field.value);
                    } else {
                        expect(changedRecord.CurrentState[field.name]).toEqual(field.value);
                    }
                    expect(filtered.NewValue).toBe(field.value);
                }
                expect(filtered.Valid).toBe(field.valid);
            });
            expect(changedRecord.AuditState.AuditNumber).toEqual(curDoc.AuditState.AuditNumber + 1);
            expect(prevAuditSessionsLength + 1).toEqual(changedRecord.AuditSessions.length);
            expect(changedRecord.AuditSessions[prevAuditSessionsLength]);
        });
    });
    /**@memberOf AuditSpec
     * @name Check copy record
     * @description
     * The user selects number of documents.
     * The user goes to one of the documents.
     * The user clicks on copy btn.
     * Check that a user is redirected to the newly created record.
     * @author dshundrina
     * @since 2021-06-16
     * @version 2021-06-16
     * @link https://rm.fxcompared.com/issues/15157
     */
    test('Check copy record', async () => {
        await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor: collectionName}, UPDATE_ONE, null,
            {$set: {AllowCopyFunction: true}});
        const records = await mongoDBRequest(collectionName, {}, FIND);
        const lastRecordId = records[records.length - 1].RecordId;
        const lastRecord = await mongoDBRequest(collectionName, {RecordId: lastRecordId});
        const params = {
            recordID: lastRecordId,
            collectionName: collectionName,
            UserName: process.env.DV_USER
        };
        const copyRecord = await postApiCall(global.agent, ApiEndPoints.COPY, params, global.cookies);
        console.log('Api response: ', copyRecord.body);
        expect(copyRecord.body.success).toBe(true);
        const newLastRecord = await mongoDBRequest(collectionName, {RecordId: copyRecord.body.recordID});
        console.log('copies record: ', newLastRecord);
        console.log('prev record: ', lastRecord);
        for (const obj of [newLastRecord, lastRecord]) {
            delete obj.CurrentState.CopyOfRecordId;
            delete obj._id;
            delete obj.CurrentState.IsDuplicate;
            delete obj.CurrentState.AuditNumber;
            obj.CurrentState.ConsumerMargins.forEach(el => {
                delete el._id;
            });
            obj.CurrentState.CommercialMargins.forEach(el => {
                delete el._id;
            });
        }
        expect(_.isEqual(lastRecord.CurrentState, newLastRecord.CurrentState)).toBe(true);
        await mongoDBRequest(collectionName, {RecordId: lastRecordId + 1}, DELETE_ONE);
    });
});