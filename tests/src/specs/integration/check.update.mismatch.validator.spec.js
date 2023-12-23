/**
 * @namespace CheckUpdateMismatchValidator
 */

import {CONFIGURATION, TESTING_HALINA, TESTING_HALINA_REFERENCE, UPDATE_ONE} from "../../utils/db.params";
import {recreateRecord} from "../../utils/db.utils";
import {mongoDBRequest, postApiCall} from "@fxc/ui-test-framework";
import {ApiEndPoints} from "../../utils/end.points";
import {AlertTexts} from "../../utils/texts";

/**
 * @memberOf CheckUpdateMismatchValidator
 * @name Check Update Mismatch Validator
 * @description
 * The user audits fields and sets new value
 * that cause update pipeline. New value for updated
 * field does not match validator.
 * Check that document is not updated
 * due to inconsistent data.
 * @author kbakhchedzhy
 * @since 2021-07-15
 * @version 2021-07-15
 * @link https://rm.fxcompared.com/issues/16527
 */


test('Check Update Mismatch Validator', async () => {
    const collectionName = TESTING_HALINA;
    const recordId = 27;
    await recreateRecord(collectionName, recordId, {
        refCol: TESTING_HALINA_REFERENCE,
        refConfig: TESTING_HALINA_REFERENCE
    });

    await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor: collectionName}, UPDATE_ONE, null,
        {
            $push: {
                update_logics: {
                    dependency_fields: [
                        "currency_from",
                        "currency_to"
                    ],
                    update_logic: "{return CurrentState['currency_from'] + CurrentState['currency_to']}",
                    updated_field: "collection_id"
                }
            }
        });

    const record = await mongoDBRequest(collectionName, {RecordId: recordId});
    const id = record.CurrentState.ConsumerMargins[0]._id;

    const params = {
        audit_info: {
            UserName: process.env.DV_USER,
            ConfidenceScore: 3
        },
        changedValues: {
            ConsumerMargins: {
                [id]: {
                    ib_rate: {
                        value: "0.2",
                        valid: false
                    }
                }
            }
        },
        collectionName,
        recordId
    };

    const resp = await postApiCall(global.agent, ApiEndPoints.SAVE_DATA, params, global.cookies);
    const alertText = 'Not satisfied for constraint positive = true for field ConsumerMargins.full_cost'

    expect(resp.body.success).toBe(false);
    expect(resp.body.not_updated_fields).toContain(alertText);


    params.changedValues = {
        currency_from: {
            value: "JPY",
            valid: false
        }
    };

    const respDependencyFiles = await postApiCall(global.agent, ApiEndPoints.SAVE_DATA, params, global.cookies);

    expect(respDependencyFiles.body.success).toBe(false);
    expect(respDependencyFiles.body.not_updated_fields).toContain(AlertTexts.INCONSISTENT_CONFIGURATION);

    await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor: collectionName}, UPDATE_ONE, null,
        {
            $pull: {
                UPDATE_LOGICS: {
                    "dependency_fields": [
                        "currency_from",
                        "currency_to"
                    ],
                    "update_logic": "{return CurrentState['currency_from'] + CurrentState['currency_to']}",
                    "updated_field": "collection_id"
                }
            }
        });
});