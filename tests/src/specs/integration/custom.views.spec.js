import {
    CONFIGURATION,
    DELETE_ONE,
    FIND_ONE,
    TESTING_HALINA,
    TESTING_HALINA_REFERENCE,
    USER_CUSTOM_CONFIGURATIONS
} from '../../utils/db.params';
import {getApiCall, mongoDBRequest, postApiCall} from '@fxc/ui-test-framework';
import {recreateConfig} from '../../utils/db.utils';
import {ApiEndPoints} from '../../utils/end.points';


const collectionName = TESTING_HALINA;

/**
 * @namespace CustomViews
 */
describe('API-check of a custom view setup', () => {
    beforeEach(async () => {
        await recreateConfig(collectionName, {refConfig: TESTING_HALINA_REFERENCE});
    });
    /**
     * @memberOf CustomViews
     * @name 15147 User-defined custom views of datasets (override default config)
     * @description
     * The user tries to save their view of any given dataset.
     * It should work for Search result view and for Audit session view
     * Check that user's view settings can be saved and retrieved in(from) the DB
     * @link https://rm.fxcompared.com/issues/15147
     * @author halina.hulidava
     * @since 2021-05-20
     * @version 2021-06-18
     */
    ['DefaultFieldsToDisplayInSearchResultView', 'DefaultFieldsToDisplayInAuditSession'].forEach(fieldsToDisplayIn => {
        test(`Test-15147-User overrides default config to have a custom view in ${fieldsToDisplayIn.substr(24)}`,
            async () => {

                let dbRequestParams = {CollectionRelevantFor: collectionName, RegisteredUserEmail: process.env.DV_USER};
                await mongoDBRequest(USER_CUSTOM_CONFIGURATIONS, dbRequestParams, DELETE_ONE);

                let dbSearchResponse = await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor: collectionName});
                let fieldsToDisplayInCustomView = dbSearchResponse.SearchFieldNames;
                fieldsToDisplayInCustomView.splice(7, 1);

                const urlParams = {
                    name: collectionName,
                    email: process.env.DV_USER
                };
                const payload = {
                    email: process.env.DV_USER,
                    collectionName: collectionName,
                    data: {
                        [fieldsToDisplayIn]: fieldsToDisplayInCustomView
                    }
                };

                try {
                    const saveResponse = await postApiCall(global.agent, ApiEndPoints.SET_USER_CONFIG, payload, global.cookies);
                    expect(saveResponse.body.success).toBe(true);

                    dbSearchResponse = await mongoDBRequest(USER_CUSTOM_CONFIGURATIONS, dbRequestParams, FIND_ONE);
                    expect(dbSearchResponse[fieldsToDisplayIn]).toEqual(fieldsToDisplayInCustomView);

                    const getResponse = await getApiCall(global.agent, ApiEndPoints.FETCH_CONFIG, urlParams, global.cookies);
                    expect(getResponse.body.success).toBe(true);
                    expect(getResponse.body.customConfig.CollectionRelevantFor).toEqual(TESTING_HALINA);
                    expect(getResponse.body.customConfig.RegisteredUserEmail).toEqual(process.env.DV_USER);
                    expect(getResponse.body.customConfig[fieldsToDisplayIn]).toEqual(fieldsToDisplayInCustomView);
                } catch (err) {
                    console.log(err);
                    expect(err).toBe(null);
                }
            });
    })
});