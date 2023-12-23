import {CONFIGURATION, UPDATE_ONE, WB_COLLECTION_TRACKING_FOR_TESTING} from '../../../utils/db.params';
import {getApiCall, mongoDBRequest, putApiCall} from '@fxc/ui-test-framework';
import {ApiEndPoints} from '../../../utils/end.points';

const collectionName = WB_COLLECTION_TRACKING_FOR_TESTING;

/**
 * @namespace TableSettingsForAuditScreenConfiguration
 */
describe('API-check of TableSettings feature for audit screen configuration', () => {
    /**
     * @memberOf TableSettingsForAuditScreenConfiguration
     * @name Add configuration to allow/disallow add or remove rows in flat table
     * @description
     * The Admin tries to configure TableSettings for Audit screen to allow/disallow add or remove rows in table.
     *
     * Check that collection configuration can be updated with TableSettings parameter
     * and then retrieved from the DB.
     * @author Constantine Gordienko
     * @link https://rm.fxcompared.com/issues/15968
     * @since 2021-06-02
     * @version 2021-06-03
     */
    test('Test-15968-Admin updates config with TableSettings parameter', async () => {

        const collectionConfig = await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor: collectionName})
        const currentConfig = collectionConfig.TableSettings;

        const url = `/configurations/collections/${collectionName}/update`;  //backend

        const urlParams = {
            name: collectionName,
            email: process.env.DV_USER
        };

        const data = [
            {
                'name': 'collection_table',
                'add': true,
                'remove': false
            }
        ]

        const payload = {
            activeCollection: collectionName,
            field: 'TableSettings',
            user_type: 'internal',
            data
        }

        const updateResponse = await putApiCall(global.agent, url, payload, global.cookies);

        expect(updateResponse.statusCode).toBe(200);
        expect(updateResponse.body.data.TableSettings).toEqual(data);

        const getResponse = await getApiCall(global.agent, ApiEndPoints.FETCH_CONFIG, urlParams, global.cookies);

        expect(getResponse.body.success).toBe(true);
        expect(getResponse.body.config.TableSettings).toEqual(data);

        await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor: collectionName}, UPDATE_ONE, null,
            {$set: {TableSettings: currentConfig}});
    });
});