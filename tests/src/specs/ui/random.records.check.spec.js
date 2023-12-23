/**
 * @namespace RandomRecordsCheckSpec
 */

import {ValidationPage} from "../../pages/website/ValidationPage";
import {UiEndPoints} from "../../utils/end.points";
import {mongoDBRequest} from "@fxc/ui-test-framework/utils/db.utils";
import {AGGREGATE} from "../../utils/db.params";


/**
 * @memberOf RandomRecordsCheckSpec
 * @name Random record from each collection check
 * @description
 * User gets all collections from db and goes to random record.
 * User checks if the record is present.
 * @author dshundrina
 * @since 2021-09-16
 * @version 2021-09-16
 */
test("Random record from each collection check", async () => {
    const validation = new ValidationPage();
    const collectionsList = [
        "CardTransactions",
        "ClientIssuerMatching",
        "FxFeesWB",
        "FxPricing",
        "FxRatesWB",
        "FxStableFees",
        "IssuerCards",
        "ResearcherDirectory",
        "ServiceActiveWB",
        "wb_collection_tracking",
        "testing_halina",
    ]

    const errors = [];
    for (const collection of collectionsList) {
        const record = await mongoDBRequest(collection, [{ $sample: { size: 1 } }], AGGREGATE);
        await validation.goToPage(UiEndPoints.goToDetailsUrl(collection, record[0].RecordId));
        if (await validation.checkSaveButton() == false) {
            errors.push(`No btn for collection ${collection}`)
        }
    }
    expect(errors).toEqual([]);
});