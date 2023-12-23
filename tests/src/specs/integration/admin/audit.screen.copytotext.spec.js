import {CONFIGURATION, UPDATE_ONE, WB_COLLECTION_TRACKING_FOR_TESTING} from '../../../utils/db.params';
import {getApiCall, mongoDBRequest, putApiCall} from '@fxc/ui-test-framework';
import {ApiEndPoints} from '../../../utils/end.points';


const collectionName = WB_COLLECTION_TRACKING_FOR_TESTING;

/**
 * @namespace CopyToTextForAuditScreenConfiguration
 */
describe('API-check of CopyToText feature for audit screen configuration', () => {
    /**
     * @memberOf CopyToTextForAuditScreenConfiguration
     * @name Custom text representation of data in record
     * @description
     * The Admin tries to configure a way of text representation of data to display in record.
     * This creates a block of text that summarizes the record.
     *
     * Check that collection configuration can be updated with CopyToText parameter
     * and then retrieved from the DB.
     * @link https://rm.fxcompared.com/issues/15224
     */
    test('Test-15224-Admin updates config with CopyToText parameter', async () => {

        const collectionConfig = await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor: collectionName})
        const currentCopyToTextConfig = collectionConfig.CopyToText;

        const url = `/configurations/collections/${collectionName}/update`;  //backend

        const urlParams = {
            name: collectionName,
            email: process.env.DV_USER
        };

        const data = {
            mainFunction: '{\n' +
                '  var text=\'We would like you to collect data for \\n\';\n' +
                '  text += \'Firm: \' + data[\'firm\'] + \'\\n\';\n' +
                '  text += \'From country: \' + data[\'source_code\'] + \'\\n\';\n' +
                '  text += \'From currency: \' + data[\'source_ccy\'] + \'\\n\';\n' +
                '  text += \'\\n\';\n' +
                '  text += \'And a variety of receiving countries with different payin & pickup methods as well as access points \\n\\n\'\n' +
                '  return text;\n}',
            TableCopy: {
                collection_table: {
                    value: '{\n\n' +
                        '  const urlEncode = function(url) {\n' +
                        '        var i = 0, _length = url ? url.length : 0;\n' +
                        '        for (i; i<_length; i++){\n' +
                        '        url = url.replace(" ", "%20");\n' +
                        '        }\n' +
                        '        return url;\n' +
                        '  };\n' +
                        '  var text=\'\';\n' +
                        '  data.forEach(row=>{\n' +
                        '  \n' +
                        '    if (row[\'Scraped Data Available\'] === false){ \n' +
                        '    text += \'Destination: \' + row[\'destination_name\'] + \'     |     \'; \n' +
                        '    text += \'Payin: \' + row[\'payment_instrument\'] + \'     |     \'; \n' +
                        '    text += \'Access point: \' + row[\'access_point\'] + \'     |     \'; \n' +
                        '    text += \'Pickup: \' + row[\'pickup_method\'] + \'\\n\\n\'; \n' +
                        '    \n' +
                        '    if(row[\'Survey Link\'] === null) \n' +
                        '     {throw \'\\n\\nPlease ensure all the Survey Link fields are complete\' };\n' +
                        '    \n' +
                        '    text += \'Survey link: \' + urlEncode(row[\'Survey Link\']) + \'\\n\\n\'; \n' +
                        '    text += \'\\n\';\n    }\n  });\n  \n  return text;\n}',
                    fields: [
                        'destination_name',
                        'payment_instrument',
                        'pickup_method',
                        'access_point',
                        'Survey Link',
                        'Scraped Data Available'
                    ]
                }
            },
            fields: [
                'source_name',
                'WB_firm_type',
                'source_code',
                'fxc_id',
                'source_ccy',
                'firm'
            ],
            enabled: true
        }

        const payload = {
            activeCollection: collectionName,
            field: 'CopyToText',
            user_type: 'internal',
            data
        }

        const updateResponse = await putApiCall(global.agent, url, payload, global.cookies);

        expect(updateResponse.statusCode).toBe(200);
        expect(updateResponse.body.data.CopyToText).toEqual(data);

        const getResponse = await getApiCall(global.agent, ApiEndPoints.FETCH_CONFIG, urlParams, global.cookies);

        expect(getResponse.body.success).toBe(true);
        expect(getResponse.body.config.CopyToText).toEqual(data);

        await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor: collectionName}, UPDATE_ONE, null,
            {$set: {CopyToText: currentCopyToTextConfig}});
    });
});