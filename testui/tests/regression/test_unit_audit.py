import decimal
import os
import pytest
import random
import requests
import time
from conftest import doc_it
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from dbutil.db_utils import find_docs_in_collection, update_mongo, delete_mongo
from dbutil.generate_test_data import create_random_docs_and_config
from faker import Faker
from pages.admin.admin_page import AdminPage
from pages.login.login_page_actions import LoginPage
from pages.search.search_page_actions import SearchPage
from pages.validation.validation_page_actions import ValidationPage
from params import texts, params, urls
from params.db_params import TESTING_HALINA, NAME, TYPE, TEXT, RECORD_ID, CURRENT_STATE, AUDIT_STATE, AUDIT_NUMBER, \
    AUDIT_VALUE_ARRAY, AUDIT_SESSIONS, AUDIT_FIELD_NAME, OLD_VALUE, VALID, NEW_VALUE, AUDITED_COMMENT, \
    REGISTERED_USER_EMAIL, COMMENT, NUMERIC, CONFIGURATION, COLLECTION_RELEVANT_FOR, DATE_TYPE, VALIDATORS, \
    POPULATION_DENSITY, CONFIDENCE_SCORE, AUDIT_TYPE, NOTE_ON_CONFIDENCE_SCORE, CONSUMER_MARGINS, FX_RATE, ENUM, \
    DEFAULT_AUDIT_FIELDS, UN_DISPLAYABLE_FIELDS, DEFAULT_SCORE_MAP, CONFIDENCE_SCORE_OPTIONS, WAS_REVIEWED, BOOL, \
    CURRENCY_FROM, CURRENCY_TO, INTERBANK_RATE, AMOUNTS_AND_RATES, CLIENT_TYPE, CONSTRAINTS, VALUES, \
    IMTI_V_95_NE_AUD_HALINA, UPDATE_LOGICS, CONFIDENCE_SCORES, GLOB_TEST_WITH_EXC_FOR_APP, DATETIME_COLLECTED_UTC, \
    RESEARCHER_NAME, UPDATED_FIELD, UPDATES_MANUAL_OVERWRITE_FIELDS, AMOUNT_DUPLICATED, IB_API_AUTO_UPDATE, IMAGE_LINKS, \
    AREA_KM2, IB_API_URL, GDP_GROWTH, FULL_COST, FX_MARGIN, FEE, AUTHOR, \
    IB_RATE, COMMERCIAL_MARGINS
from params.end_points import REGISTER
from params.texts import PSWD_LENGTH_NOTIFICATION, AUDIT_SCREEN
from tests.admin.test_config_admin import get_container_items
from utils.app_actions import login_to_app, select_record_by_cell_key_value, \
    register_new_user, set_filters, login_and_go_to_url
from utils.app_utils import audit_field, check_is_pass, check_fields_on_form_values, check_sub_range_values_on_form, \
    map_confidence_score_by_value, compare_audit_popup_with_user_input, map_confidence_score_by_key, \
    compare_elk_logs, compare_audits
from utils.common_utils import convert24, api_call


