/**
 * @namespace SearchOperatorInSpec
 */
import {FIND, TESTING_HALINA} from "../../../utils/db.params";
import {ApiEndPoints} from "../../../utils/end.points";
import {mongoDBRequest, postApiCall} from "@fxc/ui-test-framework";
import _ from 'lodash';


/**
 * @memberOf SearchOperatorInSpec
 * @name Search operator in check
 * @description
 * Searching RecordId in 1,2,3
 * Check if API response and db response are similar
 * @author dshundrina
 * @since 2021-06-24
 * @version 2021-06-24
 * @link https://rm.fxcompared.com/issues/16198
 */
test('Search operator in check', async () => {
    const collectionName = TESTING_HALINA;
    const recordIds = [1, 2, 3];
    const resp = await postApiCall(global.agent, ApiEndPoints.FETCH_DATA, {
        collectionName: collectionName,
        filters: [{
            value: `${recordIds.join(',')}`,
            secondValue: "",
            selectedField: "RecordId",
            operator: "in"
        }],
        page_number: "",
        page_size: "",
        sorting_data: false
    }, global.cookies);
    expect(resp.body.success).toBe(true);
    const dbArray = await mongoDBRequest(collectionName, {RecordId: {$in: recordIds}}, FIND);
    expect(_.isEqual(resp.body.data.map(el => el.RecordId), dbArray.map(el => el.RecordId))).toBe(true);
});