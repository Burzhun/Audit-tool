/**
 * @namespace ConfidenceScoreNoteSpec
 */
import {CONFIGURATION, TESTING_HALINA, UPDATE_ONE} from "../../utils/db.params";
import {mongoDBRequest, postApiCall} from "@fxc/ui-test-framework";
import {ApiEndPoints} from "../../utils/end.points";
import faker from 'faker';

/**
 * @memberOf ConfidenceScoreNoteSpec
 * @name Confidence score note and confidence score updating check
 * @description
 * Check that the confidence score note
 * is always updating and confidence score is saving
 * @author dshundrina
 * @since 2021-06-23
 * @version 2021-06-23
 * @link https://rm.fxcompared.com/issues/16199
 */
test('Confidence score note and confidence score updating check', async () =>{
    const collectionName = TESTING_HALINA;
    const recordId = 1;
    const noteOnConfidenceScore = faker.lorem.sentence()
    await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor: collectionName}, UPDATE_ONE, null,
        {$set: {ConfidenceScoreRequired: false}});
    const resp = await postApiCall(global.agent, ApiEndPoints.SAVE_DATA, {
        recordId: recordId,
        collectionName: collectionName,
        changedValues: {},
        audit_info: {UserName: process.env.DV_USER, ConfidenceScore: -999, NoteOnConfidenceScore: noteOnConfidenceScore}
    }, global.cookies);
    expect(resp.body.success).toBe(true);
    const curDocAuditInfo = await mongoDBRequest(collectionName, {RecordId: recordId});
    expect(curDocAuditInfo.AuditState.NoteOnConfidenceScore).toBe(noteOnConfidenceScore);
    expect(curDocAuditInfo.AuditState.ConfidenceScore).toEqual(-999)
});