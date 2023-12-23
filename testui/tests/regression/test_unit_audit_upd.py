import random
import time

import pytest

from conftest import doc_it
from dbutil.db_utils import find_docs_in_collection, update_mongo
from pages.validation.validation_page_actions import ValidationPage
from params import db_params, texts, params
from params.db_params import CONFIGURATION, GLOB_TEST_WITH_EXC_FOR_APP, COLLECTION_RELEVANT_FOR, RECORD_ID, \
    UN_DISPLAYABLE_FIELDS, AMOUNTS_AND_RATES
from utils.app_actions import login_and_go_to_url, login_and_search_record_by_record_id, select_record_by_cell_key_value
from utils.app_utils import audit_field


@pytest.mark.usefixtures("remove_files")
class TestUnitAuditUpd:
    @doc_it()
    @pytest.mark.user_removes_and_returns_row
    def test_14836_user_removes_and_returns_row(self, browser):
        """
        The user validates field on form
        and occasionally removes row in sub-table
        then returns it back by clicking on the row once again.
        Check that user can save form
        and receives success notification
        :param browser:
        :return:
        """
        errors = []
        collection_name = db_params.TESTING_HALINA
        field = {
            db_params.NAME: db_params.AUTHOR,
            db_params.TYPE: db_params.TEXT,
            db_params.VALID: True
        }
        doc_id = 1
        login_and_go_to_url(browser, collection_name, doc_id)
        page = ValidationPage(browser)
        page.remove_fixed_elements()
        errors += audit_field(browser, field)
        row_ids = page.get_all_ids_from_field_with_sub_ranges(db_params.CONSUMER_MARGINS)
        for i in range(0, 2):
            page.remove_sub_table_row(row_ids[0])
        page.save_form_changes()
        alert_text = page.get_alert_text()
        if texts.SUCCESSFULLY_UPDATED not in alert_text:
            errors.append(f"expected {texts.SUCCESSFULLY_UPDATED} to be in alert text")
        assert errors == []

    @doc_it()
    @pytest.mark.check_audit_for_newly_added_row
    @pytest.mark.parametrize("collection_name", [db_params.TESTING_HALINA])
    def test_14722_check_audit_for_newly_added_row(self, browser, gen_data, collection_name):
        """
        The user adds row for sub-table.
        The user saves data on form
        and checks that audit is being written in the db and
        buttons audit appeared on form
        :param browser:
        :return:
        """
        errors = []
        doc_id = 1
        login_and_go_to_url(browser, collection_name, doc_id)
        page = ValidationPage(browser)
        add_info = [{db_params.NAME: "amount", db_params.NEW_VALUE: random.randint(1000, 3000),
                     params.PARENT: db_params.CONSUMER_MARGINS,
                     db_params.TYPE: db_params.NUMERIC},
                    {db_params.NAME: "timestamp", db_params.NEW_VALUE: "20231121112200", params.MIXED_VALUE: True,
                     params.UTC: -10, params.PARENT: db_params.CONSUMER_MARGINS,
                     db_params.TYPE: db_params.DATE_TYPE},
                    {db_params.NAME: db_params.IB_RATE, db_params.NEW_VALUE: random.randint(13, 16),
                     params.PARENT: db_params.CONSUMER_MARGINS, db_params.TYPE: db_params.NUMERIC},
                    {db_params.NAME: db_params.FX_RATE, db_params.NEW_VALUE: round(random.uniform(10, 13), 2),
                     params.PARENT: db_params.CONSUMER_MARGINS, db_params.TYPE: db_params.NUMERIC},
                    {db_params.NAME: "fee", db_params.NEW_VALUE: random.randint(1, 9),
                     params.PARENT: db_params.CONSUMER_MARGINS, db_params.TYPE: db_params.NUMERIC},
                    ]
        page.remove_fixed_elements()
        page.add_sub_range_row(db_params.CONSUMER_MARGINS)
        added_row_id_consumer = page.get_selected_row_id(db_params.CONSUMER_MARGINS)
        for item in add_info:
            item[params.ROW_ID] = added_row_id_consumer
            errors += audit_field(browser, item, True)
        page.save_form_changes()
        page.confirm_alert()
        row_ids = page.get_all_ids_from_field_with_sub_ranges(db_params.CONSUMER_MARGINS)
        page.select_sub_table_row_by_id(row_ids[-1])
        table_columns = page.get_sub_range_column_names(db_params.CONSUMER_MARGINS)
        for el in table_columns:
            if not page.check_audit_btn(el, row_ids[-1]):
                errors.append(f"expected audit btn to be displayed for the field {el}")
        cur_doc = find_docs_in_collection(collection_name, {db_params.RECORD_ID: doc_id})
        audit = cur_doc[db_params.AUDIT_SESSIONS][-1][db_params.AUDIT_VALUE_ARRAY][0]
        if audit[db_params.AUDIT_FIELD_NAME] != db_params.CONSUMER_MARGINS:
            errors.append(
                f"expected audit name to be {db_params.CONSUMER_MARGINS}, got {audit[db_params.AUDIT_FIELD_NAME]}")
        if audit[db_params.NEW_VALUE]["amount"] != 2500 and audit[db_params.NEW_VALUE][db_params.IB_RATE] != 14 and \
                audit[db_params.NEW_VALUE][db_params.FX_RATE] != 7 \
                and audit[db_params.NEW_VALUE]["org_name"] is not None:
            errors.append(f"wrong audit values in the db")
        assert errors == []

    @doc_it()
    @pytest.mark.fields_are_cleared
    def test_14723_fields_are_cleared(self, browser):
        """
        Add new invalid row to fees sub-table,
        save empty data.
        Check that after warnings data is not disappearing
        :param browser:
        :return:
        """
        errors = []
        collection_name = db_params.TEST_FX_FEES_0_3
        doc_id = 3
        login_and_go_to_url(browser, collection_name, doc_id)
        cur_doc = find_docs_in_collection(collection_name, {db_params.RECORD_ID: doc_id})
        page = ValidationPage(browser)
        page.remove_fixed_elements()
        page.add_delete_range_element(True)
        all_fees = cur_doc[db_params.CURRENT_STATE]["fees"]
        latest_fees = all_fees[0]
        fields = [
            {
                db_params.NAME: "fees.Countries To",
                db_params.VALID: False,
                db_params.NEW_VALUE: latest_fees["Countries To"],
                "close": True
            },
            {
                db_params.NAME: "fees.Currency From",
                db_params.VALID: False,
                db_params.NEW_VALUE: latest_fees["Currency From"]
            },
            {
                db_params.NAME: "fees.Currency To",
                db_params.VALID: False,
                db_params.NEW_VALUE: latest_fees["Currency To"]
            },
            {
                db_params.NAME: "fees.Customer Type",
                db_params.VALID: False,
                db_params.NEW_VALUE: latest_fees["Customer Type"]
            },
            {
                db_params.NAME: "fees.Payment Methods",
                db_params.VALID: False,
                db_params.NEW_VALUE: latest_fees["Payment Methods"],
                "close": True
            },
            {
                db_params.NAME: "fees.Payout Methods",
                db_params.VALID: False,
                db_params.NEW_VALUE: latest_fees["Payout Methods"],
                "close": True
            }, {
                db_params.NAME: "fees.Amount Currency",
                db_params.VALID: False,
                db_params.NEW_VALUE: latest_fees["Amount Currency"]
            },
        ]
        for el in fields:
            el[params.INDEX] = len(all_fees)
            el[db_params.TYPE] = db_params.ENUM
            close = True if "close" in el else False
            errors += audit_field(browser, el, close_dropdown=close)
        page.save_form_changes()
        page.confirm_alert()
        for el in [x[db_params.NAME] for x in fields]:
            new_field_val = page.get_hof_upd_value(el, True, len(all_fees))
            if not new_field_val:
                errors.append(f"expected {el} value to be not null")
        assert errors == []

    @doc_it()
    @pytest.mark.removed_fee_row
    @pytest.mark.skip
    def test_14887_removed_fee_row(self, browser):
        """
        The user clicks on the row to remove field
        from fees table.
        The user checks that the row was removed from only single table.
        The user selects row in the sub-table and adds it on
        the form.
        The user checks that the row appeared in the sub-table.
        :param browser:
        :return:
        """
        errors = []
        field_name = "Collection Id"
        collection_name = db_params.TEST_FX_FEES_0_3
        doc_id = 3
        login_and_go_to_url(browser, collection_name, doc_id)
        cur_doc = find_docs_in_collection(collection_name, {db_params.RECORD_ID: doc_id})
        page = ValidationPage(browser)
        page.remove_fixed_elements()
        all_fees = cur_doc[db_params.CURRENT_STATE]["fees"]
        # remove element from the last table:
        time.sleep(2)
        page.remove_field(field_name)
        if page.check_hof_is_displayed(field_name, 0):
            errors.append(f"expected field to be displayed")
        # add field:
        page.add_field_on_form(field_name)
        if not page.check_hof_is_displayed(field_name, 0):
            errors.append(f"expected field to be displayed after being added")
        assert errors == []

    @doc_it()
    @pytest.mark.same_amount_with_diff_fee_range
    @pytest.mark.parametrize("collection_name, record_id", [(db_params.TEST_FX_FEES_0_2, 2)])
    def test_14939_same_amount_with_diff_fee_range(self, browser, collection_name, record_id, gen_data):
        """
        The user clicks to add new row.
        Start setting amount and
        check that row is up or down
        according to preset amount.
        The user checks that all cells in
        the newly added row are colored
        :param browser:
        :return:
        """
        errors = []
        cur_doc = find_docs_in_collection(collection_name, {db_params.RECORD_ID: record_id})
        last_row = cur_doc[db_params.CURRENT_STATE]["fees"][0]["fee_table"][-1]
        login_and_go_to_url(browser, collection_name, record_id)
        page = ValidationPage(browser)
        page.remove_fixed_elements()
        table_name = "fees.fee_table"
        page.add_sub_range_row(table_name)
        fields = [
            {
                db_params.NAME: "Amount lower",
                db_params.VALID: False,
                db_params.NEW_VALUE: last_row["Amount lower"],
                db_params.TYPE: db_params.NUMERIC,
                params.PARENT: table_name
            },
            {
                db_params.NAME: "Amount higher",
                db_params.VALID: False,
                db_params.NEW_VALUE: last_row["Amount higher"],
                db_params.TYPE: db_params.NUMERIC,
                params.PARENT: table_name
            },
        ]
        row_id = page.get_all_ids_from_field_with_sub_ranges(table_name)[-1]
        for el in fields:
            el[params.ROW_ID] = row_id
            errors += audit_field(browser, el, added=True)
        page.save_form_changes()
        if texts.SUCCESSFULLY_UPDATED not in page.get_alert_text():
            errors.append(f"expected doc to be {texts.SUCCESSFULLY_UPDATED}")
        page.confirm_alert()
        total_row_number = len(page.get_all_ids_from_field_with_sub_ranges(table_name))
        new_val_am_lower = page.get_cell_value_by_row_number_and_column_name(table_name, total_row_number,
                                                                             "Amount lower")
        new_val_am_higher = page.get_cell_value_by_row_number_and_column_name(table_name, total_row_number,
                                                                              "Amount higher")
        upd_row_id = page.get_all_ids_from_field_with_sub_ranges(table_name)[-1]
        column_names = page.get_sub_range_column_names(table_name)
        for c in column_names:
            cell_color = page.get_cell_color_by_name(c, upd_row_id, table_name)
            if cell_color != params.UPDATED_COLOR:
                errors.append(f"expected cell {c} to be colored")
        if int(new_val_am_lower) != last_row["Amount lower"] and int(new_val_am_higher) != last_row["Amount higher"]:
            errors.append("expected row to be duplicated")
        assert errors == []

    @doc_it()
    @pytest.mark.set_empty_field
    @pytest.mark.config_update
    @pytest.mark.collection_not_to_update
    @pytest.mark.parametrize("collection_name, record_id", [(db_params.TEST_FX_FEES_0_2, 2)])
    def test_14995_set_empty_field(self, browser, collection_name, record_id, gen_data):
        """
        The user adds new row.
        The user checks that empty field
        amount_fee_approved is set to null
        :param browser:
        :return:
        """
        errors = []
        req = {"$set": {"DefaultSortings": [
            {
                "ArrayFieldName": "CurrentState.fees.fee_table",
                "SubFieldsToSort": [
                    {
                        "SubField": "Amount lower",
                        "Order": "ascending"
                    }
                ]
            }
        ]}}
        update_mongo(db_params.CONFIGURATION, {db_params.COLLECTION_RELEVANT_FOR: collection_name},
                     req)
        login_and_go_to_url(browser, collection_name, record_id)
        page = ValidationPage(browser)
        page.remove_fixed_elements()
        table_name = "fees.fee_table"
        page.add_sub_range_row(table_name)
        fields = [
            {
                db_params.NAME: "Amount lower",
                db_params.VALID: False,
                db_params.NEW_VALUE: 21,
                db_params.TYPE: db_params.NUMERIC,
                params.PARENT: table_name
            },
            {
                db_params.NAME: "Amount higher",
                db_params.VALID: False,
                db_params.NEW_VALUE: 22,
                db_params.TYPE: db_params.NUMERIC,
                params.PARENT: table_name
            },
        ]
        all_rows = page.get_all_ids_from_field_with_sub_ranges(table_name)
        row_id = all_rows[-1]
        for el in [{db_params.NEW_VALUE: 20.02, "row_number": 1}, {db_params.NEW_VALUE: 22, "row_number": 2},
                   {db_params.NEW_VALUE: 1, "row_number": 0}, {db_params.NEW_VALUE: 82, "row_number": 3}]:
            audit_field(browser, {
                db_params.NAME: "Amount lower",
                db_params.VALID: False,
                db_params.NEW_VALUE: el[db_params.NEW_VALUE],
                db_params.TYPE: db_params.NUMERIC,
                params.PARENT: table_name,
                params.ROW_ID: row_id
            }, added=True)
            all_rows_rearr = list(dict.fromkeys(page.get_all_ids_from_field_with_sub_ranges(table_name)))
            if all_rows_rearr[el["row_number"]] != row_id:
                errors.append(f"expected row to be on {el['row_number'] + 1} place")
        for el in fields:
            el[params.ROW_ID] = row_id
            errors += audit_field(browser, el, added=True)
        page.save_form_changes()
        if texts.SUCCESSFULLY_UPDATED not in page.get_alert_text():
            errors.append(f"expected doc to be {texts.SUCCESSFULLY_UPDATED}")
        page.confirm_alert()
        time.sleep(1)
        total_row_number = len(page.get_all_ids_from_field_with_sub_ranges(table_name))
        new_val = page.get_cell_value_by_row_number_and_column_name(table_name, total_row_number, "amount_fee_approved")
        if new_val != "":
            errors.append("expected empty value to be in the field")
        assert errors == []

    @doc_it()
    @pytest.mark.check_undisplayable_fields
    @pytest.mark.config_update
    @pytest.mark.collection_not_to_update
    @pytest.mark.parametrize("collection_name, record_id", [(GLOB_TEST_WITH_EXC_FOR_APP, 445)])
    def test_14979_check_undisplayable_fields(self, browser, collection_name, record_id, gen_data):
        """
        The user checks that fields that are configured as UnDisplayableFields
        are not appeared on the form.
        The user checks that these fields are also not present in the list of fields
        that can be added on the form

        :param browser:
        :return:
        """
        errors = []

        update_mongo(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name},
                     {"$set": {"UnDisplayableFields": [
                                "provider_name",
                                "amounts_and_rates.interbank_rate"],
                         "DefaultFieldsToDisplayInAuditSession": [
                             "country_iso2",
                             "currency_from",
                             "currency_to",
                             "name_of_researcher",
                             "datetime_collected_utc",
                             "datetime_record_submitted_utc",
                             "any_amount_outside_of_min_max_fx_margin",
                             "any_amount_with_negative_fx_margin",
                             "any_amount_duplicated",
                             "rate_does_not_consistently_improve",
                             "any_amount_with_fx_margin_reldiff_gt15pct_mom",
                             "imti_monthly_curve_legacy_portal_beta",
                             {
                                 "name": "amounts_and_rates",
                                 "DefaultFieldsToDisplayInAuditSession": [
                                     "amount_from",
                                     "datetime_collected_utc",
                                     "ib_api_url",
                                     "fx_rate",
                                     "fx_margin",
                                     "amount_margin_approved",
                                     "amount_duplicated",
                                     "outside_of_min_max_fx_margin",
                                     "fx_margin_reldiff_gt15pct_mom"]}]}})

        doc_config = find_docs_in_collection(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name})
        undisplayable_fields = [x for x in doc_config[UN_DISPLAYABLE_FIELDS] if '.' not in x]
        refined_undisplayable_fields = [x.split('.', 1)[1] for x in doc_config[UN_DISPLAYABLE_FIELDS] if '.' in x]
        undisplayable_fields.extend(refined_undisplayable_fields)

        login_and_go_to_url(browser, collection_name, record_id)
        validation_page = ValidationPage(browser)
        validation_page.remove_fixed_elements()
        fields_on_form_high_level = validation_page.get_column_name_from_tr()
        fields_on_form_high_level_dropdown = validation_page.get_add_field_dropdown_options()
        fields_on_form_sub_range = validation_page.get_sub_range_column_names(AMOUNTS_AND_RATES)
        fields_on_form_sub_range_dropdown = validation_page.get_dropdown_for_sub_table_options(AMOUNTS_AND_RATES)

        displayed_high_level_fields = fields_on_form_high_level + fields_on_form_high_level_dropdown
        displayed_sub_range_fields = fields_on_form_sub_range + fields_on_form_sub_range_dropdown
        for el in [{'field': 'high', 'arr': displayed_high_level_fields}, {'field': 'low', 'arr': displayed_sub_range_fields}]:
            if [x for x in undisplayable_fields if x in el['arr']]:
                errors.append(f"intersection for {el['field']} level config detected")

        assert errors == []

    @doc_it()
    @pytest.mark.check_undefined_in_url
    def test_15040_check_undefined_in_url(self, browser):
        """
        Check that 'undefined' part is absent in the url
        :param browser:
        :return:
        """
        errors = []
        collection_name = db_params.ISSUER_CARDS
        doc_id = 7322
        login_and_search_record_by_record_id(browser, collection_name, doc_id)
        select_record_by_cell_key_value(browser, doc_id, collection_name)

        url = browser.current_url
        if url.count("undefined") != 0:
            errors.append("url should not contain the 'undefined' suffix")

        assert errors == []
