import {recreateCollection} from '../../../utils/db.utils';
import {
    AGGREGATE,
    CONFIGURATION,
    FIND,
    FIND_ONE,
    GLOB_TEST_WITH_EXC,
    GLOB_TEST_WITH_EXC_FOR_APP,
    IMTI_V_95,
    IMTI_V_95_PRISTINE,
    INITIATE_BULK_UPD
} from '../../../utils/db.params';
import {mongoDBRequest, postApiCall} from '@fxc/ui-test-framework';
import _ from 'lodash';
import {ApiEndPoints} from '../../../utils/end.points';

let apiResp;

/**
 * @namespace GlobalUpdates
 */
describe('Check global updates', () => {
    beforeAll(async () => {
        // propagate test data
        for (const col of [GLOB_TEST_WITH_EXC, GLOB_TEST_WITH_EXC_FOR_APP]) {
            await recreateCollection(col, {refCol: IMTI_V_95_PRISTINE, refConfig: IMTI_V_95});
        }
    });
    /**
     * @memberOf GlobalUpdates
     * @name Check global update made by script
     * @description
     * Run global updates for all the collection
     * with application.
     * Run global updates for all the collection
     * with script taken from db.
     * Compare that results are the same for both collections.
     * (Collections are equal as been repopulated from same reference collection)
     * @author halina.hulidava
     * @since 2021-04-01
     * @version 2021-06-03
     */
    test('Run script update', async () => {
        const resp = await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor: GLOB_TEST_WITH_EXC_FOR_APP}, FIND_ONE);
        console.log('starting script update');
        for (const item of resp.global_automatic_updates) {
            const toBeUpd = []
            const f = new Function(['CurrentState', 'aggr_result'], item.update_function);
            const aggrData = await mongoDBRequest(GLOB_TEST_WITH_EXC_FOR_APP, eval(item.aggregation_pipeline), AGGREGATE);
            const allRecords = await mongoDBRequest(GLOB_TEST_WITH_EXC_FOR_APP, {}, FIND);
            for (const el of aggrData) {
                let arrToCompare = [];
                for (const field of item.matching_fields) {
                    if (el.hasOwnProperty(field)) {
                        const obj = {}
                        obj[field] = el[field]
                        arrToCompare.push(obj);
                    }
                }
                const reduced = Object.assign({}, ...arrToCompare);
                for (const rec of allRecords) {
                    const matched = _.isMatch(rec.CurrentState, reduced);
                    if (matched) {
                        const newState = f(rec.CurrentState, el);
                        let obj = {req: {RecordId: rec.RecordId}, upd: newState}
                        toBeUpd.push(obj);
                    }
                }
            }
            await mongoDBRequest(GLOB_TEST_WITH_EXC_FOR_APP, toBeUpd, INITIATE_BULK_UPD);
        }
        console.log('finished script update');
    });
    test('Run app update', async () => {
        const params = {
            collectionName: GLOB_TEST_WITH_EXC,
            recordId: -1,
            audit_info: {UserName: process.env.HOST},
            host: process.env.HOST
        }
        console.log('starting app update');
        apiResp = await postApiCall(global.agent, ApiEndPoints.GLOBAL_UPDATE_ALL, params, global.cookies);
        console.log('finished app update');
        expect(apiResp.body.success).toBe(true);
    });
    test('compare results', async () => {
        const updApp = await mongoDBRequest(GLOB_TEST_WITH_EXC, {}, FIND);
        const updScript = await mongoDBRequest(GLOB_TEST_WITH_EXC_FOR_APP, {}, FIND);
        const recordIds = updScript.map(item => item.RecordId);
        for (const rec of recordIds) {
            const appItem = updApp.filter(item => item.RecordId === rec);
            const scriptItem = updScript.filter(item => item.RecordId === rec);
            [appItem[0], scriptItem[0]].forEach(item => {
                for (const field of ['matched_data1', 'matched_data2', 'matched_data3', 'update_doc1', 'update_doc2', 'update_doc3']) {
                    if (field in item.CurrentState) {
                        delete item.CurrentState[field]
                    }
                }
            });
            expect(scriptItem.CurrentState).toEqual(appItem.CurrentState);
        }
    });
});