/**
 * @namespace ApiCheckSpec
 */
import {CONFIGURATION, TESTING_HALINA} from "../../utils/db.params";
import {getApiCall, mongoDBRequest} from "@fxc/ui-test-framework";
import {ApiEndPoints} from "../../utils/end.points";

/**
 * @memberOf ApiCheckSpec
 * @name Check api method fetchConfig
 * @description
 * Check api method fetchConfig (when going to any record).
 * Check it's same as in db
 * @since 2021-06-25
 * @version 2021-06-25
 * @author dshundrina
 * @link https://rm.fxcompared.com/issues/15157
 */
test('Check api method fetchConfig', async () => {
    const name = TESTING_HALINA;
    const collectionName = CONFIGURATION;
    const resp = await getApiCall(global.agent, ApiEndPoints.FETCH_CONFIG, {
        email: process.env.DV_USER,
        name
    }, global.cookies);
    expect(resp.body.success).toBe(true);
    const dbResp = await mongoDBRequest(collectionName, {CollectionRelevantFor: name});
    expect(resp.body.collectionName).toEqual(dbResp.CollectionRelevantFor);
    expect(resp.body.config.DefaultFieldsToDisplayInAuditSession).toEqual(dbResp.DefaultFieldsToDisplayInAuditSession);
});