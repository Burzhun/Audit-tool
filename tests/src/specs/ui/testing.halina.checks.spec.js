/**
 * @namespace TestingHalinaChecksSpec
 */
import moment from "moment";
import {
    CONFIGURATION,
    DBFields,
    FIND_ONE,
    TESTING_HALINA,
    TESTING_HALINA_REFERENCE,
    UPDATE_ONE
} from "../../utils/db.params";
import {ValidationPage} from "../../pages/website/ValidationPage";
import {UiEndPoints} from "../../utils/end.points";
import {recreateRecord} from "../../utils/db.utils";
import {DBParams, Params} from "../../utils/params";
import {handleApiCallWasSent, mongoDBRequest} from "@fxc/ui-test-framework";
import _ from "lodash";
import faker from 'faker';
import {equalsIgnoreOrder} from "../../utils/app.utils";

const collectionName = TESTING_HALINA;
const recordID = 1;
const validation = new ValidationPage();

const paramsCollectedDate = [
    {
        [Params.NAME]: DBParams.COLLECTED_DATE,
        [DBFields.NEW_VALUE]: "2008-01-01",
        [Params.TIME]: "06:21 PM",
        [Params.UTC]: 0,
        [DBParams.NEW_VALUE_PASS]: true,
        [DBFields.TYPE]: DBFields.DATE_TYPE,
        [DBFields.VALID]: false,
        testDescription: 'normal date'
    },
    {
        [Params.NAME]: DBParams.COLLECTED_DATE,
        [DBFields.NEW_VALUE]: "2008-01-01",
        [Params.TIME]: "06:21 PM",
        [Params.UTC]: -3,
        [DBParams.NEW_VALUE_PASS]: true,
        [DBFields.TYPE]: DBFields.DATE_TYPE,
        [DBFields.VALID]: false,
        testDescription: 'just UTC change'
    },
    {
        [Params.NAME]: DBParams.COLLECTED_DATE,
        [DBFields.NEW_VALUE]: "2025-01-01",
        [Params.TIME]: "06:21 PM",
        [Params.UTC]: -7,
        [DBParams.NEW_VALUE_PASS]: true,
        [DBFields.TYPE]: DBFields.DATE_TYPE,
        [DBFields.VALID]: false,
        error: "Not satisfied for constraint lte = 2025-01-01T21:21:00.000Z;",
        testDescription: 'not satisfied for constraint lte'
    },
    {
        [Params.NAME]: DBParams.COLLECTED_DATE,
        [DBFields.NEW_VALUE]: "2002-01-01",
        [Params.TIME]: "10:21 PM",
        [Params.UTC]: +3,
        [DBParams.NEW_VALUE_PASS]: true,
        [DBFields.TYPE]: DBFields.DATE_TYPE,
        [DBFields.VALID]: false,
        error: 'Not satisfied for constraint gte = 2002-01-01T21:21:00.000Z;',
        testDescription: 'not satisfied for constraint gte'
    },
]
describe('Testing Halina collection checks', () => {
    beforeAll(async () => {
        await recreateRecord(collectionName, recordID, {
            refCol: TESTING_HALINA_REFERENCE,
            refConfig: TESTING_HALINA_REFERENCE
        });
        await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor: collectionName}, UPDATE_ONE, null,
            {$pull: {Validators: {'name': 'CollectedDate'}}});
        await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor: collectionName}, UPDATE_ONE, null,
            {
                $push: {
                    Validators: {
                        'name': 'CollectedDate',
                        'type': 'isodate',
                        'constraints': {
                            "gte": new Date("2002-01-01T21:21:00.000Z").toISOString(),
                            "lte": new Date("2025-01-01T21:21:00.000Z").toISOString()
                        }
                    }
                }
            });
        await validation.goToPage(UiEndPoints.goToDetailsUrl(collectionName, recordID));
    });
    beforeEach(async () => {
        await validation.remove_fixed_elements();
        await validation.clickDefault();

    });
    /**
     * @memberOf TestingHalinaChecksSpec
     * @name Calendar inputs with constraints test
     * @description
     * User set up date as in constraint.
     * The user sets up date with UTC as in constraint but boundary like 2025-01-02 0:00 UTC+5
     * when constraint is lt 2025-01-01 19:00.
     * @author dshundrina
     * @since 2021-07-05
     * @version 2021-09-27
     */
    paramsCollectedDate.forEach(validatedField => {
        test(`Calendar inputs with constraints test ${validatedField.testDescription}`, async () => {
            await validation.scrollToRow('CollectedDate');
            const errors = [];
            const auditErrors = await validation.auditField(validatedField);
            auditErrors.forEach(error => {
                errors.push(error)
            });
            const dateValue = moment(`${validatedField[DBFields.NEW_VALUE]} ${validatedField[Params.TIME]}`, 'YYYY-MM-DD h:mm:ss a');
            const expectedValue = dateValue.subtract(validatedField[Params.UTC], 'hours' ).format('YYYY-MM-DD[T]HH:mm:ss[Z]');
            if (global.browserName === 'chrome') {
                await driver.manage().logs().get('performance');
            }
            await validation.save_form_changes();

            if (!validatedField.error) {
                const alertErrors = await validation.check_is_pass([validatedField]);
                alertErrors.forEach(error => {
                    errors.push(error)
                })
            } else {
                const calendarError = await validation.get_calendar_error();
                expect(validatedField.error).toEqual(calendarError);
            }
            if (global.browserName === 'chrome') {
                const logs = await driver.manage().logs().get('performance');
                if (logs.length > 0) {
                    const calls = await handleApiCallWasSent(logs, `${process.env.BASE_URL}/detail/${collectionName}/${recordID}`);
                    const lastCall = JSON.parse(calls[0].request.postData);
                    expect(lastCall.changedValues.CollectedDate.value).toEqual(expectedValue)
                    expect(lastCall.changedValues.CollectedDate.valid).toBe(false)
                }
            }
            expect(errors).toEqual([]);
        });
    });
    /**
     * @memberOf TestingHalinaChecksSpec
     * @name Check empty objects are not removed
     * @description
     * The user sets in config field
     * ImageLinks to empty dict {} then to empty array [].
     * The user changes score and checks
     * that ImageLinks was not removed.
     * The user audits field and checks that
     * ImageLinks field was not removed and current State
     * is the same for other fields
     * @author dshundrina
     * @since 2021-07-29
     * @version 2021-07-29
     */
    const values = [0, 1]
    values.forEach(value => {
        test('Check empty objects are not removed', async () => {
            await driver.navigate().refresh();
            const errors = []
            const setKey = `${DBFields.CURRENT_STATE}.${DBFields.IMAGE_LINKS}`
            const imgLinks = value===0? {} : [];
            await mongoDBRequest(collectionName, {[DBFields.RECORD_ID]: recordID}, UPDATE_ONE, null,
                {$set: {[setKey]: imgLinks}})
            const primaryState = await mongoDBRequest(collectionName, {[DBFields.RECORD_ID]: recordID}, FIND_ONE);
            await validation.set_score("Unsure");
            await validation.save_form_changes();
            await validation.handleAlert();
            const updRecord = await mongoDBRequest(collectionName, {[DBFields.RECORD_ID]: recordID}, FIND_ONE);
            expect(_.isEqual(updRecord[DBFields.CURRENT_STATE], primaryState[DBFields.CURRENT_STATE])).toBe(true);
            const field = {
                [Params.NAME]: DBFields.RESEARCHER_NAME,
                [DBFields.NEW_VALUE]: faker.name.findName(),
                [DBFields.TYPE]: Params.text,
                [DBFields.VALID]: false
            }
            const auditErrors = await validation.auditField(field);
            auditErrors.forEach(error => {
                errors.push(error);
            });
            await validation.save_form_changes();
            await validation.handleAlert();
            const secUpdRecord = await mongoDBRequest(collectionName, {[DBFields.RECORD_ID]: recordID}, FIND_ONE);
            updRecord[DBFields.CURRENT_STATE][field[Params.NAME]] = field[DBFields.NEW_VALUE]
            const result =  equalsIgnoreOrder(Object.keys(secUpdRecord[DBFields.CURRENT_STATE]), Object.keys(updRecord[DBFields.CURRENT_STATE]));
            if (result === false) {
                errors.push("expected doc keys list is the same")
            }
            expect(errors).toEqual([]);
        });
    });
    /**
     * @memberOf TestingHalinaChecksSpec
     * @name Check precision display
     * @description
     * The user checks that displayed decimal number
     * is the same as set in configuration
     * @author dshundrina
     * @since 2021-08-04
     * @version 2021-08-04
     */
    // todo: Check number of decimals now they are 4 in each value
    test('Check precision display', async () => {
        const errors = [];
        await driver.navigate().refresh();
        const setKey = `${DBFields.CURRENT_STATE}.${DBFields.GDP_GROWTH}`;
        await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor: collectionName}, UPDATE_ONE, null,
            {$set : {'FloatDisplayPrecision': {
            'gdp_growth': 6,
            'ConsumerMargins.fx_margin': 2,
            'ConsumerMargins.full_cost': 4
        }}});
        await mongoDBRequest(collectionName, {RecordId: recordID}, UPDATE_ONE, null,
            {$set: {[setKey]: 4.123456789}});
        await driver.navigate().refresh();
        const rowIds = await validation.get_all_ids_from_field_with_sub_ranges(DBFields.CONSUMER_MARGINS);
        for (const row of rowIds) {
            const cellFullCostVal = await validation.get_cell_val_by_name(DBFields.FULL_COST, row, DBFields.CONSUMER_MARGINS);
            if (cellFullCostVal.toString().slice(cellFullCostVal.indexOf('.')+ 1).length !== 4) {
                errors.push("expected number of decimals to be 4")
            }
            // const cellFxMarginVal = await validation.get_cell_val_by_name(DBFields.FX_MARGIN, row, DBFields.CONSUMER_MARGINS);
            // if (cellFxMarginVal.toString().slice(cellFxMarginVal.indexOf('.')+ 1).length !== 2) {
            //     errors.push("expected number of decimals to be 2")
            // }
        }
       // const gdpGrowthVal = await validation.get_cell_val_by_name(DBFields.GDP_GROWTH);
       //  if (gdpGrowthVal.toString().slice(gdpGrowthVal.indexOf('.')+ 1).length !== 6) {
       //      errors.push("expected number of decimals to be 6")
       //  }
        await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor: collectionName}, UPDATE_ONE, null,
            {$unset : {'FloatDisplayPrecision': ""}});
        expect(errors).toEqual([]);
    });
    /**
     * @memberOf TestingHalinaChecksSpec
     * @name Skip update
     * @description
     * The user sets up invalid config.
     * The user checks that when clicking on save
     * btn the notification about invalid config is displayed.
     * No changes are done to db.
     * @author dshundrina
     * @since 2021-08-06
     * @version 2021-08-06
     */
    test.skip('Skip update', async () => {
        const errors = [];
        const curDoc = await mongoDBRequest(collectionName, {RecordId: recordID});
        const config = await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor: collectionName});
        const author = faker.name.findName();
        const ibRate = Math.random().toFixed(2);
        let currencyFromPossibleVals;
        config.Validators.forEach(el => {
            if (el.name == [DBParams.CURRENCY_FROM]) {
                currencyFromPossibleVals = el.constraints.values
            }
        });
        const currencyFrom = [];
        currencyFromPossibleVals.forEach(el => {
            console.log(el)
            if (el != curDoc.CurrentState.currency_from) {
                currencyFrom.push(el)
            }
        })
        const dt =
        console.log(currencyFrom)
        console.log(curDoc.CurrentState)
    })
});


