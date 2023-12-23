/**
 * @namespace CheckApiCall
 */


import {GLOB_TEST_WITH_EXC_FOR_APP, IMTI_V_95, IMTI_V_95_PRISTINE, UPDATE_ONE} from "../../utils/db.params";
import {recreateRecord} from "../../utils/db.utils";
import {mongoDBRequest, postApiCall} from "@fxc/ui-test-framework";
import {ApiEndPoints} from "../../utils/end.points";

/**
 * @memberOf CheckApiCall
 * @name Check Api Call
 * @description
 * The user goes on form.
 * The user sets new values for the fields
 * that influences recalculation for interbank rates.
 * Check that values are being recalculated
 * @author kbakhchedzhy
 * @since 2021-07-14
 * @version 2021-07-14
 * @link https://rm.fxcompared.com/issues/16527
 */

test('Check Api Call', async () => {
    const collectionName = GLOB_TEST_WITH_EXC_FOR_APP;
    const recordId = 11451;
    await recreateRecord(collectionName, recordId, {refCol: IMTI_V_95_PRISTINE, refConfig: IMTI_V_95});
    await mongoDBRequest(collectionName, {RecordId: recordId}, UPDATE_ONE, null,
        {$set: {'CurrentState.currency_from': "USD", 'CurrentState.currency_to': "GBP"}});

    const params = {
        audit_info: {
            UserName: process.env.DV_USER,
            ConfidenceScore: 3
        },
        changedValues: {
            currency_to: {
                value: "USD",
                valid: false
            }
        },
        collectionName,
        recordId
    };

    const resp = await postApiCall(global.agent, ApiEndPoints.SAVE_DATA, params, global.cookies);
    expect(resp.body.success).toBe(true);

    const record = await mongoDBRequest(collectionName, {RecordId: recordId});
    const valueInterbankRate = record.CurrentState.amounts_and_rates[0].interbank_rate;

    expect(valueInterbankRate).toEqual(1);

    params.changedValues = {
        currency_from: {
            value: "GBP",
            valid: false
        }
    };

    const newResp = await postApiCall(global.agent, ApiEndPoints.SAVE_DATA, params, global.cookies);
    expect(newResp.body.success).toBe(true);

    const newRecord = await mongoDBRequest(collectionName, {RecordId: recordId});
    expect(newRecord.CurrentState.amounts_and_rates[0].interbank_rate).not.toEqual(valueInterbankRate);

});