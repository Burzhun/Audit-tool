import {FIND, TEST_FX_FEE_0_3} from "../../../utils/db.params";
import {ApiEndPoints} from "../../../utils/end.points";
import {mongoDBRequest, postApiCall} from "@fxc/ui-test-framework";

/**
 * @namespace ConfidenceScoreSpec
 */
/**
 * @memberOf ConfidenceScoreSpec
 * @name Confidence score displaying check
 * @description
 * Check that the confidence score is displaying correctly to
 * what is in the database and indicated within the record itself.
 * @author dshundrina
 * @since 2021-06-22
 * @version 2021-06-22
 * @link https://rm.fxcompared.com/issues/16171
 */
test('Confidence score displaying check', async () => {
    const collectionName = TEST_FX_FEE_0_3
    const resp = await postApiCall(global.agent, ApiEndPoints.FETCH_DATA, {
        collectionName : collectionName,
        filters: [{
            value: "",
            secondValue: "",
            selectedField: "RecordId",
            operator: "="
        }],
        page_number: "",
        page_size: "",
        sorting_data: false
    }, global.cookies)
    const newDataArray = resp.body.data.map(item => {
        return {
            RecordId: item.RecordId,
            ConfidenceScore: item.AuditState.ConfidenceScore
        }
    });
    const curDoc = await mongoDBRequest(collectionName, {}, FIND);
    const curDocData = curDoc.map(item => {
            return {
                RecordId: item.RecordId,
                ConfidenceScore: item.AuditState.ConfidenceScore
            }
        });
    expect(newDataArray).toEqual(curDocData);
});
