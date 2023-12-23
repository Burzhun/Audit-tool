import {recreateRecord} from "../../utils/db.utils";
import moment from "moment";
import {
    CONFIGURATION,
    DBFields,
    GLOB_TEST_WITH_EXC_FOR_APP,
    IMTI_V_95,
    IMTI_V_95_PRISTINE
} from "../../utils/db.params";
import {UiEndPoints} from "../../utils/end.points";
import {ValidationPage} from "../../pages/website/ValidationPage";
import {DBParams, Params} from "../../utils/params";
import {convert24} from "../../utils/app.utils";
import {AlertTexts} from "../../utils/texts";
import {getApiCall, handleApiCallWasSent, mongoDBRequest} from "@fxc/ui-test-framework";

/**
 * @namespace AuditGlobalTestingWithExclusionsForAppSpec
 */
const collectionName = GLOB_TEST_WITH_EXC_FOR_APP;
const recordId = 445;
const validation = new ValidationPage();
const tableName = DBFields.AMOUNTS_AND_RATES;
const datetimeCollectedUTC = DBFields.DATETIME_COLLECTED_UTC;
describe('Audit global testing with exclusions for app', () => {
    beforeAll(async () => {
        await recreateRecord(collectionName, recordId, {refCol: IMTI_V_95_PRISTINE, refConfig: IMTI_V_95});
        await validation.goToPage(UiEndPoints.goToDetailsUrl(collectionName, recordId));
        await validation.remove_fixed_elements();
        await validation.clickDefault();
    });
    /**
     * @memberOf AuditGlobalTestingWithExclusionsForAppSpec
     * @name Check Datetime Picker Display
     * @description
     * The user goes on form and selects document.
     * The user audits field with datatype: datetime.
     * The user sets up only date.
     * Check that time is set by default to 00:00:00.
     * The user sets up time and checks that displayed time is exactly the same as user set up.
     * @author dshundrina
     * @since 2021-07-19
     * @version 2021-07-19
     */
    test('Check Datetime Picker Display', async () => {
        const errors = [];
        const setTime = "000000";
        const value = "20200501";
        const rowIds = await validation.get_all_ids_from_field_with_sub_ranges(tableName);
        const prevValue = await validation.get_cell_value_by_row_number_and_column_name(tableName, 1, datetimeCollectedUTC);
        const prevTime = prevValue.substr(prevValue.indexOf('T') + 1, 8)
        await validation.select_sub_table_row_by_id(rowIds[0]);
        const inputVal = setTime ? value + setTime : value;
        const commonVal = `${inputVal.slice(0, 4)}-${inputVal.slice(4, 6)}-${inputVal.slice(6, 8)}`
        const convertedVal = setTime ? `${commonVal} ${setTime.slice(0, 2)}:${setTime.slice(2, 4)}:${setTime.slice(4)}`
            : `${commonVal} ${prevTime}`;
        const field = {
            [Params.NAME]: datetimeCollectedUTC,
            [DBFields.NEW_VALUE]: inputVal,
            [Params.MIXED_VALUE]: true,
            [DBFields.TYPE]: DBFields.DATE_TYPE,
            [Params.PARENT]: tableName,
            [Params.ROW_ID]: rowIds[0],
            [DBFields.VALID]: false
        }
        const alertErrors = await validation.auditField((field));
        alertErrors.forEach(error => {
            errors.push(error);
        });
        await validation.open_calendar(field[Params.NAME], tableName);
        const calendarTime = await validation.get_time_from_calendar();
        const setValueFromInput = await validation.get_time_from_input(tableName, datetimeCollectedUTC);
        if (setTime) {
            const idx = setTime.startsWith("0") ? 2 : 1;
            const calendarTimeToBe = convertedVal.slice(convertedVal.indexOf(' ') + idx, -3)
            const convertedCal = await convert24(calendarTime)
            if (convertedCal !== calendarTimeToBe) {
                errors.push(`expected calendar time to be converted: ${calendarTimeToBe} got ${convertedCal}`)
            }
            if (convertedVal !== setValueFromInput) {
                errors.push(`expected input to be ${convertedVal} got ${setValueFromInput}`)
            }
        }
        expect(errors).toEqual([]);
    });
    /**
     * @memberOf AuditGlobalTestingWithExclusionsForAppSpec
     * @name Call Api Cashed
     * @description
     * The user updates first row in sub table.
     * The user sets new value for datetime_collected_utc field.
     * The user clicks on save button that runs api request.
     * The user makes audit for all other rows in sub table.
     * The user clicks on save button and checks that request
     * passed successfully and document was updated.
     * @author dshundrina
     * @since 2021-07-22
     * @version 2021-07-22
     */
    test('Call api cashed', async () => {
        const errors = []
        const rowIds = await validation.get_all_ids_from_field_with_sub_ranges(tableName);
        await validation.select_sub_table_row_by_id(rowIds[0]);
        const field = {
            [Params.NAME]: datetimeCollectedUTC,
            [DBFields.NEW_VALUE]: "20200401000000",
            [Params.MIXED_VALUE]: true,
            [DBFields.TYPE]: DBFields.DATE_TYPE,
            [Params.PARENT]: tableName,
            [DBFields.VALID]: false,
            [Params.UTC]: +1,
            [Params.ROW_ID]: rowIds[0]
        }
        await validation.auditField(field);
        if (global.browserName === 'chrome') {
            await driver.manage().logs().get('performance');
        }
        const dateValue = moment(field[DBFields.NEW_VALUE].slice(0, 8) + "T" + field[DBFields.NEW_VALUE].slice(8));
        const expectedValue = dateValue.subtract(field[Params.UTC], 'hours' ).format('YYYY-MM-DD[T]HH:mm:ss[Z]');
        await validation.save_form_changes();
        if (global.browserName === 'chrome') {
            const logs = await driver.manage().logs().get('performance');
            const calls = handleApiCallWasSent(logs, `${process.env.BASE_URL}/detail/${collectionName}/${recordId}`);
            const lastCall = JSON.parse(calls[0].request.postData);
            expect(lastCall.changedValues.amounts_and_rates[rowIds[0].slice(17)].datetime_collected_utc.value).toEqual(expectedValue);
            expect(lastCall.changedValues.amounts_and_rates[rowIds[0].slice(17)].datetime_collected_utc.valid).toBe(false);
        }
        const alertText = await validation.handleAlert();
        if (!alertText.includes(AlertTexts.SUCCESSFULLY_UPDATED)) {
            errors.push(`expected ${AlertTexts.SUCCESSFULLY_UPDATED} in alert`)
        }
        expect(errors).toEqual([]);
    });
    /**
     * @memberOf AuditGlobalTestingWithExclusionsForAppSpec
     * @name Api Call For Changed Time
     * @description
     * The user changes only time in sub-table row in the document.
     * The user clicks on save btn.
     * The user checks that interbank rate was updated.
     * The user checks that interbank rate is actually
     * the same as was returned from api.
     * @author dshundrina
     * @since 2021-07-23
     * @version 2021-07-23
     */
    test('Api call for changed time', async () => {
        const errors = []
        const apiUrl = "http://interbank-api.fxcintel.com/api/v1/rate"
        const apiToken = "yJF0vbGcE9wAux2E"
        await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor: collectionName},
            {"$set": {"ib_api_auto_update": {
                        "on": true,
                        "dependency_fields": {
                            "currency_from": "currency_from",
                            "currency_to": "currency_to",
                            "timestamp": "amounts_and_rates.datetime_collected_utc"
                        },
                        "fields_to_update": {
                            "rate": "amounts_and_rates.interbank_rate"
                        },
                        "url_field": "amounts_and_rates.ib_api_url",
                        "token": apiToken,
                        "base_url": apiUrl
                    }}});
       const rowIds = await validation.get_all_ids_from_field_with_sub_ranges(tableName);
       const primaryRate = await validation.get_cell_val_by_name("interbank_rate", rowIds[0], tableName);
       const currencyFrom = await validation.get_cell_val_by_name(DBParams.CURRENCY_FROM);
       const currencyTo = await validation.get_cell_val_by_name(DBParams.CURRENCY_TO);
       const field = {
           [Params.NAME]: datetimeCollectedUTC,
           [DBFields.NEW_VALUE]: "20200302221400",
           [Params.MIXED_VALUE]: true,
           [DBFields.TYPE]: DBFields.DATE_TYPE,
           [Params.PARENT]: tableName,
           [DBFields.VALID]: false,
           [Params.UTC]: -1,
           [Params.ROW_ID]: rowIds[0]
       }
       await validation.select_sub_table_row_by_id(rowIds[0]);
       if (global.browserName === 'chrome') {
           await driver.manage().logs().get('performance');
       }
       const dateValue = moment(field[DBFields.NEW_VALUE].slice(0, 8) + "T" + field[DBFields.NEW_VALUE].slice(8));
       const expectedValue = dateValue.subtract(field[Params.UTC], 'hours' ).format('YYYY-MM-DD[T]HH:mm:ss[Z]');
       const alertErrors = await validation.auditField((field));
       alertErrors.forEach(error => {
           errors.push(error);
       });
       await validation.save_form_changes();
       if (global.browserName === 'chrome') {
           const logs = await driver.manage().logs().get('performance');
           const calls = handleApiCallWasSent(logs, `${process.env.BASE_URL}/detail/${collectionName}/${recordId}`);
           const lastCall = JSON.parse(calls[0].request.postData);
           expect(lastCall.changedValues.amounts_and_rates[rowIds[0].slice(17)].datetime_collected_utc.value).toEqual(expectedValue);
           expect(lastCall.changedValues.amounts_and_rates[rowIds[0].slice(17)].datetime_collected_utc.valid).toBe(false);
       }
       const alertText = await validation.handleAlert();
       if (!alertText.includes(AlertTexts.SUCCESSFULLY_UPDATED)) {
           errors.push(`expected ${AlertTexts.SUCCESSFULLY_UPDATED} in alert`)
       }
       const url = `${apiUrl}?token=${apiToken}&mode=closest&currency_from=${currencyFrom}&currency_to=${currencyTo}&timestamp=${expectedValue.slice(0, -1)}`
        console.log(url)
       const apiResp = await getApiCall(global.agent, url, global.cookies);
       const interbankRate = await validation.get_cell_val_by_name(DBFields.INTERBANK_RATE, rowIds[0], tableName);
       if (apiResp.body.rate.toFixed(4) !== parseFloat(interbankRate).toFixed(4)) {
           errors.push(`expected interbankRate to be ${apiResp["rate"].toFixed(4)} got ${parseFloat(interbankRate).toFixed(4)}`)
       }
       if (primaryRate === interbankRate) {
           errors.push("rate was not changed after changing only time")
       }
       expect(errors).toEqual([])
    });
});