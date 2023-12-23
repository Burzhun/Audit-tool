/**
 * @namespace CollectedDateSpec
 */
import {GLOB_TEST_WITH_EXC_FOR_APP, IMTI_V_95, IMTI_V_95_PRISTINE} from "../../utils/db.params";
import {mongoDBRequest, postApiCall} from "@fxc/ui-test-framework";
import {ApiEndPoints} from "../../utils/end.points";
import superagent from 'superagent';
import _ from 'lodash';
import {recreateRecord} from "../../utils/db.utils";

/**
 * @memberOf CollectedDateSpec
 * @name Collected date in future
 * @description The user tries to set up date in
 * future and checks that notification
 * is displayed.
 * @author dshundrina
 * @since 2021-06-28
 * @version 2021-06-28
 * @link https://rm.fxcompared.com/issues/15157
 */
test('Collected date in future', async () => {
    const collectionName = GLOB_TEST_WITH_EXC_FOR_APP;
    const recordId = 9280;
    await recreateRecord(collectionName, recordId, {refCol: IMTI_V_95_PRISTINE, refConfig: IMTI_V_95});
    const record = await mongoDBRequest(collectionName, {RecordId:recordId});
    const id = record.CurrentState.amounts_and_rates[0]._id;
    const curYear = new Date().getFullYear();
    const dateFromFuture = `${curYear+1}-01-01T00:00:00Z`;
    const params = {
        audit_info: {
            UserName: process.env.DV_USER,
            ConfidenceScore: 3},
        changedValues: {
            amounts_and_rates: { [id]: {
                datetime_collected_utc: {
                        value: dateFromFuture,
                        valid: false
                    }
                }
            }
        },
        collectionName: collectionName,
        recordId: recordId
    };
    const resp = await postApiCall(global.agent, ApiEndPoints.SAVE_DATA, params, global.cookies);
    expect(resp.body.success).toBe(true);
    const newParams = {
        collectionName: collectionName,
        value: recordId
    }
    const updatedRecord = await postApiCall(global.agent, ApiEndPoints.GET_RECORD, newParams, global.cookies);
    const newRec = JSON.parse(updatedRecord.text).data[0];
    const url = newRec.CurrentState.amounts_and_rates[0].ib_api_url
    const agentOuter = superagent.agent();
    const newResp = await agentOuter.get(url).set(global.cookies);
    expect(newResp.body.currency_to_timestamp < dateFromFuture).toBe(true);
});

