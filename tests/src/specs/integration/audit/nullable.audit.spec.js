import {CONFIGURATION, TESTING_HALINA, TESTING_HALINA_REFERENCE, UPDATE_ONE} from '../../../utils/db.params';
import {mongoDBRequest, postApiCall} from '@fxc/ui-test-framework';
import {recreateCollection} from '../../../utils/db.utils';
import {ApiEndPoints} from '../../../utils/end.points';

const collectionName = TESTING_HALINA;

/**
 * @namespace AuditSpec
 */
describe('Audit api check', () => {
    beforeAll(async () => {
        await recreateCollection(collectionName, {
            refCol: TESTING_HALINA_REFERENCE,
            refConfig: TESTING_HALINA_REFERENCE
        })
    });
    /**
     * @memberOf AuditSpec
     * @name Check nullable
     * @description
     * The user tries to set up nulls for various
     * fields types (text, numeric, etc).
     * Check both for high and low level fields
     * @author halina.hulidava
     * @since 2021-04-08
     * @version 2021-06-03
     */
    [{
        name: 'Author',
    },
        // Non set low level field
        {
            name: 'org_name',
            parent: 'ConsumerMargins',
            type: 'text'
        },
        // Text high level field
        {
            name: 'ResearcherName',
            type: 'text'
        },
        // Numeric high level field
        {
            name: 'number_of_lakes',
        },
        // Numeric low level field
        {
            name: 'number_of_providers',
            parent: 'ConsumerMargins',
        },
        // Enum high level field
        {
            name: 'language',
            newValuePass: true,
        },
        // Enum low level field
        {
            name: 'is_consumer',
            parent: 'ConsumerMargins',
        },
        // Nullable false:
        {
            name: 'currency_from',
        },
        {
            name: 'fx_rate',
            parent: 'ConsumerMargins',
        },
        {
            name: 'timestamp',
            parent: 'ConsumerMargins',
        },
        {
            name: 'CollectedDate',
        }].forEach(item => {
        test(`Check nullable for nullable=true and ${item.name}`, async () => {
            await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor: collectionName}, UPDATE_ONE, null,
                {$pull: {Validators: {name: item.name}}});
            const recordId = 5;
            const curDoc = await mongoDBRequest(collectionName, {RecordId: recordId});
            const params = {
                recordId,
                changedValues: {},
                audit_info: {UserName: process.env.DV_USER, ConfidenceScore: null, NoteOnConfidenceScore: null},
                collectionName
            }
            if ('parent' in item) {
                const rowId = curDoc.CurrentState[item.parent][0]._id.toString();
                params.changedValues[item.parent] = {
                    [rowId]: {
                        [item.name]: {
                            value: null,
                            valid: false
                        }
                    }
                }
            } else {
                params.changedValues[item.name] = {value: null, valid: false}
            }
            const apiResp = await postApiCall(global.agent, ApiEndPoints.SAVE_DATA, params, global.cookies);
            expect(apiResp.body.success).toBe(true);
            const changedRecord = await mongoDBRequest(collectionName, {RecordId: recordId});
            const expectedValue = null;
            if ('parent' in item) {
                expect(changedRecord.CurrentState[item.parent][0][item.name]).toBe(expectedValue);
            } else {
                expect(changedRecord.CurrentState[item.name]).toBe(expectedValue);
            }
        });
    });
});