@pytest.mark.usefixtures("remove_files")
class TestUnitAuditWithGenRecordOnly:
    @pytest.mark.calendar_inputs
    @pytest.mark.parametrize("field", [
        {
            NAME: "CollectedDate",
            NEW_VALUE: "2000-01-01",
            params.TIME: "06:21 PM",
            params.UTC: -3,
            params.NEW_VALUE_PASS: True,
            TYPE: DATE_TYPE,
            VALID: False
        },
        {
            NAME: "CollectedDate",
            NEW_VALUE: "2000-01-01",
            params.TIME: "06:20 PM",
            params.UTC: -3,
            params.NEW_VALUE_PASS: False,
            TYPE: DATE_TYPE,
            VALID: False
        },
        {
            NAME: "CollectedDate",
            NEW_VALUE: "2000-01-02",
            params.TIME: "02:21 AM",
            params.UTC: +5,
            params.NEW_VALUE_PASS: True,
            TYPE: DATE_TYPE,
            VALID: False
        },
        {
            NAME: "CollectedDate",
            NEW_VALUE: "2000-01-02",
            params.TIME: "02:20 AM",
            params.UTC: +5,
            params.NEW_VALUE_PASS: False,
            TYPE: DATE_TYPE,
            VALID: False
        },
        {
            NAME: "CollectedDate",
            NEW_VALUE: "2022-01-02",
            params.TIME: "02:22 AM",
            params.UTC: +5,
            params.NEW_VALUE_PASS: False,
            TYPE: DATE_TYPE,
            VALID: False
        },
        {
            NAME: "CollectedDate",
            NEW_VALUE: "2022-01-01",
            params.TIME: "02:22 PM",
            params.UTC: -7,
            params.NEW_VALUE_PASS: False,
            TYPE: DATE_TYPE,
            VALID: False
        },
        {
            NAME: "CollectedDate",
            NEW_VALUE: "2022-01-01",
            params.TIME: "02:21 PM",
            params.UTC: -7,
            params.NEW_VALUE_PASS: True,
            TYPE: DATE_TYPE,
            VALID: False
        },
        {
            NAME: "timestamp",
            VALID: False,
            NEW_VALUE: '2020-01-01',
            params.TIME: "02:21 PM",
            params.UTC: +7,
            params.PARENT: CONSUMER_MARGINS,
            params.NEW_VALUE_PASS: True,
            TYPE: DATE_TYPE
        },
        {
            NAME: "timestamp",
            NEW_VALUE: '2000-01-01',
            params.TIME: "02:20 PM",
            params.UTC: +7,
            params.PARENT: CONSUMER_MARGINS,
            params.NEW_VALUE_PASS: False,
            TYPE: DATE_TYPE,
            VALID: False
        },
        {
            NAME: "timestamp",
            NEW_VALUE: '2000-01-01',
            params.TIME: "09:20 PM",
            params.PARENT: CONSUMER_MARGINS,
            params.NEW_VALUE_PASS: False,
            TYPE: DATE_TYPE,
            VALID: False
        },
        {
            NAME: "timestamp",
            NEW_VALUE: "2025-01-02",
            params.TIME: "02:22 AM",
            params.UTC: +5,
            params.PARENT: CONSUMER_MARGINS,
            params.NEW_VALUE_PASS: False,
            TYPE: DATE_TYPE,
            VALID: False
        },
        {
            NAME: "timestamp",
            NEW_VALUE: "2025-01-02",
            params.TIME: "02:20 AM",
            params.UTC: +5,
            params.PARENT: CONSUMER_MARGINS,
            params.NEW_VALUE_PASS: True,
            TYPE: DATE_TYPE,
            VALID: False
        },
        {
            NAME: "timestamp",
            NEW_VALUE: "2025-01-01",
            params.TIME: "11:22 AM",
            params.UTC: -10,
            params.PARENT: CONSUMER_MARGINS,
            params.NEW_VALUE_PASS: False,
            TYPE: DATE_TYPE,
            VALID: False
        },
    ])
    @pytest.mark.parametrize("collection_name", [TESTING_HALINA])
    def test_11953_calendar_inputs_with_constraints(self, browser, field, collection_name, gen_data):
        """
        User set up date as in constraint.
        The user sets up date with UTC as in constraint but boundary like 2025-01-02 0:00 UTC+5
        when constraint is lt 2025-01-01 19:00.
        """
        # Test is done on pytest as dates are being transferred on ui form
        errors = []
        record_id = 1
        login_and_go_to_url(browser, collection_name, record_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        if params.PARENT in field:
            row_ids = validation.get_all_ids_from_field_with_sub_ranges(field[params.PARENT])
            field[params.ROW_ID] = row_ids[0]
            validation.select_sub_table_row_by_id(row_ids[0])
            errors += audit_field(browser, field)
        else:
            errors += audit_field(browser, field)
        validation.save_form_changes()
        errors += check_is_pass(browser, [field])
        assert errors == []

    @pytest.mark.check_hof_valid
    @pytest.mark.datepicker_display
    @pytest.mark.xfail
    @pytest.mark.parametrize(f"value, set_time, collection_name, record_id",
                             [("20200501", "020012", GLOB_TEST_WITH_EXC_FOR_APP, 445),
                              ("20191101", "225045", GLOB_TEST_WITH_EXC_FOR_APP, 445)])
    @doc_it()
    def test_11465_check_datetime_picker_display(self, browser, value, set_time, collection_name, record_id, gen_data):
        """
        The user goes on form and selects document.
        The user audits field with datatype: datetime.
        The user sets up only date.
        Check that time is set by default to 00:00:00.
        The user sets up time and checks that displayed time is exactly the same as user set up.
        """
        errors = []
        login_and_go_to_url(browser, collection_name, record_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        row_ids = validation.get_all_ids_from_field_with_sub_ranges(AMOUNTS_AND_RATES)
        prev_value = validation.get_cell_value_by_row_number_and_column_name(AMOUNTS_AND_RATES, 1,
                                                                             DATETIME_COLLECTED_UTC)
        prev_time = prev_value[prev_value.find("T") + 1:prev_value.rfind(".")]
        validation.select_sub_table_row_by_id(row_ids[0])
        if set_time:
            input_val = value + set_time
            converted_val = f"{input_val[:4]}-{input_val[4:6]}-{input_val[6:8]} {set_time[:2]}:{set_time[2:4]}:{set_time[4:]}"
        else:
            input_val = value
            converted_val = f"{input_val[:4]}-{input_val[4:6]}-{input_val[6:8]} {prev_time}"
        field = {
            NAME: DATETIME_COLLECTED_UTC,
            NEW_VALUE: input_val,
            params.MIXED_VALUE: True,
            TYPE: DATE_TYPE,
            params.PARENT: AMOUNTS_AND_RATES,
            params.ROW_ID: row_ids[0],
            VALID: False
        }
        errors += audit_field(browser, field)
        validation.open_calendar(field[NAME], AMOUNTS_AND_RATES)
        calendar_time = validation.get_time_from_calendar()
        set_value_from_input = validation.get_time_from_input(AMOUNTS_AND_RATES,
                                                              DATETIME_COLLECTED_UTC)
        if set_time:
            if set_time.startswith("0"):
                calendar_time_to_be = converted_val[converted_val.index(" ") + 2:-3]
            else:
                calendar_time_to_be = converted_val[converted_val.index(" ") + 1:-3]
            converted_cal = convert24(calendar_time)
            if converted_cal != calendar_time_to_be:
                errors.append(f"expected calendar time to be converted: {calendar_time_to_be} got {converted_cal}")
            if converted_val != set_value_from_input:
                errors.append(f"expected input to be {converted_val} got {set_value_from_input}")
        assert errors == []


@pytest.mark.usefixtures("remove_files")
class TestUnitAuditWithoutGenData:
    @pytest.mark.check_form_displayed_fields
    @doc_it()
    def test_check_displayed_fields_on_audit_form(self, browser):
        """
        The user selects document from collection.
        The user goes to audit form.
        Check that fields that are displayed on form are the same as set in
        configuration as DefaultFieldsToDisplayInAuditSession
        excluding UnDisplayableFields.
        Check is done for low level and high level fields
        """

        errors = []
        doc_id = 1
        collection_name = TESTING_HALINA
        record_from_db = find_docs_in_collection(collection_name, {RECORD_ID: doc_id})
        # all visible fields including ImageLinks and fields with sub-ranges
        doc_config = find_docs_in_collection(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name})
        config_visible_fields = [x for x in doc_config[DEFAULT_AUDIT_FIELDS] if
                                 x not in doc_config[UN_DISPLAYABLE_FIELDS] and type(x) != dict]
        # get currentState keys from doc:
        state_before_upd = record_from_db[CURRENT_STATE]
        # doc fields:
        state_before_upd_keys = list(state_before_upd.keys())
        fields_to_be_displayed_all = set(state_before_upd_keys).intersection(set(config_visible_fields))
        image_links_field = [x for x in state_before_upd_keys if isinstance(state_before_upd[x], dict)]
        fields_with_sub_ranges = [x for x in state_before_upd_keys if
                                  isinstance(state_before_upd[x], (list, tuple, set))]
        fields_to_be_displayed = fields_to_be_displayed_all - set(image_links_field)
        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        # for elements without ranges:
        fields_on_form_high_level = [x for x in validation.get_column_name_from_tr() if x]
        fields_on_form_with_sub_range = validation.get_text_from_fields_with_sub_range()

        errors += check_fields_on_form_values(fields_on_form_high_level, fields_to_be_displayed)
        errors += check_fields_on_form_values(fields_with_sub_ranges, fields_on_form_with_sub_range)
        errors += check_sub_range_values_on_form(fields_on_form_with_sub_range, state_before_upd, validation)

        assert errors == []

    @pytest.mark.check_updatable_fields_are_not_editable
    @doc_it()
    def test_11737_check_updatable_fields_are_not_editable(self, browser):
        """
        The user goes on form and checks that fields that are in update_logics are not editable
        for both high-level and low-level field
        """
        errors = []
        doc_id = 1
        collection_name = TESTING_HALINA
        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        if validation.check_dropdown("capital"):
            errors.append(f"Dropdown for field capital is visible but should be not")
        row_ids = validation.get_all_ids_from_field_with_sub_ranges(CONSUMER_MARGINS)
        validation.select_sub_table_row_by_id(row_ids[0])
        if validation.check_dropdown("fx_margin", row_ids[0]):
            errors.append(f"Dropdown for field capital is visible but should be not")
        assert errors == []

    @pytest.mark.check_11846
    @doc_it()
    @pytest.mark.parametrize("collection_name", [TESTING_HALINA])
    def test_11846_required_score_notification_display(self, browser, collection_name, gen_data):
        """
        The user tries to make empty audit and sets score.
        Check that notification about empty audit is displayed before
        score required check.
        """
        errors = []
        record_id = 2
        # set score as required
        update_mongo(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name},
                     {"$set": {"ConfidenceScoreRequired": True}})
        # check value is displayed on search screen:
        login_and_go_to_url(browser, collection_name, record_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        # set field as valid and save doc:
        field = {
            NAME: "Author",
            NEW_VALUE: Faker().name(),
            TYPE: TEXT,
            VALID: False
        }
        errors += audit_field(browser, field)
        validation.save_form_changes()
        # check notification is displayed
        if not validation.check_required_notif():
            errors.append(f"Expect required field notification is displayed on the form")
        field[NEW_VALUE] = 1
        validation.set_score("Confident")
        errors += audit_field(browser, field)
        validation.save_form_changes()
        update_mongo(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name},
                     {"$set": {"ConfidenceScoreRequired": False}})
        if validation.check_required_notif():
            errors.append(f"Expect required field notification is not displayed on the form")
        assert errors == []

    @pytest.mark.delete_all_record_from_sub_table
    @doc_it()
    @pytest.mark.parametrize("collection_name", [TESTING_HALINA])
    def test_11878_check_delete_all_records(self, browser, collection_name, gen_data):
        """
        Correct configuration with DefaultFieldsToDisplayInAuditSession for low-level fields is set.
        The user deletes all records from sub-table and checks if
        table has correct display
        """
        errors = []
        doc_id = 7
        # check value is displayed on search screen:
        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        # get number of rows for table:
        row_ids = validation.get_all_ids_from_field_with_sub_ranges(CONSUMER_MARGINS)
        for el in row_ids:
            validation.remove_sub_table_row(el)
        # click on save btn:
        validation.save_form_changes()
        alert_text = validation.get_alert_text()
        if texts.SUCCESSFULLY_UPDATED not in alert_text:
            errors.append(f"expected notification {texts.SUCCESSFULLY_UPDATED}, got {alert_text}")
        validation.confirm_alert()
        # check that form is not broken:
        if not validation.check_sub_table_is_displayed(CONSUMER_MARGINS):
            errors.append(f"expected table ConsumerMargins is visible")
        if not validation.check_sub_table_is_displayed(COMMERCIAL_MARGINS):
            errors.append(f"expected table CommercialMargins is visible")
        assert errors == []

    @pytest.mark.check_boolean_fields_display
    @doc_it()
    def test_11919_check_boolean_fields_display(self, browser):
        """
        The user checks that boolean fields
        have correct display on search, audit and middle screens
        """
        errors = []
        doc_id = 2
        collection_name = TESTING_HALINA
        # check value is displayed on search screen:
        login_to_app(browser)
        set_filters(browser, [{params.VALUE: doc_id}], collection_name)
        page = SearchPage(browser)
        cell_text = page.get_cell_values(CLIENT_TYPE)[0]
        if not cell_text:
            errors.append(f"expected value True or False, got {cell_text}")
        # go to doc:
        select_record_by_cell_key_value(browser, doc_id, collection_name)
        # check field value for ClientType:
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        client_type_text = validation.get_cell_val_by_name(CLIENT_TYPE)
        if not client_type_text:
            errors.append(f"expected value True or False, got {client_type_text}")
        # check low level fields:
        params.ROW_ID = validation.get_all_ids_from_field_with_sub_ranges(CONSUMER_MARGINS)[0]
        low_level_cell_text = validation.get_cell_val_by_name(WAS_REVIEWED, params.ROW_ID, CONSUMER_MARGINS)
        if not low_level_cell_text:
            errors.append(f"expected value True or False, got {low_level_cell_text}")
        # check middle screen display:
        validation.show_middle_screen()
        middle_cell_value = validation.get_middle_screen_cell_value("ClientType")
        if not middle_cell_value:
            errors.append(f"expected value True or False, got {middle_cell_value}")
        assert errors == []

    @pytest.mark.check_visible_notification
    @doc_it()
    @pytest.mark.parametrize("collection_name", [TESTING_HALINA])
    def test_11945_check_fixed_header_overlap_notification(self, browser, collection_name, gen_data):
        """
        The user selects document.
        The user marks field as invalid and gets notification.
        Check that notification is not overlapped and is visible to the user
        """
        errors = []
        doc_id = 2
        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        # not remove fixed header and validate field:
        field = {
            NAME: AREA_KM2,
            NEW_VALUE: "GBP",
            TYPE: NUMERIC,
            VALID: False
        }
        errors += audit_field(browser, field)
        validation.save_form_changes()
        if not validation.get_notification(field[NAME]):
            errors.append(f"missing notification for non-valid value field")
        assert errors == []

    @pytest.mark.check_nullable
    @pytest.mark.parametrize("collection_name", [TESTING_HALINA])
    def test_nullable(self, browser, collection_name, gen_data):
        """
        User sets up nullable for field and checks
        if the field passes.
        """
        errors = []
        doc_id = 5
        update_mongo(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name},
                     {"$pull": {VALIDATORS: {NAME: "Author"}}})
        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        for field in [{
            NAME: AUTHOR,
            NEW_VALUE: None,
            params.NEW_VALUE_PASS: True,
            TYPE: TEXT,
            VALID: False
        },
            # Non set low level field
            {
                NAME: "org_name",
                NEW_VALUE: None,
                params.PARENT: COMMERCIAL_MARGINS,
                params.NEW_VALUE_PASS: True,
                COMMENT: "New set org_name",
                TYPE: TEXT,
                VALID: False
            },
            # Text high level field
            {
                NAME: RESEARCHER_NAME,
                NEW_VALUE: None,
                params.NEW_VALUE_PASS: True,
                TYPE: TEXT,
                VALID: False
            },
            # Text low level field
            {
                NAME: "org_name",
                NEW_VALUE: None,
                params.PARENT: CONSUMER_MARGINS,
                params.NEW_VALUE_PASS: True,
                TYPE: TEXT,
                VALID: False
            },
            # Numeric high level field
            {
                NAME: "number_of_lakes",
                NEW_VALUE: None,
                params.NEW_VALUE_PASS: True,
                TYPE: NUMERIC,
                VALID: False
            },
            # Numeric low level field
            {
                NAME: "number_of_providers",
                NEW_VALUE: None,
                params.PARENT: CONSUMER_MARGINS,
                params.NEW_VALUE_PASS: True,
                TYPE: NUMERIC,
                VALID: False
            },
            # Enum high level field
            {
                NAME: "language",
                NEW_VALUE: None,
                params.NEW_VALUE_PASS: True,
                TYPE: ENUM,
                VALID: False
            },
            # Enum low level field
            {
                NAME: "is_consumer",
                NEW_VALUE: None,
                params.PARENT: CONSUMER_MARGINS,
                params.NEW_VALUE_PASS: True,
                TYPE: ENUM,
                VALID: False
            },
            # Nullable false:
            {
                NAME: CURRENCY_FROM,
                NEW_VALUE: None,
                params.NEW_VALUE_PASS: False,
                TYPE: NUMERIC,
                VALID: False
            },
            {
                NAME: FX_RATE,
                NEW_VALUE: None,
                params.PARENT: COMMERCIAL_MARGINS,
                params.NEW_VALUE_PASS: False,
                TYPE: NUMERIC,
                VALID: False
            },
            {
                NAME: "timestamp",
                NEW_VALUE: None,
                params.PARENT: CONSUMER_MARGINS,
                params.NEW_VALUE_PASS: True,
                TYPE: DATE_TYPE,
                VALID: False
            },
            {
                NAME: "CollectedDate",
                NEW_VALUE: None,
                params.MIXED_VALUE: True,
                params.NEW_VALUE_PASS: True,
                TYPE: DATE_TYPE,
                VALID: False
            }]:

            if params.PARENT in field:
                row_ids = validation.get_all_ids_from_field_with_sub_ranges(field[params.PARENT])
                field[params.ROW_ID] = row_ids[0]
                validation.select_sub_table_row_by_id(field[params.ROW_ID])
                table_name = field[params.PARENT]
            else:
                table_name = None
            errors += audit_field(browser, field)
            validation.save_form_changes()
            if field[params.NEW_VALUE_PASS]:
                alert_text = validation.get_alert_text()
                if texts.SUCCESSFULLY_UPDATED not in alert_text:
                    errors.append(f"expected notification {texts.SUCCESSFULLY_UPDATED}, got {alert_text}")
            else:
                if not validation.get_notification(field[NAME], table_name):
                    errors.append(f"missing notification for non-valid value field")
            validation.confirm_alert()
        assert errors == []

    @pytest.mark.check_11853
    @doc_it()
    @pytest.mark.parametrize("field", [{NAME: "ib_rate",
                                        NEW_VALUE: 99.99,
                                        params.PARENT: COMMERCIAL_MARGINS,
                                        TYPE: NUMERIC,
                                        VALID: False
                                        },
                                       {
                                           NAME: "area_km2",
                                           NEW_VALUE: 1000,
                                           TYPE: NUMERIC,
                                           VALID: False
                                       }
                                       ])
    @pytest.mark.parametrize("collection_name", [TESTING_HALINA])
    def test_11853_check_notification_on_dependent_calculated_text_field(self, browser, field, collection_name,
                                                                         gen_data):
        """
        User sets up new value for the field that causes update_logics
        Updated field is calculated and defined as text.
        Check that notification is displayed about field type
        """
        errors = []
        doc_id = 1
        primary_config = find_docs_in_collection(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name})
        population_density_validator = [x for x in primary_config[VALIDATORS] if x[NAME] == POPULATION_DENSITY]
        full_cost_validator = [x for x in primary_config[VALIDATORS] if x[NAME] == f"{COMMERCIAL_MARGINS}.{FULL_COST}"]
        update_mongo(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name},
                     {"$pull": {VALIDATORS: {NAME: POPULATION_DENSITY},
                                VALIDATORS: {NAME: f"{COMMERCIAL_MARGINS}.{FULL_COST}"}}})
        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        if params.PARENT in field:
            row_ids = validation.get_all_ids_from_field_with_sub_ranges(field[params.PARENT])
            field[params.ROW_ID] = row_ids[0]
            validation.select_sub_table_row_by_id(row_ids[0])
            errors += audit_field(browser, field)
        else:
            errors += audit_field(browser, field)

        validation.save_form_changes()
        alert_text = validation.get_alert_text()
        update_mongo(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name},
                     {"$push": {VALIDATORS: population_density_validator, VALIDATORS: full_cost_validator}})
        if texts.DEFINED_AS_TEXT not in alert_text:
            errors.append(f"expected notification about field defined as text, got {alert_text}")
        assert errors == []

    @pytest.mark.check_nan
    @doc_it()
    @pytest.mark.parametrize("field", [{
        NAME: "population",
        NEW_VALUE: None,
        TYPE: NUMERIC,
        VALID: False
    },
        {
            NAME: "area_km2",
            NEW_VALUE: 0,
            TYPE: NUMERIC,
            VALID: False
        },
        {
            NAME: "area_km2",
            NEW_VALUE: None,
            TYPE: NUMERIC,
            VALID: False
        }
    ])
    @pytest.mark.parametrize("collection_name", [TESTING_HALINA])
    def test_11853_nan_for_nulls_and_zeros(self, browser, field, collection_name, gen_data):
        """
        The user sets up null to the fields that are in formula.
        Check that notification is displayed to the user about NaN of Inf
        value
        """
        errors = []
        doc_id = 1
        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        errors += audit_field(browser, field)
        validation.save_form_changes()
        alert_text = validation.get_alert_text()
        if (texts.RETURNS_NAN and texts.CANNOT_BE_NULL) not in alert_text:
            errors.append(f"expected notification about NaN, got {alert_text}")
        assert errors == []

    @doc_it()
    @pytest.mark.gt_check
    @pytest.mark.parametrize("field", [
        {NAME: "number_of_lakes",
         NEW_VALUE: 1,
         params.NEW_VALUE_PASS: False,
         TYPE: NUMERIC,
         VALID: False
         },
        {NAME: "number_of_lakes",
         NEW_VALUE: 1.001,
         params.NEW_VALUE_PASS: True,
         TYPE: NUMERIC,
         VALID: False
         },
        {NAME: "number_of_lakes",
         NEW_VALUE: 0.99999,
         params.NEW_VALUE_PASS: False,
         TYPE: NUMERIC,
         VALID: False
         },
        {NAME: GDP_GROWTH,
         NEW_VALUE: -5,
         params.NEW_VALUE_PASS: True,
         TYPE: NUMERIC,
         VALID: False
         },
        {NAME: GDP_GROWTH,
         NEW_VALUE: -5.001,
         params.NEW_VALUE_PASS: False,
         TYPE: NUMERIC,
         VALID: False
         },
        {NAME: GDP_GROWTH,
         NEW_VALUE: 0,
         params.NEW_VALUE_PASS: True,
         TYPE: NUMERIC,
         VALID: False
         },
        {NAME: GDP_GROWTH,
         NEW_VALUE: -4.9999,
         params.NEW_VALUE_PASS: True,
         TYPE: NUMERIC,
         VALID: False
         },
        {NAME: GDP_GROWTH,
         NEW_VALUE: 20.001,
         params.NEW_VALUE_PASS: False,
         TYPE: NUMERIC,
         VALID: False
         },
        {NAME: GDP_GROWTH,
         NEW_VALUE: 19.9999,
         params.NEW_VALUE_PASS: True,
         TYPE: NUMERIC,
         VALID: False
         },
        {NAME: GDP_GROWTH,
         NEW_VALUE: 1000000000,
         params.NEW_VALUE_PASS: False,
         TYPE: NUMERIC,
         VALID: False
         },
        {NAME: GDP_GROWTH,
         NEW_VALUE: 20,
         params.NEW_VALUE_PASS: True,
         TYPE: NUMERIC,
         VALID: False
         },
        {NAME: FX_RATE,
         NEW_VALUE: 0.1,
         params.PARENT: CONSUMER_MARGINS,
         params.NEW_VALUE_PASS: False,
         TYPE: NUMERIC,
         VALID: False
         },
        {NAME: FX_RATE,
         NEW_VALUE: 100,
         params.PARENT: CONSUMER_MARGINS,
         params.NEW_VALUE_PASS: False,
         TYPE: NUMERIC,
         VALID: False
         },
        {NAME: FX_RATE,
         NEW_VALUE: 0.1111,
         params.PARENT: CONSUMER_MARGINS,
         params.NEW_VALUE_PASS: True,
         TYPE: NUMERIC,
         VALID: False
         },
        {NAME: "ib_rate",
         NEW_VALUE: 0.01,
         params.PARENT: CONSUMER_MARGINS,
         params.NEW_VALUE_PASS: False,
         TYPE: NUMERIC,
         VALID: False
         },
        {NAME: "ib_rate",
         NEW_VALUE: 0.009,
         params.PARENT: CONSUMER_MARGINS,
         params.NEW_VALUE_PASS: False,
         TYPE: NUMERIC,
         VALID: False
         },
        {NAME: "ib_rate",
         NEW_VALUE: 0.011,
         params.PARENT: CONSUMER_MARGINS,
         params.NEW_VALUE_PASS: True,
         TYPE: NUMERIC,
         VALID: False
         },
        {NAME: "ib_rate",
         NEW_VALUE: 100,
         params.PARENT: CONSUMER_MARGINS,
         params.NEW_VALUE_PASS: False,
         TYPE: NUMERIC,
         VALID: False
         },
        {NAME: "ib_rate",
         NEW_VALUE: 99.99,
         params.PARENT: CONSUMER_MARGINS,
         params.NEW_VALUE_PASS: True,
         TYPE: NUMERIC,
         VALID: False
         }
    ])
    @pytest.mark.parametrize("collection_name", [TESTING_HALINA])
    def test_gt_gte_lt_lte_input_constraints(self, browser, field, collection_name, gen_data):
        """
        The user enters values for fields with constraints.
         The user sets field.
         Expected pass for input is the same as field[params.NEW_VALUE_PASS]
        """
        # todo: add to ui jest
        errors = []
        doc_id = 1
        update_mongo(collection_name, {RECORD_ID: doc_id}, {"$set": {
            f"{CURRENT_STATE}.{CONSUMER_MARGINS}.$[].{FX_RATE}": 0}})
        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        if params.PARENT in field:
            row_ids = validation.get_all_ids_from_field_with_sub_ranges(field[params.PARENT])
            field[params.ROW_ID] = row_ids[0]
            validation.select_sub_table_row_by_id(row_ids[0])
            errors += audit_field(browser, field)
            table_name = field[params.PARENT]
        else:
            errors += audit_field(browser, field)
            table_name = None
        validation.save_form_changes()

        if field[params.NEW_VALUE_PASS]:
            # alert successful
            alert_text = validation.get_alert_text()
            if texts.SUCCESSFULLY_UPDATED not in alert_text:
                errors.append(f"expected text in alert to contain {texts.SUCCESSFULLY_UPDATED} got: {alert_text}")
        else:
            if not validation.get_notification(field[NAME], table_name):
                errors.append(f"missing notification for non-valid value field, params: {field}")
        assert errors == []

    @pytest.mark.type_mismatch
    @doc_it()
    @pytest.mark.parametrize("collection_name", [TESTING_HALINA])
    def test_type_mismatch(self, browser, collection_name, gen_data):
        """
        The user marks fields as invalid that are numeric
        and tries to set up text values to the fields.
        """
        # todo: add to ui jest
        errors = []
        doc_id = 1
        login_and_go_to_url(browser, collection_name, doc_id)
        fields = {
            "high": {NAME: GDP_GROWTH,
                     NEW_VALUE: TEXT,
                     TYPE: NUMERIC,
                     VALID: False
                     },
            "low": {
                NAME: "amount",
                NEW_VALUE: TEXT,
                params.PARENT: CONSUMER_MARGINS,
                TYPE: NUMERIC,
                VALID: False
            }
        }
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        row_ids = validation.get_all_ids_from_field_with_sub_ranges(fields["low"][params.PARENT])

        fields["low"][params.ROW_ID] = row_ids[0]

        errors += audit_field(browser, fields["high"])
        validation.select_sub_table_row_by_id(row_ids[0])
        errors += audit_field(browser, fields["low"])
        validation.save_form_changes()
        if not validation.get_notification(fields["high"][NAME], None):
            errors.append(f"missing notification for high level field")

        if not validation.get_notification(fields["low"][NAME], fields["low"][params.PARENT]):
            errors.append(f"missing notification for low level field")
        assert errors == []

    @pytest.mark.color_cell
    @doc_it()
    def test_11924_low_fields_mark(self, browser):
        """
        The user clicks on 1 row and marks field as invalid and value empty
        The user clicks on second row and marks value as valid
        The user clicks on third row and marks value as invalid and sets new value.
        Expected result: each changed cell is colored to yellow
        """
        errors = []
        collection_name = TESTING_HALINA
        doc_id = 4
        login_and_go_to_url(browser, collection_name, doc_id)
        field = {
            NAME: "amount",
            NEW_VALUE: random.randint(1002, 5000),
            params.PARENT: CONSUMER_MARGINS,
            TYPE: NUMERIC,
            VALID: False
        }
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        row_ids = validation.get_all_ids_from_field_with_sub_ranges(field[params.PARENT])

        field[params.ROW_ID] = row_ids[0]
        # click on next row:
        validation.select_sub_table_row_by_id(row_ids[0])
        errors += audit_field(browser, field)

        field[params.ROW_ID] = row_ids[1]
        # click on next row:
        validation.select_sub_table_row_by_id(row_ids[1])
        field[NEW_VALUE] = None
        errors += audit_field(browser, field)
        # click on next row:
        validation.select_sub_table_row_by_id(row_ids[2])
        field[params.ROW_ID] = row_ids[2]
        errors += audit_field(browser, field)
        # click on next row:
        validation.select_sub_table_row_by_id(row_ids[3])
        cell_index = validation.get_index_of_sub_table_header(field[params.PARENT], field[NAME])
        audited_new_value = validation.check_cell_style(row_ids[0], cell_index)
        audited_set_true = validation.check_cell_style(row_ids[1], cell_index)
        audited_set_null = validation.check_cell_style(row_ids[2], cell_index)
        if not audited_new_value or not audited_set_true or not audited_set_null:
            errors.append(f"expected all cells to be colored (value true), got: \n"
                          f"1. Audited with new value: {audited_new_value}\n"
                          f"2. Audited with true: {audited_set_true}\n"
                          f"3. Audited with null value: {audited_set_null}")
        assert errors == []

    @pytest.mark.required_score
    @doc_it()
    @pytest.mark.parametrize("collection_name", [TESTING_HALINA])
    def test_11922_required_score(self, browser, collection_name, gen_data):
        """
        The user tries to click save button without any data changes
        The user changes one field and clicks save button and gets notification message about required score.
        The user audits field and sets audit score.
        Check that score on form is the same as set in DB.
        """
        errors = []
        # set score as required
        doc_id = 4
        update_mongo(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name},
                     {"$set": {"ConfidenceScoreRequired": True}})
        update_mongo(collection_name, {RECORD_ID: doc_id},
                     {"$set": {f"{AUDIT_STATE}.{CONFIDENCE_SCORE}": None, AUDIT_SESSIONS: []}})
        score = "Unsure"
        login_and_go_to_url(browser, collection_name, doc_id)
        dt = datetime.strftime(datetime.utcnow(), "%Y-%m-%dT%H:%M:%S")

        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        validation.save_form_changes()
        alert_text = validation.get_alert_text()
        if texts.NO_CHANGED_DATA not in alert_text:
            errors.append(f"Expected text in alert to be: {texts.NO_CHANGED_DATA}, but got {alert_text}")
        validation.confirm_alert()
        field_to_change = {NAME: "Author", NEW_VALUE: Faker().name(), TYPE: TEXT, VALID: False}
        errors += audit_field(browser, field_to_change)
        validation.save_form_changes()
        if not validation.check_required_notif():
            errors.append(f"Expect required field notification is displayed on the form")
        field = {NAME: "Author", TYPE: TEXT, VALID: True}
        errors += audit_field(browser, field)
        validation.set_score(score)
        validation.save_form_changes()
        validation.confirm_alert()
        update_mongo(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name},
                     {"$set": {"ConfidenceScoreRequired": False}})
        # check confidence score in document after audit:
        doc_config = find_docs_in_collection(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name})
        score_to_be = map_confidence_score_by_value(doc_config, score)
        record_after_upd = find_docs_in_collection(collection_name, {RECORD_ID: doc_id})
        if record_after_upd[AUDIT_STATE][CONFIDENCE_SCORE] != score_to_be:
            errors.append(f"expected score to be {score_to_be}, but in doc {record_after_upd[CONFIDENCE_SCORE]}")
        errors += compare_elk_logs(dt, collection=collection_name, update_success=True)
        assert errors == []

    @pytest.mark.btn_hide_table
    @doc_it()
    def test_11934_btn_hide_table(self, browser):
        """
        The user clicks on hide table btn, table should become invisible
        The user checks that table appears in add dropdown list and after
        the user clicks on add btn table is added on the form. Additional check that
        no changed are recorded to DB
        """
        errors = []
        collection_name = TESTING_HALINA
        doc_id = 1
        table_name = CONSUMER_MARGINS
        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        if not validation.hide_table(table_name):
            errors.append(f"Table was not hidden after hide btn click")
        validation.add_field_on_form(table_name)
        if not validation.check_table_displayed(table_name):
            errors.append(f"element {table_name} not displayed after was selected to be added")
        assert errors == []

    @pytest.mark.types_mismatch
    @doc_it()
    @pytest.mark.parametrize("collection_name", [TESTING_HALINA])
    def test_notification_field(self, browser, collection_name, gen_data):
        """
        population_density is set as text field in DB
        The user tries to update field population that causes formula
        update to population_density.
        Check that notification is displayed about
        field is marked as text
        """
        field = {
            NAME: "population",
            NEW_VALUE: random.randint(1, 10000),
            TYPE: NUMERIC,
            VALID: False
        }
        errors = []
        doc_id = 4
        primary_config = find_docs_in_collection(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name})
        validator_for_push = [x for x in primary_config[VALIDATORS] if x[NAME] == POPULATION_DENSITY][0]
        update_mongo(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name},
                     {"$pull": {VALIDATORS: {NAME: POPULATION_DENSITY}}})
        old_value = find_docs_in_collection(collection_name, {RECORD_ID: doc_id})[CURRENT_STATE]["population"]
        login_and_go_to_url(browser, collection_name, doc_id)
        dt = datetime.strftime(datetime.utcnow(), "%Y-%m-%dT%H:%M:%S")
        notification = "population_density_(person/km2) is defined as text"
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        errors += audit_field(browser, field)
        validation.save_form_changes()
        # check that alert about type is displayed:
        alert_text = validation.get_alert_text()
        if notification not in alert_text:
            errors.append(f"no notification is displayed for types mismatch")
        validation.confirm_alert()
        update_mongo(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name},
                     {"$push": {VALIDATORS: validator_for_push}})
        upd_doc = find_docs_in_collection(collection_name, {RECORD_ID: doc_id})
        audited = upd_doc[AUDIT_SESSIONS][-1][AUDIT_VALUE_ARRAY]
        errors += compare_audits(audited[0], field[NAME], old_value, field[NEW_VALUE], field[VALID], None)
        errors += compare_elk_logs(dt, audit_session=audited, collection=collection_name, update_success=True,
                                   notification=notification)

        assert errors == []

    @pytest.mark.single_audit_session
    @doc_it()
    @pytest.mark.parametrize("collection_name", [TESTING_HALINA])
    def test_single_audit_session(self, browser, collection_name, gen_data):
        """
        The user audits several fields and checks
        that single audit session was created in DB.
        """
        fields = {
            "high_order": {
                NAME: GDP_GROWTH,
                NEW_VALUE: random.randint(2, 15),
                TYPE: NUMERIC,
                VALID: False
            },
            "qa": {
                NAME: "amount",
                NEW_VALUE: random.randint(5500, 5700),
                params.PARENT: CONSUMER_MARGINS,
                TYPE: NUMERIC,
                VALID: False
            }
        }
        errors = []
        doc_id = 4
        login_and_go_to_url(browser, collection_name, doc_id)
        dt = datetime.strftime(datetime.utcnow(), "%Y-%m-%dT%H:%M:%S")
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        # set high level fields
        errors += audit_field(browser, fields["high_order"])
        # set low level fields:
        row_id = validation.get_all_ids_from_field_with_sub_ranges(fields["qa"][params.PARENT])[0]
        fields["qa"][params.ROW_ID] = row_id
        validation.select_sub_table_row_by_id(row_id)
        errors += audit_field(browser, fields["qa"])
        validation.save_form_changes()
        time.sleep(1)
        updated_record_from_db = find_docs_in_collection(collection_name, {RECORD_ID: doc_id})
        # check number of audits is 0 and all fields are inside audit session:
        if len(updated_record_from_db[AUDIT_SESSIONS]) != 1:
            errors.append(
                f"number of audit sessions expected to be 1 got: {len(updated_record_from_db[AUDIT_SESSIONS])}")
        if len(updated_record_from_db[AUDIT_SESSIONS][-1][AUDIT_VALUE_ARRAY]) != 2:
            errors.append(
                f"expected number of sessions to be 2, got: {len(updated_record_from_db[AUDIT_SESSIONS][0][AUDIT_VALUE_ARRAY])}")
        audited_fields = [x[AUDIT_FIELD_NAME] for x in
                          updated_record_from_db[AUDIT_SESSIONS][0][AUDIT_VALUE_ARRAY]]
        qa_field = fields["qa"][params.PARENT] + "." + row_id.replace(fields["qa"][params.PARENT], '') + "." + \
                   fields["qa"][
                       NAME]
        if set(audited_fields) != {fields["high_order"][NAME], qa_field}:
            errors.append(
                f"expected list of audits: {[fields['high_order'][NAME], qa_field]} but got {set(audited_fields)}")
        # check for each update that no audit type was added:
        for audit in updated_record_from_db[AUDIT_SESSIONS][0][AUDIT_VALUE_ARRAY]:
            if AUDIT_TYPE in audit:
                errors.append(f"expected field AuditType is not present in auditArray, got present")
        errors += compare_elk_logs(dt, collection=collection_name, update_success=True,
                                   audit_session=updated_record_from_db[AUDIT_SESSIONS][0][AUDIT_VALUE_ARRAY])
        assert errors == []

    @pytest.mark.hof_check_audit_records
    @doc_it()
    def test_audit_hof_audit_sessions_records(self, browser):
        """
        The user makes audit for hof
        and checks that db changes present
        and elk changes are set
        :param browser:
        :return:
        """
        errors = []
        collection_name = TESTING_HALINA
        doc_id = 4
        field_without_upd_logics = {
            NAME: AUTHOR,
            NEW_VALUE: Faker().name(),
            COMMENT: Faker().name(),
            TYPE: TEXT,
            VALID: False
        }
        field_with_dep_upd_logics = {
            NAME: "population",
            NEW_VALUE: random.randint(1000, 5000),
            TYPE: NUMERIC,
            VALID: False
        }
        login_and_go_to_url(browser, collection_name, doc_id)
        record_from_db = find_docs_in_collection(collection_name, {RECORD_ID: doc_id})
        dt = datetime.strftime(datetime.utcnow(), "%Y-%m-%dT%H:%M:%S")
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        errors += audit_field(browser, field_without_upd_logics)

        # set values for field with updated_logics:
        errors += audit_field(browser, field_with_dep_upd_logics)
        validation.save_form_changes()
        updated_record_from_db = find_docs_in_collection(collection_name, {RECORD_ID: doc_id})
        if updated_record_from_db[CURRENT_STATE][field_without_upd_logics[NAME]] != \
                field_without_upd_logics[
                    NEW_VALUE]:
            errors.append(
                f"expected value of current state for {[field_without_upd_logics[NAME]]} to be {[field_without_upd_logics[NEW_VALUE]]} but received from DB: {updated_record_from_db[CURRENT_STATE][field_without_upd_logics[NAME]]}")

        # check that only 1 audit session was created:
        if updated_record_from_db[AUDIT_STATE][AUDIT_NUMBER] != 1:
            errors.append(
                f"expected number of created audits: 1, received: {updated_record_from_db[AUDIT_STATE][AUDIT_NUMBER]}")
        # check values:
        audited_fields = [x for x in updated_record_from_db[AUDIT_SESSIONS][0][
            AUDIT_VALUE_ARRAY]]
        for item in audited_fields:
            for el in [field_with_dep_upd_logics, field_without_upd_logics]:
                if el["name"] == item[AUDIT_FIELD_NAME]:
                    if item[OLD_VALUE] != record_from_db[CURRENT_STATE][el[
                        NAME]]:
                        errors.append(
                            f"expected old value for {item[AUDIT_FIELD_NAME]} in audit session to be {record_from_db[CURRENT_STATE][el['name']]} received: {item[OLD_VALUE]}")
                    if item[NEW_VALUE] != el[NEW_VALUE]:
                        errors.append(
                            f"expected new value for {item[AUDIT_FIELD_NAME]} in audit session to be {el[NEW_VALUE]} received: {item[NEW_VALUE]}")
                    if item[VALID]:
                        errors.append(
                            f"expected valid for {item[AUDIT_FIELD_NAME]} in audit session to be false received true")
                    if "comment" in el and item[AUDITED_COMMENT] != el[COMMENT]:
                        errors.append(
                            f"expected audited comment for  {item[AUDIT_FIELD_NAME]} in audit session to be {el[COMMENT]} received {item[AUDITED_COMMENT]}")
                    elif "comment" not in el and item[AUDITED_COMMENT] is not None:
                        errors.append(
                            f"expected audited comment for  {item[AUDIT_FIELD_NAME]} in audit session to be empty received {item[AUDITED_COMMENT]}")

        # Note: autoupdates are switched off
        errors += compare_elk_logs(dt, audited_fields, collection_name, True)
        errors += compare_elk_logs(dt, audited_fields, collection_name, True)
        assert errors == []

    @doc_it()
    @pytest.mark.marks_valid_hof
    @pytest.mark.parametrize("collection_name", [TESTING_HALINA])
    def test_user_marks_valid_hof(self, browser, collection_name, gen_data):
        """
        The user marks hof field as valid.
        Check audit session is correct.
        Check updated field.
        Check old and new value in audit session.
        Check audit Number is incremented.
        Check audit value array is incremented.
        Check valid field is set to true in audit session.
        Check RegisteredUserEmail is set to user email
        """
        # todo: add to jest
        errors = []
        doc_id = 3
        field = {NAME: "Author", TYPE: TEXT, VALID: True}
        login_and_go_to_url(browser, collection_name, doc_id)
        record_from_db = find_docs_in_collection(collection_name, {RECORD_ID: doc_id})
        dt = datetime.strftime(datetime.utcnow(), "%Y-%m-%dT%H:%M:%S")
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        errors += audit_field(browser, field)
        validation.save_form_changes()
        validation.confirm_alert()
        updated_record_from_db = find_docs_in_collection(collection_name, {RECORD_ID: doc_id})
        if updated_record_from_db[CURRENT_STATE][field[NAME]] != record_from_db[
            CURRENT_STATE][
            field[NAME]]:
            errors.append(
                f"updated field value is: {updated_record_from_db[CURRENT_STATE][field[NAME]]} expected: {record_from_db[CURRENT_STATE][field[NAME]]}")
        if updated_record_from_db[AUDIT_STATE][AUDIT_NUMBER] != 1:
            errors.append(
                f"updated audit number is: {updated_record_from_db[AUDIT_STATE][AUDIT_NUMBER]} expected: 1")

        if len(updated_record_from_db[AUDIT_SESSIONS][-1][AUDIT_VALUE_ARRAY]) != 1:
            errors.append(
                f"audit value array is: {len(updated_record_from_db[AUDIT_SESSIONS][-1][AUDIT_VALUE_ARRAY])} expected: 1")

        if updated_record_from_db[AUDIT_SESSIONS][-1][AUDIT_VALUE_ARRAY][0][
            AUDIT_FIELD_NAME] != field[NAME]:
            errors.append(
                f"Audit field name = {updated_record_from_db[AUDIT_SESSIONS][0][AUDIT_VALUE_ARRAY][0][AUDIT_FIELD_NAME]} expected {field}")
        if updated_record_from_db[AUDIT_SESSIONS][-1][AUDIT_VALUE_ARRAY][0][
            OLD_VALUE] != record_from_db[CURRENT_STATE][field[NAME]]:
            errors.append(
                f"Audit old value = {updated_record_from_db[AUDIT_SESSIONS][-1][AUDIT_VALUE_ARRAY][0][OLD_VALUE]} expected {record_from_db[CURRENT_STATE][field[NAME]]}")
        if updated_record_from_db[AUDIT_SESSIONS][-1][AUDIT_VALUE_ARRAY][0][
            NEW_VALUE] != record_from_db[CURRENT_STATE][field[NAME]]:
            errors.append(
                f"Audit new value = {updated_record_from_db[AUDIT_SESSIONS][0][AUDIT_VALUE_ARRAY][0][NEW_VALUE]} expected {record_from_db[CURRENT_STATE][field[NAME]]}")
        if not updated_record_from_db[AUDIT_SESSIONS][-1][AUDIT_VALUE_ARRAY][0][
            VALID]:
            errors.append(
                f"expected audit value valid, got {updated_record_from_db[AUDIT_SESSIONS][-1][AUDIT_VALUE_ARRAY][0][VALID]}")

        if updated_record_from_db[AUDIT_SESSIONS][-1][AUDIT_VALUE_ARRAY][0][
            AUDITED_COMMENT] is not None:
            errors.append(f"expected audit comment to be None in audit value array")
        if updated_record_from_db[AUDIT_SESSIONS][-1][REGISTERED_USER_EMAIL] != os.getenv('DV_USER'):
            errors.append(
                f"expected RegisteredUserEmail to be {os.getenv('DV_USER')} received: {updated_record_from_db[AUDIT_SESSIONS][0][REGISTERED_USER_EMAIL]}")

        if updated_record_from_db[AUDIT_SESSIONS][-1][CONFIDENCE_SCORE] is not None:
            errors.append(
                f"expected empty confidence score, received: {updated_record_from_db[AUDIT_SESSIONS][0][CONFIDENCE_SCORE]}")
        if updated_record_from_db[AUDIT_SESSIONS][-1][NOTE_ON_CONFIDENCE_SCORE] is not None:
            errors.append(
                f"expected empty note on confidence score, received: {updated_record_from_db[AUDIT_SESSIONS][0][NOTE_ON_CONFIDENCE_SCORE]}")

        if updated_record_from_db[AUDIT_SESSIONS][-1][AUDIT_NUMBER] != 1:
            errors.append(
                f"expected counter in audit session is 1, received {updated_record_from_db[AUDIT_SESSIONS][0][AUDIT_NUMBER]}")
        errors += compare_elk_logs(dt, updated_record_from_db[AUDIT_SESSIONS][-1][AUDIT_VALUE_ARRAY], collection_name,
                                   True)
        assert errors == []

    @doc_it()
    @pytest.mark.parametrize("field", [{
        NAME: "amount_from",
        NEW_VALUE: 1000
    }, {
        NAME: "datetime_collected_utc",
        NEW_VALUE: "2017-04"
    }, {
        NAME: "fx_rate",
        NEW_VALUE: 0.9064
    }, {
        NAME: "amount_margin_approved",
        NEW_VALUE: "true"
    }])
    @pytest.mark.check_filter_in_sub_table
    def test_12063_filter_in_sub_table(self, browser, field):
        """
        The user goes to the document.
        The user enters filter for sub-table field.
        The user checks that filters are working fine for each param:
        boolean, text,  date, numeric
        """
        errors = []
        collection_name = IMTI_V_95_NE_AUD_HALINA
        doc_id = 7130
        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        validation.set_sub_table_column_filter(field[NAME], field[NEW_VALUE])
        # check column results:
        column_params = validation.get_column_values(AMOUNTS_AND_RATES, field[NAME])
        out_of_filter = [x for x in column_params if str(field[NEW_VALUE]).lower() not in x.lower()]
        if out_of_filter:
            errors.append(f"expected values are filtered only, received: {out_of_filter}")
        assert errors == []

    @pytest.mark.check_fixed_header
    @doc_it()
    def test_13705_check_alert_on_update_calculated_fields_button(self, browser):
        """
        The user search the document
        User Click Update Calculated Fields button
        User can see the Alert about the global update
        """
        # todo: fix the test
        doc_id = 1
        collection_name = TESTING_HALINA
        login_and_go_to_url(browser, collection_name, doc_id)

    @pytest.mark.check_fixed_header
    @doc_it()
    def test_11831_check_fixed_header(self, browser):
        """
        The user goes on form, scrolls to the bottom of the page
        and checks that header is still visible
        """
        doc_id = 1
        collection_name = TESTING_HALINA
        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        # scroll to CollectedDate field
        validation.scroll_to_field("CollectedDate")
        # check that show btn is displayed:
        assert validation.check_btn_is_displayed(False) is True

    @pytest.mark.check_fixed_footer
    @doc_it()
    def test_11794_check_fixed_footer(self, browser):
        """
        The user goes on form and checks that footer is displayed at once without scrolling
        """
        doc_id = 1
        collection_name = TESTING_HALINA
        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        # check that show btn is displayed:
        assert validation.check_btn_is_displayed(True) is True

    @pytest.mark.check_overlap_elements
    @doc_it()
    def test_12061_overlap_params(self, browser):
        """
        The user goes to the document.
        The user checks if columns in the table are not overlapped.
        """
        errors = []
        collection_name = IMTI_V_95_NE_AUD_HALINA
        doc_id = 18719
        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        table_columns = validation.get_sub_range_column_names(AMOUNTS_AND_RATES)
        for col in table_columns:
            if not validation.check_column_name_is_visible(AMOUNTS_AND_RATES, col):
                errors.append(f"text for column {col} is overlapped")
        assert errors == []

    @pytest.mark.copy_record
    @doc_it()
    def test_copy_record(self, browser):
        """
        The user selects number of documents.
        The user goes to one of the documents.
        The user clicks on copy btn.
        Check that a user is redirected to the newly created record.
        """
        # todo: add to jest
        errors = []
        doc_id = 1
        # get largest RecordId:
        collection_name = TESTING_HALINA
        update_mongo(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name},
                     {"$set": {"AllowCopyFunction": True}})

        last_doc_id = find_docs_in_collection(collection_name, {"$query": {}, "$orderby": {RECORD_ID: -1}})[
            RECORD_ID]
        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        validation.copy_record()
        alert_text = validation.get_alert_text()
        if texts.GOING_TO_COPY not in alert_text:
            errors.append(f"expected text to be {texts.GOING_TO_COPY} got {alert_text}")
        validation.dismiss_alert()
        validation.copy_record()
        validation.confirm_alert()
        second_alert = validation.get_alert_text()
        if texts.SUCCESSFULLY_COPIED not in second_alert:
            errors.append(f"expected text to be {texts.GOING_TO_COPY} got {second_alert}")
        validation.confirm_alert()
        # check url:
        if not validation.check_url_contains(last_doc_id + 1):
            errors.append(f"expected url contains {last_doc_id + 1}")
        last_doc_after_copy = \
            find_docs_in_collection(collection_name, {"$query": {}, "$orderby": {RECORD_ID: -1}})[
                RECORD_ID]
        if last_doc_id + 1 != last_doc_after_copy:
            errors.append(f"expected last RecordId to be {last_doc_id + 1} but got {last_doc_after_copy}")
        assert errors == []

    @pytest.mark.check_confidence_score_without_manual_upd
    @doc_it()
    @pytest.mark.parametrize("collection_name, record_id", [(IMTI_V_95_NE_AUD_HALINA, 18719)])
    def test_12161_check_confidence_score(self, browser, collection_name, record_id, gen_data):
        """
        The user selects document and changes only
        Confidence score.
        The user saves document and checks that update was successful.
        The user changes only confidence score note for the selected
        document and clicks on save button.
        The user checks that document was successfully updated
        """
        # todo: add to jest
        errors = []
        login_and_go_to_url(browser, collection_name, record_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        primary_score = validation.get_score_field()
        doc_config = find_docs_in_collection(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name})
        score_list = list(doc_config[CONFIDENCE_SCORES][CONFIDENCE_SCORE_OPTIONS].keys())
        if "--" not in primary_score:
            score_list.remove(primary_score)
        validation.set_score(score_list[0])
        validation.save_form_changes()
        alert_text = validation.get_alert_text()
        if texts.SUCCESSFULLY_UPDATED not in alert_text:
            errors.append(f"expected {texts.SUCCESSFULLY_UPDATED} to be in alert text")
        validation.confirm_alert()
        validation.set_score(score_list[1])
        validation.set_score_comment(Faker().name())
        validation.save_form_changes()
        second_alert = validation.get_alert_text()
        if texts.SUCCESSFULLY_UPDATED not in second_alert:
            errors.append(f"expected {texts.SUCCESSFULLY_UPDATED} to be in alert text 2")
        assert errors == []

    @pytest.mark.display_auto_updated_fields
    @doc_it()
    def test_12265_display_auto_updated_field(self, browser):
        """
        The user goes to the document.
        There are lists of updatable fields
        and manual overwritten fields that
        are displayed on the top of the page.
        Check that field lists are equal to set in configuration.
        updatable: get all fields from update_logics.updated_field
        manual ovewritten: get fields from updates_manual_overwrite_fields
        """
        # todo: add jest check (if backend returns proper fields)
        errors = []
        collection_name = GLOB_TEST_WITH_EXC_FOR_APP
        doc_id = 445
        doc = find_docs_in_collection(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name})
        updated_logics = doc[
            UPDATE_LOGICS]
        upd_fields = [x[UPDATED_FIELD] for x in updated_logics]
        manual_upd = doc[UPDATES_MANUAL_OVERWRITE_FIELDS]
        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        upd_fields_from_form = validation.get_auto_updated_fields()
        manual_upd_from_form = validation.get_manual_override_fields()
        if sorted(upd_fields) != sorted(upd_fields_from_form[upd_fields_from_form.index(":") + 2:].split(", ")):
            errors.append(
                f"expected updated fields list to be {sorted(upd_fields)} got {sorted(upd_fields_from_form[upd_fields_from_form.index(':') + 2:].split(', '))}")
        if sorted(manual_upd) != sorted(manual_upd_from_form[manual_upd_from_form.index(":") + 2:].split(", ")):
            errors.append(
                f"expected updated fields list to be {sorted(manual_upd)} got {sorted(manual_upd_from_form[manual_upd_from_form.index(':') + 2:].split(', '))}")
        assert errors == []

    @pytest.mark.add_sub_field
    @doc_it()
    def test_12062_add_remove_sub_field(self, browser):
        """
        The user goes to audit document form.
        The user goes to low-level field.
        The user selects column to be added to sub-field.
        The user checks that column appears on the form
        after being added.
        The user clicks on remove icon.
        Check that column was removed from the form.
        """
        errors = []
        collection_name = GLOB_TEST_WITH_EXC_FOR_APP
        doc_id = 445
        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        validation.add_sub_table_field(AMOUNTS_AND_RATES, AMOUNT_DUPLICATED)
        columns_after_add = validation.get_sub_range_column_names(AMOUNTS_AND_RATES)
        if AMOUNT_DUPLICATED not in columns_after_add:
            errors.append(f"expected {AMOUNT_DUPLICATED} to be in column list")
        if not validation.remove_column_from_sub_field(AMOUNTS_AND_RATES, AMOUNT_DUPLICATED):
            errors.append(f"expected column {AMOUNT_DUPLICATED} not to be in column list after removing")

        assert errors == []

    @pytest.mark.default_calendar_date
    @doc_it()
    def test_12308_default_calendar_date(self, browser):
        """
        The user goes to the document.
        The user validates datetime field
        and check that selected datetime is already displayed
        in the calendar and in the input
        """
        errors = []
        collection_name = GLOB_TEST_WITH_EXC_FOR_APP
        doc_id = 445
        current_state_doc = find_docs_in_collection(collection_name, {RECORD_ID: doc_id})[CURRENT_STATE][
            AMOUNTS_AND_RATES]
        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        row_ids = validation.get_all_ids_from_field_with_sub_ranges(AMOUNTS_AND_RATES)
        dt_collected = \
            [x for x in current_state_doc if str(x["_id"]) == row_ids[0].replace(AMOUNTS_AND_RATES, '')][0][
                DATETIME_COLLECTED_UTC]
        validation.select_sub_table_row_by_id(row_ids[0])
        field = {
            NAME: DATETIME_COLLECTED_UTC,
            params.ROW_ID: row_ids[0],
            params.PARENT: AMOUNTS_AND_RATES,
            TYPE: DATE_TYPE,
            VALID: False
        }
        errors += audit_field(browser, field)
        # check calendar display
        validation.open_calendar(field[NAME], field[params.PARENT])
        calendar_val = validation.get_calendar_widget_date()
        if calendar_val.date() != dt_collected.date():
            errors.append(f"expected calendar date to be {dt_collected} got {calendar_val}")
        cal_input_value = validation.get_calendar_input_value(field[NAME], field[params.PARENT])
        if datetime.strptime(cal_input_value, "%Y-%m-%d %H:%M:%S") != dt_collected:
            errors.append(f"expected date in calendar input to be {dt_collected}")
        assert errors == []

    @pytest.mark.check_dropdown_is_clickable
    @doc_it()
    def test_12430_check_dropdown_is_clickable(self, browser):
        """
        The user checks that
        dropdown is not overlapped with other elements
        """
        errors = []
        collection_name = TESTING_HALINA
        doc_id = 1
        login_and_go_to_url(browser, collection_name, doc_id)
        page = ValidationPage(browser)
        page.remove_fixed_elements()
        field = {
            NAME: CLIENT_TYPE,
            TYPE: BOOL,
            NEW_VALUE: False,
            VALID: False
        }
        errors += audit_field(browser, field)
        assert errors == []

    @pytest.mark.api_links_are_clickable
    @pytest.mark.parametrize("collection_name, record_id", [(GLOB_TEST_WITH_EXC_FOR_APP, 445)])
    @doc_it()
    def test_12571_links_clickable(self, browser, collection_name, record_id, gen_data):
        """
        The user checks that
        api links are clickable and have the same
        href attribute as text
        """
        errors = []
        login_and_go_to_url(browser, collection_name, record_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        # get element for currency_from and currency_to
        cur_from = validation.get_cell_val_by_name(CURRENCY_FROM)
        cur_to = validation.get_cell_val_by_name(CURRENCY_TO)
        validators = find_docs_in_collection(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name})[
            VALIDATORS]

        cur_from_list = [x[CONSTRAINTS][VALUES] for x in validators if
                         x[NAME] == CURRENCY_FROM][0]
        cur_from_list.remove(cur_from)
        cur_to_list = \
            [x[CONSTRAINTS][VALUES] for x in validators if
             x[NAME] == CURRENCY_TO][
                0]
        cur_to_list.remove(cur_to)
        new_cur_from = cur_from_list[0]
        new_cur_to = cur_to_list[0]
        # validate field:
        cur_from_field = {
            NAME: CURRENCY_FROM,
            NEW_VALUE: new_cur_from,
            TYPE: ENUM,
            VALID: False
        }
        cur_to_field = {
            NAME: CURRENCY_TO,
            NEW_VALUE: new_cur_to,
            TYPE: ENUM,
            VALID: False
        }
        for field in [cur_from_field, cur_to_field]:
            errors += audit_field(browser, field)
        validation.save_form_changes()
        validation.confirm_alert()
        if not validation.check_api_link_clickable(AMOUNTS_AND_RATES, IB_API_URL):
            errors.append(f"expected all links in the table to be clickable")
        assert errors == []

    @pytest.mark.create_new_user
    @doc_it()
    def test_12497_create_new_user(self, browser):
        """
        The user registers
        new user and tries to enter
        with this user. Check that
        user cannot pass without any validation.
        UC1: user tries to register without any set input
        UC2: user tries to register a user with existing email
        UC3: user registers user with valid email, pswd
        """
        # todo: simplify the test, it's already in jest
        errors = []
        col_name = "User"
        existing_email = "a1@getnada.com"
        register_new_user(browser)
        page = LoginPage(browser)
        browser.get_log("performance")
        page.submit_login_form()
        upd_logs = browser.get_log("performance")
        req_data = api_call(upd_logs, False)
        if req_data["api_reqs"]:
            errors.append(params.NO_REQUEST_TO_BE_SENT)
        if page.get_error_for_field("Password", True) != PSWD_LENGTH_NOTIFICATION:
            errors.append(f"expected password field to contain {PSWD_LENGTH_NOTIFICATION}")
        if not page.check_color_for_error():
            errors.append(f"errors are not properly colored")

        email = Faker().email()
        password = Faker().pystr()
        page.fill_register_from(email=email, password=password)
        upd_logs = browser.get_log("performance")
        req_data = api_call(upd_logs, False)
        if req_data["api_reqs"]:
            errors.append(params.NO_REQUEST_TO_BE_SENT)
        page.submit_login_form()
        if not page.get_error_for_field("First Name", False):
            errors.append("expected First Name to be with error")
        if not page.get_error_for_field("Last Name", False):
            errors.append("expected Last Name to be with error")
        if not page.check_color_for_error():
            errors.append(f"errors are not properly colored")

        # register with email only
        firstname = Faker().name()
        lastname = Faker().name()
        page.fill_register_from(firstname, lastname, existing_email, password)
        page.submit_login_form()
        upd_logs = browser.get_log("performance")
        called_params = api_call(upd_logs)
        if REGISTER not in called_params["url"]:
            errors.append(f"expected url for api call to contain {REGISTER}")
        sent_params = {"first_name": firstname, "last_name": lastname, "email": existing_email, "password": password}
        if called_params["post_data"] != sent_params:
            errors.append(f"expected sent params to be {sent_params}, got {called_params['post_data']}")
        alert_text = page.get_alert_text()
        if texts.ALREADY_REGISTERED_USER not in alert_text:
            errors.append(f"expected alert to contain {texts.ALREADY_REGISTERED_USER}")
        page.confirm_alert()

        page.fill_register_from(firstname, lastname, email, password)
        browser.get_log("performance")
        page.submit_login_form()
        upd_logs = browser.get_log("performance")
        called_params = api_call(upd_logs)
        if REGISTER not in called_params["url"]:
            errors.append(f"expected url for api call to contain {REGISTER}")
        sent_params = {"first_name": firstname, "last_name": lastname, "email": email, "password": password}
        if called_params["post_data"] != sent_params:
            errors.append(f"expected sent params to be {sent_params}, got {called_params['post_data']}")
        alert_text = page.get_alert_text()
        if texts.SIGN_UP_SUCCESS not in alert_text:
            errors.append(f"expected alert to contain {texts.SIGN_UP_SUCCESS}")
        delete_mongo(col_name, {"RegisteredUserEmail": email})
        assert errors == []

    @pytest.mark.check_hover_hint
    @doc_it()
    @pytest.mark.parametrize("collection_name, record_id", [(GLOB_TEST_WITH_EXC_FOR_APP, 445)])
    def test_11981_hover_hint(self, browser, collection_name, record_id, gen_data):
        """
        The user hovers on low level fields.
        Check that hint is displayed on hover. The hover is
        expected to contain datatype and value.
        """
        errors = []
        login_and_go_to_url(browser, collection_name, record_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        row_ids = validation.get_all_ids_from_field_with_sub_ranges(AMOUNTS_AND_RATES)
        field = {
            NEW_VALUE: round(random.uniform(0, 1), 2),
            TYPE: NUMERIC,
            params.PARENT: AMOUNTS_AND_RATES,
            NAME: FX_RATE,
            params.ROW_ID: row_ids[0],
            VALID: False
        }
        validation.select_sub_table_row_by_id(row_ids[0])
        errors += audit_field(browser, field)
        validation.save_form_changes()
        validation.confirm_alert()
        val_on_form = validation.get_on_hover_field_hint(field[NAME], field[params.PARENT], field[params.ROW_ID])
        if field[NEW_VALUE] != float(val_on_form):
            errors.append(f"expected value on form to be {field[NEW_VALUE]} got {val_on_form}")
        assert errors == []

    @pytest.mark.collected_date_in_future
    @doc_it()
    @pytest.mark.config_update
    @pytest.mark.parametrize("collection_name, record_id", [(GLOB_TEST_WITH_EXC_FOR_APP, 445)])
    def test_12608_collected_date_in_future(self, browser, collection_name, record_id, gen_data):
        """
        The user tries to set up date in
        future and checks that notification
        is displayed.
        """
        # todo: add to jest
        errors = []
        update_mongo(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name},
                     {"$pull": {VALIDATORS: {NAME: "amounts_and_rates.datetime_collected_utc"}}})
        new_validator = {
            "name": "amounts_and_rates.datetime_collected_utc",
            "type": "isodate",
            "constraints": {
                "lt_now": True
            }
        }
        update_mongo(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name},
                     {"$push": {VALIDATORS: new_validator}})
        login_and_go_to_url(browser, collection_name, record_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        row_ids = validation.get_all_ids_from_field_with_sub_ranges(AMOUNTS_AND_RATES)
        future_time = datetime.strftime(datetime.now() - timedelta(minutes=1), "%Y%m%d%H%M%S")
        field = {
            NAME: DATETIME_COLLECTED_UTC,
            VALID: False,
            NEW_VALUE: future_time,
            params.MIXED_VALUE: True,
            TYPE: DATE_TYPE,
            params.PARENT: AMOUNTS_AND_RATES,
            params.ROW_ID: row_ids[0],
            params.UTC: -3
        }
        validation.select_sub_table_row_by_id(row_ids[0])
        errors += audit_field(browser, field)
        validation.save_form_changes()
        if not validation.get_notification(DATETIME_COLLECTED_UTC, AMOUNTS_AND_RATES):
            errors.append(f"expected notification to be displayed for the user")
        assert errors == []

    @pytest.mark.check_invalid_date_input
    @doc_it()
    def test_12033_check_invalid_date_input(self, browser):
        """
        The user tries to set up invalid date
        like 2020-15-15 25:25:25.
        Check that date is not set
        """
        errors = []
        collection_name = GLOB_TEST_WITH_EXC_FOR_APP
        doc_id = 445
        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        row_ids = validation.get_all_ids_from_field_with_sub_ranges(AMOUNTS_AND_RATES)
        field = {
            NAME: DATETIME_COLLECTED_UTC,
            VALID: False,
            NEW_VALUE: "20202020252525",
            params.MIXED_VALUE: True,
            TYPE: DATE_TYPE,
            params.PARENT: AMOUNTS_AND_RATES,
            params.ROW_ID: row_ids[0],
            params.UTC: -3
        }
        validation.select_sub_table_row_by_id(row_ids[0])
        errors += audit_field(browser, field)
        input_date = validation.get_time_from_input(AMOUNTS_AND_RATES, DATETIME_COLLECTED_UTC)
        if input_date == "2020-20-20-25:25:25":
            errors.append("invalid date can be set")
        assert errors == []

    @pytest.mark.skip
    @pytest.mark.parametrize("function_formula", ["wewew", "**x"])
    @pytest.mark.modal_dialog_close
    @doc_it()
    def test_13245_modal_dialog_close(self, browser, function_formula):
        """
        The user tries to set incorrect formula.
        Check that modal dialog is not closed after error
        and alert is not displayed
        """
        errors = []
        collection_name = GLOB_TEST_WITH_EXC_FOR_APP
        doc_id = 445
        update_mongo(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name}, {"$set": {"user_functions": {
            "allow_user_to_create_function": True,
            "admin_approved_functions": [
                {
                    "field": AMOUNTS_AND_RATES,
                    "name": "func_1",
                    "code": "2/x",
                    "updatedField": "fx_rate",
                    "comment": "",
                    "description": "presaved 2/x function for fx_margin column"
                },
                {
                    "field": AMOUNTS_AND_RATES,
                    "name": "func_2",
                    "code": "2-x",
                    "updatedField": "fx_rate",
                    "comment": "",
                    "description": "presaved 2-x function for fx_margin column"
                }
            ]
        }}})
        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        validation.set_transformation("func_1", FX_RATE, function_formula)
        er_msg = validation.get_error_msg()
        if "Error" not in er_msg:
            errors.append("expected msg to be visible on form")
        assert errors == []

    @pytest.mark.reorder_table_column
    def test_14346_reorder_table_column(self, browser):
        """
        The user hovers on the sub-table column and clicks on button to move it back and forward
        :param browser:
        :return:
        """
        errors = []
        collection_name = GLOB_TEST_WITH_EXC_FOR_APP
        doc_id = 445
        login_and_go_to_url(browser, collection_name, doc_id)
        page = ValidationPage(browser)
        cols = page.get_sub_range_column_names(AMOUNTS_AND_RATES)
        col_to_move = cols[1]
        page.reorder_column(AMOUNTS_AND_RATES, col_to_move)
        cols_after_right = page.get_sub_range_column_names(AMOUNTS_AND_RATES)
        list_to_be = cols_after_right[:]
        list_to_be.remove(col_to_move)
        list_to_be.insert(cols.index(col_to_move) + 1, col_to_move)
        if list_to_be != cols_after_right:
            errors.append(
                f"expected list after moving to the right to be {list_to_be}, got {cols_after_right} after moving field {col_to_move}")
        page.reorder_column(AMOUNTS_AND_RATES, col_to_move, False)
        cols_after_left = page.get_sub_range_column_names(AMOUNTS_AND_RATES)
        if cols != cols_after_left:
            errors.append(f"expected list after moving back to be the same as primary")
        assert errors == []

    @pytest.mark.check_new_value_is_visible
    @doc_it()
    def test_11832_check_new_value_is_visible(self, browser):
        """
        The user audits first row in the table with low-level fields.
        Then the user clicks on another row.
        Check that new value is displayed in the cell
        """
        errors = []
        doc_id = 1
        collection_name = TESTING_HALINA
        field = {
            NAME: "amount",
            NEW_VALUE: random.randint(1, 100),
            TYPE: NUMERIC,
            params.PARENT: CONSUMER_MARGINS,
            VALID: False
        }
        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        row_ids = validation.get_all_ids_from_field_with_sub_ranges(field[params.PARENT])
        field[params.ROW_ID] = row_ids[0]
        validation.select_sub_table_row_by_id(row_ids[0])
        errors += audit_field(browser, field)
        # click on another row:
        validation.select_sub_table_row_by_id(row_ids[1])
        low_level_cell_text = validation.get_cell_val_by_name(field[NAME], row_ids[0], field[params.PARENT])
        if low_level_cell_text != str(field[NEW_VALUE]):
            errors.append(f"Expected value to be displayed: {str(NEW_VALUE)} got {low_level_cell_text}")
        assert errors == []

    @pytest.mark.check_add_option_list
    @doc_it()
    def test_check_add_params_for_audit(self, browser):
        """
        The user checks configuration and gets fields that are not in
        DefaultFieldsToDisplayInAuditSession
        and are not in UnDisplayableFields.
        List of fields is expected to be the same as in add dropdown list.
        """

        errors = []
        doc_id = 1
        collection_name = TESTING_HALINA
        record_from_db = find_docs_in_collection(collection_name, {RECORD_ID: doc_id})
        # get currentState keys from doc:
        state_before_upd = [x for x in record_from_db[CURRENT_STATE] if
                            type(record_from_db[CURRENT_STATE][x]) not in (list, dict)]
        # doc fields:
        doc_config = find_docs_in_collection(CONFIGURATION, {"CollectionRelevantFor": collection_name})
        fields_can_be_added = [x for x in state_before_upd if
                               x not in doc_config[DEFAULT_AUDIT_FIELDS] and x not in doc_config[
                                   UN_DISPLAYABLE_FIELDS]]

        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        validation.open_add_field_dropdown()
        form_options_list = validation.get_options_list()
        if sorted(form_options_list) != sorted(fields_can_be_added):
            errors.append(
                f"Options list from DB: {sorted(fields_can_be_added)} but displayed on form: {sorted(form_options_list)}")
        assert errors == []

    @pytest.mark.check_conf_score_mapping
    @doc_it()
    @pytest.mark.parametrize("collection_name", [TESTING_HALINA])
    def test_check_conf_score_display(self, browser, gen_data, collection_name):
        """
        The user goes on form and checks values in the dropdown list
        for ConfidenceScore field.
        The user checks that values are the same as defined in
        configuration field ConfidenceScoreOptions.

        Remove ConfidenceScoreOptions from options.
        Update browser.
        Check that list of values on the form changed to default.
        """
        errors = []
        doc_id = 1
        new_score = {
            "Wrong": 100,
            "Right": 101,
            "Other": 102,
            "Confident": 3,
            "Unfinished": -999
        }
        update_mongo(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name},
                     {"$set": {f"{CONFIDENCE_SCORES}.{CONFIDENCE_SCORE_OPTIONS}": new_score}})

        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        # open score:
        validation.open_score_list()
        options = validation.get_options_list()
        if sorted(options) != sorted(list(new_score.keys())):
            errors.append(f"expected score list should be {sorted(list(new_score.keys()))} but is {sorted(options)}")
        # remove score
        update_mongo(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name},
                     {"$unset": {f"{CONFIDENCE_SCORES}.{CONFIDENCE_SCORE_OPTIONS}": ""}})
        browser.refresh()
        validation.open_score_list()
        upd_options = validation.get_options_list()
        if sorted(upd_options) != sorted(list(DEFAULT_SCORE_MAP.keys())):
            errors.append(
                f"expected options list to be {sorted(list(DEFAULT_SCORE_MAP.keys()))}, on form is {sorted(upd_options)}")
        assert errors == []

    @pytest.mark.check_boolean_audits
    @doc_it()
    @pytest.mark.parametrize("collection_name", [TESTING_HALINA])
    def test_12091_validate_booleans_and_check_audit_btn(self, browser, collection_name, gen_data):
        """
        The user goes on form and edits boolean fields: low-level and high-level.
        The user marks them as invalid and sets false.
        The user checks if new value is displayed.
        The user checks that audit buttons are displayed near audited fields.
        The user clicks on the button and checks audited info.
        The user marks fields as invalid and sets true.
        The user checks that true value is displayed for audited boolean fields.
        The user checks notification is displayed after save
        that user is going to audit previously audited fields.
        """
        errors = []
        doc_id = 1
        fields = {
            "high": {
                NAME: CLIENT_TYPE,
                NEW_VALUE: False,
                TYPE: BOOL,
                COMMENT: "Audited field",
                VALID: False
            },
            "low": {
                NAME: WAS_REVIEWED,
                NEW_VALUE: False,
                TYPE: BOOL,
                params.PARENT: CONSUMER_MARGINS,
                VALID: False
            }
        }
        update_mongo(collection_name, {RECORD_ID: doc_id},
                     {"$set": {f"{CURRENT_STATE}.{fields['high'][NAME]}": None,
                               f"{CURRENT_STATE}.{CONSUMER_MARGINS}.$[].{WAS_REVIEWED}": None}})
        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        errors += audit_field(browser, fields["high"])
        row_ids = validation.get_all_ids_from_field_with_sub_ranges(fields["low"][params.PARENT])
        fields["low"][params.ROW_ID] = row_ids[0]
        validation.select_sub_table_row_by_id(row_ids[0])
        errors += audit_field(browser, fields["low"])
        validation.save_form_changes()
        validation.confirm_alert()
        # check form:
        high_val = validation.check_cell_value(fields["high"][NAME],
                                               str(fields["high"][NEW_VALUE]))
        if not high_val:
            errors.append(
                f"expected value in high level cell to be {str(fields['high'][NEW_VALUE])}")
        low_val = validation.check_cell_value(fields["low"][NAME],
                                              str(fields["low"][NEW_VALUE]), row_ids[0], fields["low"][params.PARENT])
        if not low_val:
            errors.append(
                f"expected value in low level cell to be {str(fields['low'][NEW_VALUE])}")

        # check btns audit are present:
        audit_high = validation.check_audit_btn(fields["high"][NAME])
        if audit_high:
            audit_text = validation.get_audit_info(fields["high"][NAME]).split("\n")
            errors += compare_audit_popup_with_user_input(audit_text, fields["high"])

        else:
            errors.append(f"expected btn audit info to be visible for the field {fields['high'][NAME]}")

        validation.select_sub_table_row_by_id(row_ids[0])
        audit_low = validation.check_audit_btn(fields["low"][NAME])
        if audit_low:
            audit_text = validation.get_audit_info(fields["low"][NAME]).split("\n")
            errors += compare_audit_popup_with_user_input(audit_text, fields["low"])
        # change back:
        fields["high"][NEW_VALUE] = not fields["high"][NEW_VALUE]
        fields["low"][NEW_VALUE] = not fields["low"][NEW_VALUE]
        errors += audit_field(browser, fields["high"])
        errors += audit_field(browser, fields["low"])
        validation.save_form_changes()
        # check alert_text for already audited fields
        alert_text = validation.get_alert_text()
        if texts.EDIT_AUDITED_FIELDS not in alert_text:
            errors.append(f"expected alert text to contain {texts.EDIT_AUDITED_FIELDS}")
        validation.confirm_alert()
        validation.confirm_alert()
        high_val_2 = validation.check_cell_value(fields["high"][NAME],
                                                 str(fields["high"][NEW_VALUE]))
        if not high_val_2:
            errors.append(
                f"expected value in high level after upd cell to be {str(fields['high'][NEW_VALUE])}")
        low_val_2 = validation.check_cell_value(fields["low"][NAME],
                                                str(fields["low"][NEW_VALUE]), row_ids[0], fields["low"][params.PARENT])
        if not low_val_2:
            errors.append(
                f"expected value in low level after upd cell to be {str(fields['low'][NEW_VALUE])}")
        assert errors == []

    @pytest.mark.check_api_call
    @doc_it()
    @pytest.mark.parametrize("collection_name, record_id", [(IMTI_V_95_NE_AUD_HALINA, 444)])
    def test_12204_check_api_call(self, browser, collection_name, record_id, gen_data):
        """
        The user goes on form.
        The user sets new values for the fields
        that influences recalculation for interbank rates.
        Check that values are being recalculated
        :param browser:
        :return:
        """
        # todo: add to jest
        errors = []
        login_and_go_to_url(browser, collection_name, record_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()

        row_ids = validation.get_all_ids_from_field_with_sub_ranges(AMOUNTS_AND_RATES)
        # get values for rows:
        interbank_rates = []
        for row in row_ids:
            interbank_rates.append(
                validation.get_cell_val_by_name(INTERBANK_RATE, row, AMOUNTS_AND_RATES))
        # get element for currency_from and currency_to
        cur_from = validation.get_cell_val_by_name(CURRENCY_FROM)
        cur_to = validation.get_cell_val_by_name(CURRENCY_TO)
        validators = find_docs_in_collection(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name})[
            VALIDATORS]

        cur_from_list = [x[CONSTRAINTS][VALUES] for x in validators if
                         x[NAME] == CURRENCY_FROM][0]
        cur_from_list.remove(cur_from)
        cur_to_list = \
            [x[CONSTRAINTS][VALUES] for x in validators if
             x[NAME] == CURRENCY_TO][
                0]
        cur_to_list.remove(cur_to)
        new_cur_from = cur_from_list[0]
        new_cur_to = cur_to_list[0]
        # validate field:
        cur_from_field = {
            NAME: CURRENCY_FROM,
            NEW_VALUE: new_cur_from,
            TYPE: ENUM,
            VALID: False
        }
        cur_to_field = {
            NAME: CURRENCY_TO,
            NEW_VALUE: new_cur_to,
            TYPE: ENUM,
            VALID: False
        }
        errors += audit_field(browser, cur_from_field)
        errors += audit_field(browser, cur_to_field)
        validation.save_form_changes()
        validation.confirm_alert()
        changed_interbank_rates_on_form = []
        for el in row_ids:
            changed_interbank_rates_on_form.append(
                validation.get_cell_val_by_name(INTERBANK_RATE, el, AMOUNTS_AND_RATES))
        if changed_interbank_rates_on_form == interbank_rates:
            errors.append(f"interbank rates were not recalculated")

    @pytest.mark.align_check
    @doc_it()
    def test_12119_check_align_text_in_column(self, browser):
        """
        The user selects document.
        The user checks that column values
        Current Data are right aligned.
        """
        errors = []
        collection_name = GLOB_TEST_WITH_EXC_FOR_APP
        doc_id = 18719
        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        validation.global_updates()
        if not validation.check_cells_styling("right"):
            errors.append(f"not all cell params are right aligned")
        assert errors == []

    @pytest.mark.update_mismatch_validator
    @doc_it()
    def test_12032_check_update_mismatch_validator(self, browser):
        """
        The user audits fields and sets new values
        that cause update pipeline. New value for updated
        field does not match validator.
        Check that document is not updated
        due to inconsistent data.
        """
        errors = []
        collection_name = TESTING_HALINA
        doc_id = 1
        update_mongo(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name},
                     {"$push": {UPDATE_LOGICS: {
                         "dependency_fields": [
                             CURRENCY_FROM,
                             CURRENCY_TO
                         ],
                         "update_logic": "{return CurrentState['currency_from'] + CurrentState['currency_to']}",
                         "updated_field": "collection_id"
                     }}})

        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        row_ids = validation.get_all_ids_from_field_with_sub_ranges(CONSUMER_MARGINS)
        field = {
            NAME: IB_RATE,
            NEW_VALUE: round(random.uniform(0, 1), 2),
            params.PARENT: CONSUMER_MARGINS,
            params.ROW_ID: row_ids[0],
            TYPE: NUMERIC,
            VALID: False
        }
        validation.select_sub_table_row_by_id(row_ids[0])
        audit_field(browser, field)
        validation.save_form_changes()
        alert_text = validation.get_alert_text()
        if "Not satisfied for constraint positive = true for field ConsumerMargins.full_cost" not in alert_text:
            errors.append(f"expected notification in alert to be present")
        validation.confirm_alert()
        # validate high level field:
        hof = {
            NAME: CURRENCY_FROM,
            TYPE: ENUM,
            NEW_VALUE: "JPY",
            VALID: False
        }
        audit_field(browser, hof)
        validation.save_form_changes()
        alert_text2 = validation.get_alert_text()
        if texts.INCONSISTENT_CONF not in alert_text2:
            errors.append(f"expected {texts.INCONSISTENT_CONF} in alert, got {alert_text2}")
        update_mongo(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name},
                     {"$pull": {UPDATE_LOGICS: {
                         "dependency_fields": [
                             CURRENCY_FROM,
                             CURRENCY_TO
                         ],
                         "update_logic": "{return CurrentState['currency_from'] + CurrentState['currency_to']}",
                         "updated_field": "collection_id"
                     }}})
        assert errors == []

    @pytest.mark.api_request_cached
    @doc_it()
    @pytest.mark.parametrize("collection_name, record_id", [(GLOB_TEST_WITH_EXC_FOR_APP, 3170)])
    def test_12268_call_api_cached(self, browser, collection_name, record_id, gen_data):
        """
        The user updates first row in sub table.
        The user sets new value for datetime_collected_utc field.
        The user clicks on save button that runs api request.
        The user makes audit for all other rows in sub table.
        The user clicks on save button and checks that request
        passed successfully and document was updated.
        """
        # todo: add to jest tests
        errors = []
        login_and_go_to_url(browser, collection_name, record_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        field = {
            NAME: DATETIME_COLLECTED_UTC,
            TYPE: DATE_TYPE,
            params.MIXED_VALUE: True,
            NEW_VALUE: "20200401135500",
            params.UTC: +1,
            params.PARENT: AMOUNTS_AND_RATES,
            VALID: False
        }
        row_ids = validation.get_all_ids_from_field_with_sub_ranges(AMOUNTS_AND_RATES)
        validation.select_sub_table_row_by_id(row_ids[0])
        field[params.ROW_ID] = row_ids[0]
        audit_field(browser, field)
        validation.save_form_changes()
        alert_text = validation.get_alert_text()
        if texts.SUCCESSFULLY_UPDATED not in alert_text:
            errors.append(f"expected {texts.SUCCESSFULLY_UPDATED} in alert")
        # second validation
        validation.confirm_alert()
        for row in row_ids[1:]:
            validation.select_sub_table_row_by_id(row)
            field[params.ROW_ID] = row
            audit_field(browser, field)
        validation.save_form_changes()
        alert_text = validation.get_alert_text()
        if texts.SUCCESSFULLY_UPDATED not in alert_text:
            errors.append(f"expected {texts.SUCCESSFULLY_UPDATED} in alert")
        assert errors == []

    @pytest.mark.mini_search_customize
    @doc_it()
    @pytest.mark.config_update
    @pytest.mark.collection_not_to_update
    @pytest.mark.parametrize("collection_name", [IMTI_V_95_NE_AUD_HALINA])
    def test_12211_mini_search_customize(self, browser, collection_name, gen_data):
        """
        The user sets in configuration customization
        for the fields.
        "DefaultSearchFieldsOnMiniSearchResultsScreen" : [
            "CurrentState.provider_name",
            "CurrentState.currency_from",
            "CurrentState.currency_to",
            "CurrentState.datetime_collected_utc",
            {'field': 'CurrentState.datetime_record_submitted_utc',
            'operator': 'greater',
            'value': 'previous month'},

        ]
        The user checks that mini search screen contains pre-set fields
        """
        errors = []
        collection_name = IMTI_V_95_NE_AUD_HALINA
        record_id = 18719
        update_mongo(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name},
                     {"$set": {"Charts.DefaultSearchFieldsOnMiniSearchResultsScreen": [
                         "CurrentState.provider_name",
                         "CurrentState.currency_from",
                         {'field': 'CurrentState.currency_to',
                          'operator': 'equals',
                          'value': 'USD'},
                         {'field': 'CurrentState.datetime_record_submitted_utc',
                          'operator': 'between',
                          'value': "this.setMonth(this.getMonth() - 1)",  # subtract one month.
                          'secondValue': 'this'}
                     ]}})

        current_doc = find_docs_in_collection(collection_name, {RECORD_ID: record_id})
        prov_name = current_doc[CURRENT_STATE]["provider_name"]
        cur_from = current_doc[CURRENT_STATE][CURRENCY_FROM]
        cur_to = current_doc[CURRENT_STATE][CURRENCY_TO]
        dt_submitted = current_doc[CURRENT_STATE]["datetime_record_submitted_utc"]
        login_and_go_to_url(browser, collection_name, record_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        search = SearchPage(browser)
        search.check_mini_search_filter_present("CurrentState.provider_name", "provider_name")
        search.check_mini_search_filter_present("CurrentState.provider_name", texts.EQUAL_TO)
        if not search.check_mini_search_filter_input_data("CurrentState.provider_name", prov_name):
            errors.append(f"expected provider_name to be {prov_name}")

        search.check_mini_search_filter_present("CurrentState.currency_from", "currency_from")
        search.check_mini_search_filter_present("CurrentState.currency_from", texts.EQUAL_TO)
        if not search.check_mini_search_filter_input_data("CurrentState.currency_from", cur_from):
            errors.append(f"expected currency from to be {cur_from}")

        search.check_mini_search_filter_present("CurrentState.currency_to", "currency_to")
        search.check_mini_search_filter_present("CurrentState.currency_to", texts.EQUAL_TO)
        if not search.check_mini_search_filter_input_data("CurrentState.currency_to", "USD"):
            errors.append(f"expected currency to to be {cur_to}")

        search.check_mini_search_filter_present("CurrentState.datetime_record_submitted_utc",
                                                "datetime_record_submitted_utc")
        search.check_mini_search_filter_present("CurrentState.datetime_record_submitted_utc", texts.BETWEEN)
        compared_dt = f"{datetime.strftime(dt_submitted, '%Y-%m-%dT%H:%M:%S.%f')[:-3]}Z"
        compared_dt_prev = f"{datetime.strftime(dt_submitted - relativedelta(months=1), '%Y-%m-%dT%H:%M:%S.%f')[:-3]}Z"
        if not search.check_mini_search_filter_input_data("CurrentState.datetime_record_submitted_utc",
                                                          compared_dt_prev):
            errors.append(f"expected datetime_record_submitted_utc previous to be {compared_dt_prev}")
        if not search.check_mini_search_filter_input_data("CurrentState.datetime_record_submitted_utc",
                                                          compared_dt, 1):
            errors.append(f"expected datetime_record_submitted_utc to be {compared_dt}")
        assert errors == []

    @pytest.mark.sub_fields_display_from_doc
    @doc_it()
    @pytest.mark.config_update
    @pytest.mark.collection_not_to_update
    @pytest.mark.parametrize("collection_name", [GLOB_TEST_WITH_EXC_FOR_APP])
    def test_12057_sub_doc_fields_display(self, browser, collection_name, gen_data):
        """
        The user selects document.
        The user clicks on dropdown in sub table
        to see what the fields are inside the list.
        Case 1: Check that in options list there are fields from all
        document sub-table fields except Undisplayable

        Case 2: The user makes global update and
        checks that options list was updated.

        There should be a set of all th fields except those that
        are already displayed.
        """
        errors = []
        doc_id = 3170
        without_all_in_config = [
            "provider_name",
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
                    "interbank_rate",
                    "ib_api_url",
                    "fx_rate",
                    "fx_margin",
                    "amount_margin_approved",
                    "amount_duplicated",
                    "outside_of_min_max_fx_margin",
                    "fx_margin_reldiff_gt15pct_mom"
                ]
            }
        ]
        update_mongo(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name},
                     {"$set": {DEFAULT_AUDIT_FIELDS: without_all_in_config}})

        doc = find_docs_in_collection(collection_name, {RECORD_ID: doc_id})
        all_fields_list_of_lists = [list(x.keys()) for x in doc[CURRENT_STATE][
            AMOUNTS_AND_RATES]]
        all_fields_set = set([item for sublist in all_fields_list_of_lists for item in sublist])
        col_config = find_docs_in_collection(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name})
        audit_fields = col_config[
            DEFAULT_AUDIT_FIELDS]
        default_audited = \
            [x for x in audit_fields if isinstance(x, dict) and x[NAME] == AMOUNTS_AND_RATES][0][
                DEFAULT_AUDIT_FIELDS]
        undisplayed_fields = [x.replace(f"{AMOUNTS_AND_RATES}.", "") for x in
                              col_config[UN_DISPLAYABLE_FIELDS] if
                              x.startswith(AMOUNTS_AND_RATES)]
        displayed_fields = set(default_audited) - set(undisplayed_fields)
        fields_can_be_added = all_fields_set - set(displayed_fields)
        fields_can_be_added.discard("_id")
        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        validation.dropdown_sub_table_select(AMOUNTS_AND_RATES)
        options_list = validation.get_options_list()
        if set(options_list) != fields_can_be_added:
            errors.append(f"expected list to be added: {fields_can_be_added} got {set(options_list)}")
        # add column to sub_table
        field_to_add = list(fields_can_be_added)[0]
        validation.select_option_by_text(field_to_add)
        validation.add_field_btn_click()
        # check that column is displayed
        after_add = validation.get_sub_range_column_names(AMOUNTS_AND_RATES)
        if field_to_add not in after_add:
            errors.append(f"expected {field_to_add} to be in column list")
        if not validation.remove_column_from_sub_field(AMOUNTS_AND_RATES, field_to_add):
            errors.append(f"expected {field_to_add} not to be visible in column list")
        # global update
        validation.global_updates()
        validation.dropdown_sub_table_select(AMOUNTS_AND_RATES)
        upd_options_list = validation.get_options_list()
        doc_upd = find_docs_in_collection(collection_name, {RECORD_ID: doc_id})
        all_fields_list_of_lists_upd = [list(x.keys()) for x in doc_upd[CURRENT_STATE][
            AMOUNTS_AND_RATES]]
        all_fields_set_upd = set([item for sublist in all_fields_list_of_lists_upd for item in sublist])
        fields_can_be_added_upd = all_fields_set_upd - set(displayed_fields)
        fields_can_be_added_upd.discard("_id")
        if set(upd_options_list) != fields_can_be_added_upd:
            errors.append(f"expected options list to be {fields_can_be_added_upd}, got {fields_can_be_added_upd}")
        assert errors == []

    @pytest.mark.bulk_changes
    @doc_it()
    @pytest.mark.parametrize("collection_name", [TESTING_HALINA])
    def test_12272_make_bulk_changes(self, browser, collection_name, gen_data):
        """
        The user selects document.
        The user sets new values to different type of fields:
        Text, Boolean, Enum, Numeric
        in sub-table.
        The user sets fields with errors.
        The user clicks on save button and checks that notification is displayed on the form.
        Check that all columns are the same new values.
        The user edits fields to new valid values.
        The user checks that all fields remain editable.
        The user clicks on save button and checks that audit is ok and bulk changes applied in DB.
        """
        errors = []
        doc_id = 8
        update_mongo(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name},
                     {"$pull": {VALIDATORS: {NAME: IB_RATE}}})

        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        max_fx_rate = max(validation.get_column_values(CONSUMER_MARGINS, "fx_rate"))
        row_ids = validation.get_all_ids_from_field_with_sub_ranges(CONSUMER_MARGINS)
        row_to_edit = row_ids[0]
        amount_field = {
            NAME: "amount",
            NEW_VALUE: random.randint(100, 999),
            params.NEW_VALUE_PASS: False,
            params.PARENT: CONSUMER_MARGINS,
            params.ROW_ID: row_to_edit,
            TYPE: NUMERIC,
            VALID: False
        }
        ib_rate_field = {
            NAME: IB_RATE,
            NEW_VALUE: round(float(max_fx_rate) - 0.01, 3),
            params.NEW_VALUE_PASS: True,
            params.PARENT: CONSUMER_MARGINS,
            params.ROW_ID: row_to_edit,
            TYPE: NUMERIC,
            VALID: False
        }

        org_name_field = {
            NAME: "org_name",
            NEW_VALUE: Faker().word()[:5],
            params.NEW_VALUE_PASS: True,
            params.PARENT: CONSUMER_MARGINS,
            params.ROW_ID: row_to_edit,
            TYPE: TEXT,
            VALID: False
        }
        is_consumer_field = {
            NAME: "is_consumer",
            NEW_VALUE: "True",
            params.NEW_VALUE_PASS: True,
            params.PARENT: CONSUMER_MARGINS,
            params.ROW_ID: row_to_edit,
            TYPE: ENUM,
            VALID: False
        }
        was_reviewed_field = {
            NAME: "was_reviewed",
            NEW_VALUE: None,
            params.NEW_VALUE_PASS: True,
            params.PARENT: CONSUMER_MARGINS,
            params.ROW_ID: row_to_edit,
            TYPE: BOOL,
            VALID: False
        }
        validation.select_sub_table_row_by_id(row_to_edit)
        # check that all values in the table are new:
        for field in [amount_field, ib_rate_field, org_name_field, is_consumer_field, was_reviewed_field]:
            errors += audit_field(browser, field, apply_to_all=True)
            is_dropdown = True if field[TYPE] in [ENUM, BOOL] else False
            val = validation.get_sub_table_field_upd_value(row_to_edit, field[NAME], is_dropdown)
            if field[NEW_VALUE] is not None and val != f"{field[NEW_VALUE]}":
                errors.append(f"expected column value to be {field[NEW_VALUE]} got {val}")
            elif field[NEW_VALUE] is None:
                if not is_dropdown and val != "":
                    errors.append(f"expected column value to be empty got {val}")
        validation.save_form_changes()
        # check notifications
        errors += check_is_pass(browser,
                                [amount_field, ib_rate_field, org_name_field, is_consumer_field, was_reviewed_field])

        # set values back and check that field is editable
        for field in [amount_field, org_name_field]:
            validation.validate_sub_field(field[params.ROW_ID], field[NAME], None)
        was_reviewed_field[NEW_VALUE] = True
        validation.select_value_input(was_reviewed_field[NEW_VALUE],
                                      was_reviewed_field[NAME],
                                      was_reviewed_field[params.ROW_ID], was_reviewed_field[params.PARENT])
        validation.save_form_changes()
        alert_text = validation.get_alert_text()
        if texts.INCONSISTENT_CONF not in alert_text:
            errors.append(f"expected {texts.INCONSISTENT_CONF} to be in alert, got {alert_text}")
        validation.confirm_alert()
        amount_field[NEW_VALUE] = 1002
        amount_field[params.NEW_VALUE_PASS] = True

        ib_rate_field[NEW_VALUE] = round(float(max_fx_rate) + 0.1, 3)
        was_reviewed_field[NEW_VALUE] = None
        validation.select_sub_table_row_by_id(row_to_edit)
        for field in [amount_field, ib_rate_field, org_name_field, is_consumer_field, was_reviewed_field]:
            errors += audit_field(browser, field, apply_to_all=True)
        validation.save_form_changes()
        alert_text = validation.get_alert_text()
        if texts.SUCCESSFULLY_UPDATED not in alert_text:
            errors.append(f"expected {texts.SUCCESSFULLY_UPDATED} in alert, got {alert_text}")
        validation.confirm_alert()
        # check DB changes:
        upd_doc = find_docs_in_collection(collection_name, {RECORD_ID: doc_id})
        for field in [amount_field, ib_rate_field, org_name_field, is_consumer_field, was_reviewed_field]:
            field_value_db = [x[field[NAME]] for x in upd_doc[CURRENT_STATE][field[
                params.PARENT]] if field[params.ROW_ID].replace(field[params.PARENT], "") == str(x["_id"])]
            if field_value_db and field_value_db[0] != field[NEW_VALUE]:
                errors.append(
                    f"expected value in object for {field[NAME]} to be {field[NEW_VALUE]} got {field_value_db[0]}")
            elif not field_value_db:
                errors.append(f"expected field {field[NAME]} to be found in db")
            assert errors == []

    @pytest.mark.bulk_changes_weird_results
    @doc_it()
    @pytest.mark.parametrize("collection_name", [TESTING_HALINA])
    def test_12352_weird_results_bulk_changes(self, browser, collection_name, gen_data):
        """
        The user audits first row and sets bulk changes checkbox to True but does
        not set comment to the field.
        The user audits second row and sets comment to the field.
        Check that comment is really applies and sent to db
        """
        errors = []
        doc_id = 1
        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        row_ids = validation.get_all_ids_from_field_with_sub_ranges(CONSUMER_MARGINS)
        row_to_edit = row_ids[0]
        field = {
            NAME: "amount",
            NEW_VALUE: random.randint(1000, 3000),
            params.NEW_VALUE_PASS: False,
            params.PARENT: CONSUMER_MARGINS,
            params.ROW_ID: row_to_edit,
            TYPE: NUMERIC,
            VALID: False
        }
        validation.select_sub_table_row_by_id(row_ids[0])
        errors += audit_field(browser, field, apply_to_all=True)
        validation.select_sub_table_row_by_id(row_ids[1])
        validation.select_sub_table_row_by_id(row_ids[0])
        field[COMMENT] = "another"
        errors += audit_field(browser, field)
        validation.select_sub_table_row_by_id(row_ids[1])
        field[VALID] = True
        field[params.ROW_ID] = row_ids[1]
        errors += audit_field(browser, field)
        validation.select_sub_table_row_by_id(row_ids[2])
        field[COMMENT] = Faker().name()
        field[VALID] = False
        field[params.ROW_ID] = row_ids[2]
        errors += audit_field(browser, field, apply_to_all=True)
        # check that all values are new the table
        upd_rows = row_ids.copy()
        del upd_rows[2]
        for row in upd_rows:
            validation.select_sub_table_row_by_id(row)
            val = validation.get_sub_table_field_upd_value(row, field[NAME])
            if val != f"{field[NEW_VALUE]}":
                errors.append(f"expected column value to be {field[NEW_VALUE]} got {val}")
        validation.save_form_changes()
        validation.confirm_alert()
        # check audit:
        upd_doc = find_docs_in_collection(collection_name, {RECORD_ID: doc_id})
        audited_fields = upd_doc[AUDIT_SESSIONS][-1][AUDIT_VALUE_ARRAY]
        for audited in audited_fields:
            if audited[NEW_VALUE] != field[NEW_VALUE]:
                errors.append(f"expected field value to be {field[NEW_VALUE]} got {audited[NEW_VALUE]}")
            if audited[VALID] is not False:
                errors.append(f"expected field valid to be False got {audited[VALID]}")
            if audited[AUDITED_COMMENT] != field[COMMENT]:
                errors.append(
                    f"expected field comment to be {field[COMMENT]} got {audited[AUDITED_COMMENT]}")
        assert errors == []

    @pytest.mark.set_score_audit_check
    @doc_it()
    @pytest.mark.parametrize("collection_name, record_id", [(GLOB_TEST_WITH_EXC_FOR_APP, 445)])
    def test_12277_12278_conf_score_display_in_search(self, browser, collection_name, record_id, gen_data):
        """
        The user does not audit any field but set
        new confidence score for the document.
        The user checks that score is set properly in DB and dispalyed on form.
        The user goes to the search form.
        The user searches document but newly set score.
        The user checks that confidence score is properly displayed
        in search table results.
        """
        errors = []
        current_doc = find_docs_in_collection(collection_name, {RECORD_ID: record_id})
        primary_score = current_doc[AUDIT_STATE][
            CONFIDENCE_SCORE]
        primary_audit_sessions_number = len(current_doc[AUDIT_SESSIONS])
        primary_audit_number = current_doc[AUDIT_STATE][AUDIT_NUMBER]
        if primary_audit_sessions_number != primary_audit_number:
            errors.append(f"Config is inconsistent")
        login_and_go_to_url(browser, collection_name, record_id)
        validation = ValidationPage(browser)
        doc_config = find_docs_in_collection(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name})
        score_on_form = validation.get_current_doc_score()
        score_to_be_displayed = map_confidence_score_by_key(doc_config, primary_score)
        if score_to_be_displayed != score_on_form:
            errors.append(f"expected displayed {primary_score} got {score_to_be_displayed} on form")
        validation.open_score_list()
        options = validation.get_options_list()
        options.remove(score_on_form)
        set_score = options[0]
        validation.select_option_by_text(set_score)
        validation.save_form_changes()
        validation.confirm_alert()
        key_set_score = map_confidence_score_by_value(doc_config, set_score)
        # switch to first tab
        validation.go_to_url(urls.DASHBOARD)
        search = SearchPage(browser)
        set_filters(browser, fields=[{params.VALUE: record_id},
                                     {NAME: CONFIDENCE_SCORE, params.VALUE: set_score, params.IS_INPUT: False}],
                    collection_name=collection_name)
        time.sleep(1)
        # check that document is found:
        if not search.check_number_of_found_records_in_search(1):
            errors.append(f"Expected 1 records to be in second search")
        # check ConfidenceScore in the table:
        score_value_in_table = search.get_row_cell_value(1, CONFIDENCE_SCORE)
        if score_value_in_table != str(key_set_score):
            errors.append(f"expected score in table {str(key_set_score)} got {score_value_in_table}")
        # check that number of audits stayed the same
        updated_doc = find_docs_in_collection(collection_name, {RECORD_ID: record_id})
        updated_audit_sessions = len(updated_doc[AUDIT_SESSIONS])
        updated_audit_number = updated_doc[AUDIT_STATE][AUDIT_NUMBER]
        # check that audit session contains info only about audit session
        last_audit = updated_doc[AUDIT_SESSIONS][-1]
        if len(last_audit[AUDIT_VALUE_ARRAY]) != 1:
            errors.append(f"expected 1 audit value array to be added")
        audited_info = last_audit[AUDIT_VALUE_ARRAY][0]
        if audited_info[AUDIT_FIELD_NAME] != CONFIDENCE_SCORE:
            errors.append(
                f"expected field to be {CONFIDENCE_SCORE}, got {audited_info[AUDIT_FIELD_NAME]}")
        if audited_info[NEW_VALUE] != key_set_score:
            errors.append(f"expected new value to be {key_set_score} got {audited_info[NEW_VALUE]}")
        if audited_info[OLD_VALUE] != primary_score:
            errors.append(f"expected old value to be {primary_score} got {audited_info[OLD_VALUE]}")
        if updated_doc[AUDIT_STATE][AUDIT_NUMBER] != primary_audit_number + 1:
            errors.append(
                f"expected audit number in audit session to be {primary_audit_number + 1}, got {updated_doc[AUDIT_STATE][AUDIT_NUMBER]}")
        if updated_audit_number != updated_audit_sessions:
            errors.append(
                f"expected length of audit sessions =  {updated_audit_sessions} to be equal to audit number = {updated_audit_number}")
        assert errors == []

    @pytest.mark.check_copy_config
    @doc_it()
    def test_12173_copy_config(self, browser):
        """
        The user sets configuration
        {"AllowCopyFunction": False}
        to disallow copying documents for the collection.
        The user goes to the document and clicks on copy btn.
        The user checks that document was not copied and
        notification is displayed for the user.
        """
        # todo: check that number of documents in the collection stayed the same
        # todo: add to jest tests
        errors = []
        collection_name = TESTING_HALINA
        doc_id = 1
        update_mongo(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name},
                     {"$set": {"AllowCopyFunction": False}})
        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        validation.copy_record()
        alert_text = validation.get_alert_text()
        if texts.COPY_NOT_ALLOWED not in alert_text:
            errors.append(f"expected {texts.COPY_NOT_ALLOWED} to be in alert, got {alert_text}")
        update_mongo(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name},
                     {"$set": {"AllowCopyFunction": True}})
        assert errors == []

    @pytest.mark.check_api_call_for_changed_time
    @doc_it()
    @pytest.mark.config_update
    @pytest.mark.parametrize("collection_name, record_id", [(GLOB_TEST_WITH_EXC_FOR_APP, 445)])
    def test_12297_api_call_for_changed_time(self, browser, collection_name, record_id, gen_data):
        """
        The user changes only time
        in sub-table row in the document.
        The user clicks on save btn.
        The user checks that interbank rate
        was updated.
        The user checks that interbank rate is actually the same as was returned from api.
        """
        errors = []
        api_url = "http://interbank-api.fxcintel.com/api/v1/rate"
        api_token = "yJF0vbGcE9wAux2E"
        update_mongo(collection_name, {RECORD_ID: record_id}, {"$set": {
            f"{CURRENT_STATE}.{AMOUNTS_AND_RATES}.$[].{INTERBANK_RATE}": None}})

        update_mongo(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name},
                     {"$set": {"ib_api_auto_update": {
                         "on": True,
                         "dependency_fields": {
                             "currency_from": "currency_from",
                             "currency_to": "currency_to",
                             "timestamp": "amounts_and_rates.datetime_collected_utc"
                         },
                         "fields_to_update": {
                             "rate": "amounts_and_rates.interbank_rate"
                         },
                         "url_field": "amounts_and_rates.ib_api_url",
                         "token": api_token,
                         "base_url": api_url
                     }}})

        login_and_go_to_url(browser, collection_name, record_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        row_ids = validation.get_all_ids_from_field_with_sub_ranges(AMOUNTS_AND_RATES)
        primary_rate = validation.get_cell_val_by_name("interbank_rate", row_ids[0], AMOUNTS_AND_RATES)
        currency_from = validation.get_cell_val_by_name(CURRENCY_FROM)
        currency_to = validation.get_cell_val_by_name(CURRENCY_TO)
        print(f"""{
        NAME,
        TYPE,
        params.MIXED_VALUE,
        NEW_VALUE,
        params.UTC,
        params.PARENT,
        params.ROW_ID,
        VALID
        }""")
        field = {
            NAME: DATETIME_COLLECTED_UTC,
            TYPE: DATE_TYPE,
            params.MIXED_VALUE: True,
            NEW_VALUE: "20200302221400",
            params.UTC: -1,
            params.PARENT: AMOUNTS_AND_RATES,
            params.ROW_ID: row_ids[0],
            VALID: False
        }
        validation.select_sub_table_row_by_id(row_ids[0])
        errors += audit_field(browser, field)
        validation.save_form_changes()
        alert_text = validation.get_alert_text()
        if texts.SUCCESSFULLY_UPDATED not in alert_text:
            errors.append(f"expected {texts.SUCCESSFULLY_UPDATED} to be in alert got {alert_text}")
        validation.confirm_alert()
        url = f"""{api_url}?token={api_token}&mode=closest&currency_from={currency_from}&currency_to={currency_to}&timestamp=2020-03-02T23:14:00"""
        api_resp = requests.get(url).json()
        interbank_rate = validation.get_cell_val_by_name(INTERBANK_RATE, row_ids[0],
                                                         AMOUNTS_AND_RATES)
        if round(api_resp["rate"], 4) != round(float(interbank_rate), 4):
            errors.append(
                f"expected interbank_rate to be {round(api_resp['rate'], 4)} got {round(float(interbank_rate), 4)}")
        if primary_rate == interbank_rate:
            errors.append(f"rate was not changed after changing only time")
        assert errors == []

    @pytest.mark.check_empty_objects_not_removed
    @pytest.mark.parametrize("value", [0, 1])
    @doc_it()
    @pytest.mark.parametrize("collection_name", [TESTING_HALINA])
    def test_12348_check_empty_objects_are_not_removed(self, value, browser, collection_name, gen_data):
        """
        The user sets in config field
        ImageLinks to empty dict {} then to empty array [].
        The user changes score and checks
        that ImageLinks was not removed.
        The user audits field and checks that
        ImageLinks field was not removed and current State
        is the same for other fields
        """
        errors = []
        doc_id = 1
        if value == 0:
            update_mongo(collection_name, {RECORD_ID: doc_id},
                         {"$set": {f"{CURRENT_STATE}.{IMAGE_LINKS}": {}}})
        else:
            update_mongo(collection_name, {RECORD_ID: doc_id},
                         {"$set": {f"{CURRENT_STATE}.{IMAGE_LINKS}": []}})
        primary_state = find_docs_in_collection(collection_name, {RECORD_ID: doc_id})
        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        validation.set_score("Unsure")
        validation.save_form_changes()
        validation.confirm_alert()
        upd_doc = find_docs_in_collection(collection_name, {RECORD_ID: doc_id})
        if upd_doc[CURRENT_STATE] != primary_state[CURRENT_STATE]:
            errors.append(f"expected CurrentState after update to be equal")
        field = {
            NAME: RESEARCHER_NAME,
            NEW_VALUE: Faker().name(),
            TYPE: TEXT,
            VALID: False
        }
        errors += audit_field(browser, field)
        validation.save_form_changes()
        validation.confirm_alert()
        create_random_docs_and_config(collection_name)
        sec_upd_doc = find_docs_in_collection(collection_name, {RECORD_ID: doc_id})
        upd_doc[CURRENT_STATE][field[NAME]] = field[NEW_VALUE]
        if [x for x in upd_doc[CURRENT_STATE].keys()] != [x for x in sec_upd_doc[CURRENT_STATE].keys()]:
            errors.append(f"expected doc keys list is the same")
        assert errors == []

    @pytest.mark.skip
    @pytest.mark.rollback_invalid_config
    @doc_it()
    @pytest.mark.config_update
    @pytest.mark.parametrize("collection_name, record_id", [(GLOB_TEST_WITH_EXC_FOR_APP, 445)])
    def test_12369_rollback_invalid_config(self, browser, collection_name, record_id, gen_data):
        """
        The user sets incorrect config and
        updates collected dt field
        that should cause update for rates.
        Check that update does not happen
        """
        # todo: check if we have any invalid config, if yes, add to jest
        errors = []
        incorrect_config = {
            "on": True,
            "dependency_fields": [
                {
                    "currency_from": "currency_from"
                },
                {
                    "currency_to": "currency_to"
                },
                {
                    "timestamp": "amounts_and_rates.datetime_collected_utc"
                }
            ],
            "fields_to_update": {
                "rate": "amounts_and_rates.interbank_rate",
                "url_field": "amounts_and_rates.ib_api_url"
            },
            "token": "yJF0vbGcE9wAux2E",
            "base_url": "http://interbank-api.fxcintel.com/api/v1/rate"
        }
        update_mongo(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name},
                     {"$set": {IB_API_AUTO_UPDATE: incorrect_config}})
        login_and_go_to_url(browser, collection_name, record_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        row_ids = validation.get_all_ids_from_field_with_sub_ranges(AMOUNTS_AND_RATES)
        # get value for the first row:
        current_state_doc = find_docs_in_collection(collection_name, {RECORD_ID: record_id})[CURRENT_STATE][
            AMOUNTS_AND_RATES]
        dt_collected = \
            [x for x in current_state_doc if str(x["_id"]) == row_ids[0].replace(AMOUNTS_AND_RATES, '')][0][
                DATETIME_COLLECTED_UTC]
        new_date = datetime.strftime((dt_collected - timedelta(days=1)).date(), "%Y-%m-%d")
        field = {
            NAME: DATETIME_COLLECTED_UTC,
            params.PARENT: AMOUNTS_AND_RATES,
            params.ROW_ID: row_ids[0],
            NEW_VALUE: new_date,
            TYPE: DATE_TYPE,
            VALID: False
        }
        validation.select_sub_table_row_by_id(row_ids[0])
        errors += audit_field(browser, field)
        validation.save_form_changes()
        alert_text = validation.get_alert_text()
        if texts.API_REQUEST_FAILED not in alert_text:
            errors.append(f"expected {texts.API_REQUEST_FAILED} to be in alert got {alert_text}")
        validation.confirm_alert()
        # check that no changes were done:
        doc_after_change = find_docs_in_collection(collection_name, {RECORD_ID: record_id})[CURRENT_STATE][
            AMOUNTS_AND_RATES]

        if current_state_doc != doc_after_change:
            errors.append(f"expected doc was not changed")
        assert errors == []

    @pytest.mark.calendar_time_display
    @doc_it()
    def test_12409_calendar_time_display(self, browser):
        """
        The user selects document.
        The user validates the field
        and checks that displayed datetime in calendar
        input is the same as in the calendar widget
        #12409
        """
        errors = []
        collection_name = GLOB_TEST_WITH_EXC_FOR_APP
        doc_id = 445
        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        row_ids = validation.get_all_ids_from_field_with_sub_ranges(AMOUNTS_AND_RATES)
        doc = find_docs_in_collection(collection_name, {RECORD_ID: doc_id})[CURRENT_STATE][
            AMOUNTS_AND_RATES]
        field = {
            NAME: DATETIME_COLLECTED_UTC,
            params.MIXED_VALUE: True,
            TYPE: DATE_TYPE,
            params.PARENT: AMOUNTS_AND_RATES,
            NEW_VALUE: datetime.now().replace(hour=4, minute=4, second=4),
            params.ROW_ID: row_ids[0],
            VALID: False
        }
        validation.select_sub_table_row_by_id(row_ids[0])
        errors += audit_field(browser, field)
        validation.open_calendar(field[NAME], field[params.PARENT])
        cal_time = validation.get_time_from_calendar()
        if int(cal_time[:cal_time.index(":")]) != field[NEW_VALUE].hour and int(
                cal_time[cal_time.index(":") + 1:cal_time.index(" ")]) != field[NEW_VALUE].minute:
            errors.append("calendar time is not as in db")
        assert errors == []

    @pytest.mark.check_clear_seconds_in_calendar
    @doc_it()
    @pytest.mark.parametrize("collection_name, record_id", [(GLOB_TEST_WITH_EXC_FOR_APP, 445)])
    def test_12433_change_cal_time(self, browser, collection_name, record_id, gen_data):
        """
        The user audits field
        and checks that when he selects
        new value for time
        than seconds are changed to 00.
        Issue #12433
        """
        errors = []
        login_and_go_to_url(browser, collection_name, record_id)
        validation = ValidationPage(browser)
        row_ids = validation.get_all_ids_from_field_with_sub_ranges(AMOUNTS_AND_RATES)
        field = {
            NAME: DATETIME_COLLECTED_UTC,
            TYPE: DATE_TYPE,
            params.PARENT: AMOUNTS_AND_RATES,
            params.ROW_ID: row_ids[0],
            NEW_VALUE: "20200205121555",
            params.MIXED_VALUE: True,
            VALID: False
        }
        validation.select_sub_table_row_by_id(row_ids[0])
        errors += audit_field(browser, field)
        validation.save_form_changes()
        validation.confirm_alert()
        field[params.TIME] = "08:35 AM"
        field[params.MIXED_VALUE] = False
        field[NEW_VALUE] = None
        validation.select_sub_table_row_by_id(row_ids[0])
        errors += audit_field(browser, field)
        inp_val = validation.get_calendar_input_value(field[NAME], field[params.PARENT])
        if inp_val[inp_val.index(" ") + 1:] != "08:35:00":
            errors.append(f"expected displayed value in the input 08:35:00 got {inp_val[inp_val.index(' ') + 1:]}")
        validation.save_form_changes()
        validation.confirm_alert()
        cell_val = validation.get_cell_value_by_row_number_and_column_name(field[params.PARENT], 1,
                                                                           field[NAME])
        if cell_val[cell_val.index("T") + 1:] != "08:35:00.000Z":
            errors.append(f"expected new time to be '08:35:00.000Z' got {cell_val[cell_val.index(' ')]}")
        assert errors == []

    @pytest.mark.hint_on_values
    @doc_it()
    def test_11933_hint_on_values(self, browser):
        """
        The user hovers on cells values and
        checks that datatype and value is displayed in the hint.
        """
        errors = []
        collection_name = TESTING_HALINA
        doc_id = 1
        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        config = find_docs_in_collection(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name})
        default_audited = config[DEFAULT_AUDIT_FIELDS]
        undisplayable = config[UN_DISPLAYABLE_FIELDS]
        hofields_on_form = [x for x in default_audited if type(x) != dict and x not in undisplayable]
        for field in hofields_on_form:
            full_text_in_hint = validation.get_on_hover_field_hint(field)
            if "\n" in full_text_in_hint:
                hint_text = full_text_in_hint.split("\n")
                data_type = hint_text[0]
                cur_value = hint_text[1]
            else:
                data_type = full_text_in_hint
                cur_value = ''
            val = validation.get_cell_val_by_name(field)

            field_validators = [x for x in config[VALIDATORS] if x[NAME] == field]
            if field_validators:
                field_validator = field_validators[0]
            else:
                field_validator = {TYPE: "string"}
            if data_type.find(":") == data_type.rfind(":"):
                if data_type[data_type.find(":") + 2:] != field_validator[TYPE]:
                    errors.append(
                        f"expected data type to be {field_validator[TYPE]} in {data_type} for the field {field}")
            else:
                if data_type[data_type.find(":") + 2:data_type.rfind(":")] != field_validator[TYPE]:
                    errors.append(
                        f"expected data type to be {field_validator[TYPE]} in {data_type} for the field {field}")

            if field_validator[TYPE] == ENUM:
                if [x for x in field_validator[CONSTRAINTS][VALUES] if type(x) == list]:
                    db_val = ",".join([','.join(x) for x in field_validator[CONSTRAINTS][VALUES]])
                else:
                    db_val = ','.join(field_validator[CONSTRAINTS][VALUES])
                if data_type[data_type.rfind(":") + 2:] != db_val:
                    errors.append(f"expected enum list to be the same as in db for the field {field}")
            if val != cur_value:
                errors.append(f"hint text value differs from value in cell for the field {field}")
        assert errors == []

    @pytest.mark.check_precision_display
    @doc_it()
    def test_11880_check_precision_display(self, browser):
        """
        The user checks that displayed decimal number
        is the same as set in configuration
        :return:
        """
        errors = []
        collection_name = TESTING_HALINA
        doc_id = 1
        update_mongo(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name}, {"$set": {"FloatDisplayPrecision": {
            GDP_GROWTH: 6,
            "ConsumerMargins.fx_margin": 2,
            "ConsumerMargins.full_cost": 4
        }}})
        update_mongo(collection_name, {RECORD_ID: doc_id}, {"$set": {f"{CURRENT_STATE}.{GDP_GROWTH}": 4.123456789}})
        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        row_ids = validation.get_all_ids_from_field_with_sub_ranges(CONSUMER_MARGINS)
        for row in row_ids:
            cell_full_cost_val = validation.get_cell_val_by_name(FULL_COST, row, CONSUMER_MARGINS)
            if abs(decimal.Decimal(cell_full_cost_val).as_tuple().exponent) != 4:
                errors.append("expected number of decimals to be 5")
            cell_fx_margin_val = validation.get_cell_val_by_name(FX_MARGIN, row, CONSUMER_MARGINS)
            if abs(decimal.Decimal(cell_fx_margin_val).as_tuple().exponent) != 2:
                errors.append("expected number of decimals to be 2")
        gdp_growth_val = validation.get_cell_val_by_name(GDP_GROWTH)
        if abs(decimal.Decimal(gdp_growth_val).as_tuple().exponent) != 6:
            errors.append("expected number of decimals to be 6")
        update_mongo(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name},
                     {"$unset": {"FloatDisplayPrecision": ""}})
        assert errors == []

    @pytest.mark.clear_marked_point
    @doc_it()
    @pytest.mark.parametrize("collection_name, record_id", [(GLOB_TEST_WITH_EXC_FOR_APP, 445)])
    def test_12098_clear_marked_point(self, browser, collection_name, record_id, gen_data):
        """
        The user removes row and saves document.
        Check that there is no any mark on row
        (previously was grey background on the last row)
        """
        errors = []
        login_and_go_to_url(browser, collection_name, record_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        row_ids = validation.get_all_ids_from_field_with_sub_ranges(AMOUNTS_AND_RATES)
        validation.select_sub_table_row_by_id(row_ids[0])
        validation.remove_sub_table_row(row_ids[-1])
        validation.save_form_changes()
        validation.confirm_alert()
        for row in row_ids[:-1]:
            row_classname = validation.get_class_of_low_level_table_row(row)
            if "chart_selected_point" in row_classname:
                errors.append("expected no class is set")
        assert errors == []

    @pytest.mark.skip_update
    @doc_it()
    def test_11931_skip_update(self, browser):
        """
        The user sets up invalid config.
        The user checks that when clicking on save
        btn the notification about invalid config is displayed.
        No changes are done to db.
        """
        errors = []
        collection_name = TESTING_HALINA
        doc_id = 2
        cur_doc = find_docs_in_collection(collection_name, {RECORD_ID: doc_id})
        config = find_docs_in_collection(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name})
        author = Faker().name()
        ib_rate = round(random.uniform(0, 1), 2)
        # set random value from possible but not existent
        currency_from_possible_vals = [x for x in config[VALIDATORS] if x[NAME] == CURRENCY_FROM][0][CONSTRAINTS][
            VALUES]
        currency_from = [x for x in currency_from_possible_vals if x != cur_doc[CURRENT_STATE][CURRENCY_FROM]][0]
        dt = datetime.strftime(datetime.utcnow(), "%Y-%m-%dT%H:%M:%S")
        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        row_ids = validation.get_all_ids_from_field_with_sub_ranges(CONSUMER_MARGINS)
        cons_margins = find_docs_in_collection(collection_name, {RECORD_ID: doc_id})[CURRENT_STATE][CONSUMER_MARGINS]
        primnary_ib_rate = \
            [x[IB_RATE] for x in cons_margins if str(x["_id"]) == row_ids[0].replace(CONSUMER_MARGINS, '')][
                0]
        fields = [{NAME: AUTHOR, TYPE: TEXT, VALID: False, NEW_VALUE: author, COMMENT: Faker().name()},
                  {NAME: CURRENCY_FROM, TYPE: ENUM, VALID: False, NEW_VALUE: currency_from}]
        ib_rate_to_all = {NAME: IB_RATE, params.PARENT: CONSUMER_MARGINS, params.ROW_ID: row_ids[0], TYPE: NUMERIC,
                          VALID: False,
                          NEW_VALUE: ib_rate}
        for field in fields:
            errors += audit_field(browser, field)
        validation.select_sub_table_row_by_id(row_ids[0])
        errors += audit_field(browser, ib_rate_to_all, apply_to_all=True)
        validation.save_form_changes()
        alert_text = validation.get_alert_text()
        if texts.INCONSISTENT_CONF not in alert_text:
            errors.append(f"expected {texts.INCONSISTENT_CONF} to be in alert")
        validation.confirm_alert()
        if validation.get_field_comment(AUTHOR):
            errors.append("expected comments to be cleared")
        row_classes = validation.get_class_of_low_level_table_row(row_ids[0])
        if "chart_selected_point" in row_classes:
            errors.append("expected no class is set")
        audit_session = [{
            AUDIT_FIELD_NAME: f"{ib_rate_to_all[params.PARENT]}.{ib_rate_to_all[params.ROW_ID].replace(ib_rate_to_all[params.PARENT], '')}.{ib_rate_to_all[NAME]}",
            NEW_VALUE: ib_rate, OLD_VALUE: primnary_ib_rate, VALID: ib_rate_to_all[VALID], AUDITED_COMMENT: None}]
        errors += compare_elk_logs(dt, collection=collection_name, update_success=False,
                                   notification=texts.INCONSISTENT_CONF, logtype=texts.AUTOMATIC_UPDATE,
                                   total_upd_number=len(row_ids) * 2)
        errors += compare_elk_logs(dt, collection=collection_name, update_success=False,
                                   notification=texts.INCONSISTENT_CONF, logtype=texts.MANUAL_AUDIT,
                                   audit_session=audit_session)
        assert errors == []

    @pytest.mark.interrupt_save_actions
    @pytest.mark.parametrize("collection_name", [TESTING_HALINA])
    @doc_it()
    def test_12713_interrupt_save_actions(self, browser, collection_name, gen_data):
        """
        The user validates doc and sets up the same value that
        was previously.
        Check that no audit session is written and
        notification is displayed to the user.
        """
        # todo: add to jest
        errors = []
        doc_id = 2
        author = Faker().name()
        fee_value = random.randint(1, 100)
        currency_from = "USD"
        update_mongo(collection_name, {RECORD_ID: doc_id},
                     {"$set": {f"{CURRENT_STATE}.{CONSUMER_MARGINS}.$[].{FEE}": fee_value, AUTHOR: author,
                               CURRENCY_FROM: currency_from,
                               COMMENT: Faker().cryptocurrency_name()}})
        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        row_ids = validation.get_all_ids_from_field_with_sub_ranges(CONSUMER_MARGINS)
        field = {NAME: AUTHOR, TYPE: TEXT, VALID: True}
        errors += audit_field(browser, field)
        validation.select_sub_table_row_by_id(row_ids[0])
        fee_to_all = {NAME: FEE, params.PARENT: CONSUMER_MARGINS, params.ROW_ID: row_ids[0], TYPE: NUMERIC,
                      VALID: False,
                      NEW_VALUE: fee_value}
        errors += audit_field(browser, fee_to_all, apply_to_all=True)
        validation.save_form_changes()
        alert_text = validation.get_alert_text()
        if texts.SAME_VALUE not in alert_text:
            errors.append(f"expected text to contain {texts.SAME_VALUE} got {alert_text}")
        validation.confirm_alert(False)
        alert_text = validation.get_alert_text()
        if texts.SUCCESSFULLY_UPDATED not in alert_text:
            errors.append(f"expected text {texts.SUCCESSFULLY_UPDATED} to be in alert")

        # check db:
        audit_sessions = find_docs_in_collection(collection_name, {RECORD_ID: doc_id})[AUDIT_SESSIONS]
        if len(audit_sessions) != 1:
            errors.append(f"expected audit length to be 1")
        if audit_sessions[0][AUDIT_VALUE_ARRAY][-1][AUDIT_FIELD_NAME] != AUTHOR:
            errors.append(f"expected audit session to be by field {AUTHOR}")

        assert errors == []

    @pytest.mark.no_audit_for_same_value
    @doc_it()
    def test_no_audit_for_same_value(self, browser):
        """
        The user audits field and set it as invalid.
        The user sets new value the same as previous value.
        Check that value is not changed, notification is displayed to the user.
        No audit is written to DB.
        """
        # todo: add to jest
        errors = []
        collection_name = TESTING_HALINA
        doc_id = 2
        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        cur_value = validation.get_cell_val_by_name(CURRENCY_FROM)
        field = {
            NAME: CURRENCY_FROM,
            NEW_VALUE: cur_value,
            TYPE: ENUM,
            VALID: False
        }
        dt = datetime.strftime(datetime.utcnow(), "%Y-%m-%dT%H:%M:%S")
        errors += audit_field(browser, field)
        validation.save_form_changes()
        alert_text = validation.get_alert_text()
        if texts.SAME_VALUE not in alert_text:
            errors.append(f"expected {texts.SAME_VALUE} to be in alert, got: {alert_text}")
        validation.confirm_alert()
        # check db that auditState was not increased
        db_after_change = find_docs_in_collection(collection_name, {RECORD_ID: doc_id})
        if db_after_change[AUDIT_STATE][AUDIT_NUMBER] != 0:
            errors.append("expected auditNumber to be 0")
        errors += compare_elk_logs(dt, audit_session=[
            {AUDIT_FIELD_NAME: field[NAME], OLD_VALUE: cur_value, NEW_VALUE: cur_value, VALID: field[VALID],
             AUDITED_COMMENT: None}], logtype=texts.MANUAL_AUDIT, notification=texts.SAME_VALUE)
        assert errors == []

    @pytest.mark.search_bar_for_sub_table
    @doc_it()
    def test_12939_search_bar_for_sub_table(self, browser):
        """
        The user founds documents with 3 and more
        than 3 sub-items in sub-table.
        Check that search bar is visible for only
        those doc where len(sub-items)>3
        """
        errors = []
        collection_name = GLOB_TEST_WITH_EXC_FOR_APP
        docs_aggregated = list(find_docs_in_collection(collection_name,
                                                       [{'$project': {RECORD_ID: 1, 'amount_count': {
                                                           '$size': '$CurrentState.amounts_and_rates'}}}],
                                                       action_find=False))

        login_to_app(browser)
        validation = ValidationPage(browser)
        without_bar = [x for x in docs_aggregated if x['amount_count'] < 4]
        with_bar = [x for x in docs_aggregated if x['amount_count'] >= 4]
        for el in [without_bar, with_bar]:
            present = True if el == with_bar else False
            if el:
                doc_id = without_bar[0][RECORD_ID]
                validation.go_to_url(f"/detail/{collection_name}/{doc_id}")
                validation.remove_fixed_elements()
                if validation.check_search_bar_presence():
                    errors.append(f"expected search bar present={present} for doc with recordID={doc_id}")
        assert errors == []

    @pytest.mark.check_duplicates_remove
    @doc_it()
    @pytest.mark.collection_not_to_update
    @pytest.mark.parametrize("collection_name", [TESTING_HALINA])
    @pytest.mark.parametrize("field, is_high", [("capital", True), (CONSUMER_MARGINS, False)])
    def test_remove_duplicate_fields(self, browser, field, is_high, collection_name, gen_data):
        """
        User sets up duplicate fields in DefaultFieldsToDisplayInAuditSession for high level field
        and for low level field
        """
        errors = []
        doc_id = 2
        update_mongo(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name},
                     {"$push": {DEFAULT_AUDIT_FIELDS: field}})

        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        # check that only one element is on the form
        number_of_els = validation.count_fields_or_sub_tables(field, is_high)
        if number_of_els != 1:
            errors.append(f"expected number of fields {field} on form is 1 got {number_of_els}")
        assert errors == []

    @pytest.mark.check_conf_score_set
    @doc_it()
    @pytest.mark.collection_not_to_update
    @pytest.mark.parametrize("collection_name", [TESTING_HALINA])
    def test_12083_check_conf_score_display(self, browser, collection_name, gen_data):
        """
        User changes configuration.
        User sets up new config:
        "ConfidenceScores" : {
            "DisplayScoreText" : "This is confidence Score",
            "DisplayNoteText" : "This is note on confidence score",
            "ConfidenceScoreOptions" : {
                "Totally Wrong" : 0,
                "Unsure" : 1,
                "Confident" : 2,
                "Very Confident" : 3,
                "Unfinished" : -999
            }
        }
        Check that text in footer is the same as set in config
        """
        errors = []
        doc_id = 1
        collection_name = TESTING_HALINA
        display_score_text = "This is confidence Score"
        display_note_text = "This is note on confidence score"
        update_mongo(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name}, {
            "$set": {"ConfidenceScores.DisplayScoreText": display_score_text,
                     "ConfidenceScores.DisplayNoteText": display_note_text}})

        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        if not validation.check_text_on_confidence_score(display_score_text):
            errors.append(f"expected text in score is {display_score_text}")
        if not validation.check_text_on_confidence_score(display_score_text):
            errors.append(f"expected text in note on score is {display_note_text}")
        assert errors == []

    @pytest.mark.skip
    @pytest.mark.sub_fields_display_from_doc
    @pytest.mark.parametrize("params_fields", [DEFAULT_AUDIT_FIELDS])
    @doc_it()
    @pytest.mark.config_update
    @pytest.mark.parametrize("collection_name, record_id", [(GLOB_TEST_WITH_EXC_FOR_APP, 3170)])
    def test_12776_sub_doc_fields_display_after_changed_from_admin_panel(self, browser, params_fields, collection_name,
                                                                         record_id, gen_data):
        """
        The user set default schema for the DefaultFieldsToDisplayInAuditSession
        The user opens Admin portal and adds a new fields
        The user go to the DV portal Audit Screen -> DefaultFieldsToDisplayInAuditSession
        The user check if the amounts_and_rates table with columns
        The user check if the amounts_and_rates table with data
        """
        # todo: recheck the test
        errors = []
        without_all_in_config = [
            "provider_name",
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
                    "interbank_rate",
                    "ib_api_url",
                    "fx_rate",
                    "fx_margin",
                    "amount_margin_approved",
                    "amount_duplicated",
                    "outside_of_min_max_fx_margin",
                    "fx_margin_reldiff_gt15pct_mom",
                    "_id"
                ]
            }
        ]
        update_mongo(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name},
                     {"$set": {DEFAULT_AUDIT_FIELDS: without_all_in_config}})

        # Admin portal part
        option = params_fields
        login_to_app(browser, admin=True)
        admin_page = AdminPage(browser)
        admin_page.select_collection(collection_name)
        admin_page.select_link_by_text(AUDIT_SCREEN)
        admin_page.select_config_field(option)

        # get options from text area:
        page_unselected_items = get_container_items(admin_page, False)
        page_selected_items = get_container_items(admin_page, True)

        # check right(selected) list
        selected_sub_fields = []
        for k, v in page_selected_items[params.SUB_FIELDS_ITEMS_WITH_PARENT].items():
            selected_sub_fields.extend([x.replace(f"{k}.", "") for x in v])
        selected_on_form = selected_sub_fields + page_selected_items[params.HOF_ITEMS]

        # check that until user doesn't select items arrow btns are disabled
        if admin_page.handle_arrow_btn(right=True, enabled=False) and admin_page.handle_arrow_btn(
                right=False,
                enabled=False) and admin_page.handle_save_click(
            False):
            errors.append("expected arrow btns to be disabled")
        # get random:
        items_to_add = []
        for i in range(3):
            item = random.choice(page_unselected_items[params.HOF_ITEMS])
            admin_page.select_container_item(False, item)
            items_to_add.append(item)
        # right btn should be enabled now and user clicks on it
        time.sleep(2)
        if not admin_page.handle_arrow_btn():
            errors.append("expected right button to be enabled")
        # check left_list
        left_list = get_container_items(admin_page, False)
        right_list = get_container_items(admin_page, True)
        left_selected_sub_fields = []
        for k, v in left_list[params.SUB_FIELDS_ITEMS_WITH_PARENT].items():
            left_selected_sub_fields.extend([x.replace(f"{k}.", "") for x in v])

        right_selected_sub_fields = []
        for k, v in right_list[params.SUB_FIELDS_ITEMS_WITH_PARENT].items():
            right_selected_sub_fields.extend([x.replace(f"{k}.", "") for x in v])
        left_items_list = left_list[params.HOF_ITEMS] + left_selected_sub_fields
        right_items_list = right_list[params.HOF_ITEMS] + right_selected_sub_fields
        time.sleep(5)

        admin_page.handle_save_click(True)

        # DV Portal part
        doc = find_docs_in_collection(collection_name, {RECORD_ID: record_id})
        all_fields_list_of_lists = [list(x.keys()) for x in doc[CURRENT_STATE][
            AMOUNTS_AND_RATES]]
        all_fields_set = set([item for sublist in all_fields_list_of_lists for item in sublist])
        col_config = find_docs_in_collection(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name})
        audit_fields = col_config[
            DEFAULT_AUDIT_FIELDS]
        default_audited = \
            [x for x in audit_fields if isinstance(x, dict) and x[NAME] == AMOUNTS_AND_RATES][0][
                DEFAULT_AUDIT_FIELDS]
        undisplayed_fields = [x.replace(f"{AMOUNTS_AND_RATES}.", "") for x in
                              col_config[UN_DISPLAYABLE_FIELDS] if
                              x.startswith(AMOUNTS_AND_RATES)]
        displayed_fields = set(default_audited) - set(undisplayed_fields)
        fields_can_be_added = all_fields_set - set(displayed_fields)
        fields_can_be_added.discard("_id")
        login_and_go_to_url(browser, collection_name, record_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        validation.dropdown_sub_table_select(AMOUNTS_AND_RATES)
        options_list = validation.get_options_list()
        if set(options_list) != fields_can_be_added:
            errors.append(f"expected list to be added: {fields_can_be_added} got {set(options_list)}")
        # add column to sub_table
        field_to_add = list(fields_can_be_added)[0]
        validation.select_option_by_text(field_to_add)
        validation.add_field_btn_click()
        # check that column is displayed
        after_add = validation.get_sub_range_column_names(AMOUNTS_AND_RATES)
        if field_to_add not in after_add:
            errors.append(f"expected {field_to_add} to be in column list")
        if not validation.remove_column_from_sub_field(AMOUNTS_AND_RATES, field_to_add):
            errors.append(f"expected {field_to_add} not to be visible in column list")
        # global update
        validation.global_updates()
        validation.dropdown_sub_table_select(AMOUNTS_AND_RATES)
        upd_options_list = validation.get_options_list()
        doc_upd = find_docs_in_collection(collection_name, {RECORD_ID: record_id})
        all_fields_list_of_lists_upd = [list(x.keys()) for x in doc_upd[CURRENT_STATE][
            AMOUNTS_AND_RATES]]
        all_fields_set_upd = set([item for sublist in all_fields_list_of_lists_upd for item in sublist])
        fields_can_be_added_upd = all_fields_set_upd - set(displayed_fields)
        fields_can_be_added_upd.discard("_id")
        if set(upd_options_list) != fields_can_be_added_upd:
            errors.append(f"expected options list to be {fields_can_be_added_upd}, got {fields_can_be_added_upd}")

        # check if records in the table
        row_ids = validation.get_all_ids_from_field_with_sub_ranges(AMOUNTS_AND_RATES)
        if len(row_ids) == 0:
            errors.append(f"The table is empty")

        for e in errors:
            print(e)
        assert errors == []
