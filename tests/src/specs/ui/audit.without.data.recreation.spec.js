import {ValidationPage} from "../../pages/website/ValidationPage";
import {UiEndPoints} from "../../utils/end.points";
import {DBFields, TEST_FX_FEE_0_3} from "../../utils/db.params";

const auditPage = new ValidationPage();

/**
 * @namespace auditSpecWithoutDataRecreation
 */
describe('Audit tests without data recreation', () => {
    /**
     * @memberOf auditSpecWithoutDataRecreation
     * @author halina.hulidava
     * @since 2021-06-28
     * @version 2021-06-28
     * @name Enumerated array feature - modify Audit Screen input functionality
     * @description
     * The user audits field from Enumerated array and checks that
     * primary value was not removed from the dropdown list
     * and is visible for the user when set field as invalid
     * @link https://rm.fxcompared.com/issues/16101
     */
    test(`Enumerated array feature - modify Audit Screen input functionality`, async () => {
        const collectionName = TEST_FX_FEE_0_3;
        const recordId = 1;
        await auditPage.goToPage(UiEndPoints.goToDetailsUrl(collectionName, recordId));
        await auditPage.remove_fixed_elements();
        const fieldToValidate = {
            name: "fees.Countries To",
            [DBFields.NEW_VALUE]: null,
            [DBFields.VALID]: false,
            [DBFields.TYPE]: DBFields.ENUM
        }
        await auditPage.auditField(fieldToValidate);
        expect(await auditPage.getUpdatedValuesForEnumArrayField(fieldToValidate.name, false))
            .toEqual(await auditPage.getUpdatedValuesForEnumArrayField(fieldToValidate.name, true));
    });
});