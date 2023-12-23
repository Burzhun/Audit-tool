import {mongoDBRequest, postApiCall} from '@fxc/ui-test-framework';
import {recreateConfig} from '../../utils/db.utils';
import {CONFIGURATION, TESTING_HALINA, TESTING_HALINA_REFERENCE, UPDATE_ONE} from '../../utils/db.params';
import {ApiEndPoints} from '../../utils/end.points';

const collectionName = TESTING_HALINA

/**
 * @namespace DashboardSpec
 */

describe('Dashboard spec', () => {
    beforeEach(async () => {
        await recreateConfig(collectionName, {
            refConfig: TESTING_HALINA_REFERENCE
        })
    });

    const recordId = 0;
    const textArrayToTest = ['FirstName/LastName', 'Sarah O\'Connor', 'Me?', 'Big:Ben'];
    const searchField = 'ResearcherName';

    //todo: It was discussed to add a case of searching with the '?'-symbol included in a search query, e.g. "me?"
    ['e/l', 'h o', 'o\'c', 'g:b'].forEach(searchPhrase => {
        test(`Search the phrase="${searchPhrase}" within fields of text_array datatype`, async () => {
            /**
             * @name 15173 Search collection record by phrase within fields of text_array datatype
             * @description User enters case-insensitive phrase on Dashboard page against selected field
             * of text_array datatype and search operator is set to Equal(==).
             * Check that user can find collection record by only valid partial case-insensitive phrase
             * @param searchPhrase
             * @memberOf DashboardSpec
             * @author @halina.hulidava
             * @since 2021-04-22
             * @version 2021-06-02
             */
            const curDocument = await postApiCall(global.agent, ApiEndPoints.GET_RECORD, {
                value: recordId,
                collectionName
            }, global.cookies)
            const curState = JSON.parse(curDocument.text).data[0].CurrentState.ResearcherName;

            await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor: collectionName}, UPDATE_ONE, null,
                {$pull: {Validators: {'name': searchField}}});
            await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor: collectionName}, UPDATE_ONE, null,
                {$push: {Validators: {'name': searchField, 'type': 'text_array', 'constraints': {}}}});

            //todo: change all ResearcherName field values before the test from text to a text_array

            // await mongoDBRequest(collectionName, {RecordId: recordId}, UPDATE_MANY, null,
            //     {$set: {"CurrentState.ResearcherName": textArrayToTest}});

            await mongoDBRequest(collectionName, {RecordId: recordId}, UPDATE_ONE, null,
                {$set: {'CurrentState.ResearcherName': textArrayToTest}});

            const params = {
                collectionName,
                filters: [{
                    value: searchPhrase,
                    secondValue: '',
                    selectedField: `CurrentState.${searchField}`,
                    operator: '='
                }],
                sorting_data: false,
                page_number: 1,
                page_size: 20
            };

            try {
                const fetchResp = await postApiCall(global.agent, ApiEndPoints.FETCH_DATA, params, global.cookies);
                expect(fetchResp.body.success).toBe(true);

                const searchData = fetchResp.body.data;
                expect(searchData.length).toBeGreaterThan(0);
                const matchedData = searchData.map(el => el.CurrentState[searchField]);

                matchedData.forEach(el => {
                    if (typeof el === 'string') {
                        expect(el.toLowerCase()).toContain(searchPhrase.toLowerCase());
                    } else {
                        expect(el.filter(a => a.toLowerCase().includes(searchPhrase.toLowerCase())).length).toBeGreaterThan(0);
                    }
                });
            } catch (err) {
                expect(err).toBe(null);
            }

            await mongoDBRequest(collectionName, {RecordId: recordId}, UPDATE_ONE, null,
                {$set: {'CurrentState.ResearcherName': curState}});
        });
    });
})