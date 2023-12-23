import os
import time
from datetime import datetime

import pytest

from conftest import doc_it
from dbutil.db_utils import update_mongo, count_docs_mongo, find_docs_in_collection
from pages.search.search_page_actions import SearchPage
from pages.validation.validation_page_actions import ValidationPage
from params import texts, params, urls, db_params
from params.db_params import GLOB_TEST_WITH_EXC_FOR_APP, CURRENT_STATE, ORGANIZATION_ID, RECORD_ID, TESTING_HALINA, \
    VALID, CURRENCY_TO, PROVIDER_NAME, CONFIGURATION, COLLECTION_RELEVANT_FOR, CURRENCY_FROM, COLLECTED_DATE, \
    NOTE_ON_CONFIDENCE_SCORE, ISSUER_CARDS, VISIBILITY, ALLOWED_USERS
from params.db_params import NAME, \
    LAST_EDITED_BY, LAST_EDITED_AT, AUDIT_NUMBER, IMAGE_LINKS
from utils.app_actions import login_to_app, login_and_search_record_by_record_id, set_filters, login_and_go_to_url
from utils.app_utils import audit_field


@pytest.mark.usefixtures("remove_files")
class TestUnitSearchWithoutRegenData:
    @pytest.mark.check_search_by_fields
    @doc_it()
    @pytest.mark.parametrize("collection_name", [TESTING_HALINA])
    def test_11494_check_search_by_fields(self, browser, collection_name, gen_data):
        """
        The user checks search by fields
        :param browser:
        :return:
        """
        errors = []
        doc_id = 1
        score = "Confident"
        score_comment = "scored"
        fields = [{
            NAME: NOTE_ON_CONFIDENCE_SCORE,
        }, {
            NAME: LAST_EDITED_AT,
        }, {
            NAME: LAST_EDITED_BY,
        }, {
            NAME: AUDIT_NUMBER,
        }]
        # make audit and then check search by the fields
        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()

        errors += audit_field(browser, {NAME: "Author", VALID: True})
        validation.set_score(score)
        validation.set_score_comment(score_comment)
        validation.save_form_changes()
        validation.confirm_alert()
        cur_date = datetime.now().strftime("%Y-%m-%d")
        browser.switch_to.window(browser.window_handles[0])
        fields[0][params.VALUE] = score_comment
        fields[1][params.VALUE] = cur_date
        fields[2][params.VALUE] = "a1"
        fields[3][params.VALUE] = 2
        page = SearchPage(browser)
        # get results by ConfidenceScore
        page.go_to_url(urls.DASHBOARD)
        for f in fields:
            set_filters(browser, [f], collection_name)
            time.sleep(1)
            if not page.check_number_of_found_records_in_search(1):
                errors.append(f"expected 1 found record")
        assert errors == []

    @pytest.mark.check_img_links_in_search
    @doc_it()
    def test_11918_image_links_in_search(self, browser):
        """
        The user goes to search, enters params and
        tries to add field ImageLinks. Should be not found in add field
        dropdown
        """
        errors = []
        collection_name = TESTING_HALINA
        doc_id = 3
        login_and_search_record_by_record_id(browser, collection_name, doc_id)
        search_page = SearchPage(browser)
        search_page.add_field_drop()
        fields_to_be_added = search_page.get_options_list()
        if IMAGE_LINKS in fields_to_be_added:
            errors.append(f"{IMAGE_LINKS} should not be visible in add fields dropdown list")
        assert errors == []

    @pytest.mark.check_table_result_display
    @doc_it()
    def test_11957_table_not_displayed_for_empty_results(self, browser):
        """User initiates search in collection 1
        then after docs are found initiates search in collection 2.
        Check that for collection 2 table is not displayed"""
        errors = []
        collection_name_1 = TESTING_HALINA
        collection_name_2 = GLOB_TEST_WITH_EXC_FOR_APP
        doc_id = 3
        login_and_search_record_by_record_id(browser, collection_name_1, doc_id)
        page = SearchPage(browser)
        if not page.check_result_table_is_displayed():
            errors.append(f"expected table is visible")
        set_filters(browser, [{params.VALUE: 12000}], collection_name_2)
        if page.check_result_table_is_displayed():
            errors.append(f"expected table is not visible")
        assert errors == []

    @pytest.mark.check_search_fields_display
    @doc_it()
    def test_11930_search_screen(self, browser):
        errors = []
        collection_name = TESTING_HALINA
        other_collection = GLOB_TEST_WITH_EXC_FOR_APP
        doc_id = 3
        page = SearchPage(browser)
        login_and_search_record_by_record_id(browser, collection_name, doc_id)
        fields_to_be_added = page.get_add_column_values()
        if "capital" not in fields_to_be_added:
            errors.append(f"Field capital should be visible in add fields dropdown list")
        # select another collection:
        set_filters(browser, [{params.VALUE: 7129}], other_collection)
        # check second dropdown:
        fields_to_be_added = page.get_add_column_values()
        if "population" in fields_to_be_added:
            errors.append(f"Field population should not be visible in add fields dropdown list")
        set_filters(browser, fields=[{params.VALUE: 7172}])
        fields_to_be_added = page.get_add_column_values()
        if "capital" in fields_to_be_added:
            errors.append(f"Field capital should not be visible in add fields dropdown list")
        assert errors == []

    @pytest.mark.iso_search
    @doc_it()
    def test_11898_iso_date_search(self, browser):
        """
        The user checks that search by iso date type
        works fine and gets values for only set date.
        """
        errors = []
        collection_name = TESTING_HALINA
        field = {NAME: COLLECTED_DATE, params.VALUE: "2018-09-02", params.OPERATION: texts.LESS_THAN}
        page = SearchPage(browser)
        login_to_app(browser)
        set_filters(browser, [field], collection_name)
        # check found records:
        rec_params = page.get_all_column_values(field[NAME])
        for t in rec_params:
            if datetime.strptime(t, "%Y-%m-%dT%H:%M:%S.%fZ") > datetime.strptime(field[params.VALUE], "%Y-%m-%d"):
                errors.append(f"field value {t} is less than {field[params.VALUE]}")
        print(errors)

    @pytest.mark.search_between
    @doc_it()
    def test_12175_check_search_between(self, browser):
        """
        The user checks search between 2 values.
        The user checks that between gives the same result as gte value_1 AND lte value_2
        """
        errors = []
        collection_name = GLOB_TEST_WITH_EXC_FOR_APP
        doc_id = 1000
        doc_id2 = 2000
        found_in_db = count_docs_mongo(collection_name, {RECORD_ID: {"$gt": doc_id, "$lt": doc_id2}})
        page = SearchPage(browser)
        login_to_app(browser)
        filters = [{params.OPERATION: texts.GREATER_THAN, params.VALUE: doc_id},
                   {params.OPERATION: texts.LESS_THAN, params.VALUE: doc_id2}]
        set_filters(browser, filters, collection_name)
        time.sleep(1)
        # check results:
        if not page.check_number_of_found_records_in_search(found_in_db):
            errors.append(f"Expected 4 records to be in search")
        first_search_ids = page.get_cell_values(RECORD_ID)
        page.remove_filter_from_search(0)
        set_filters(browser, [{params.OPERATION: texts.BETWEEN, params.VALUE: doc_id, params.SECOND_VALUE: doc_id2}],
                    collection_name)
        time.sleep(1)
        if not page.check_number_of_found_records_in_search(found_in_db):
            errors.append(f"Expected 4 records to be in second search")
        second_search_ids = page.get_cell_values(RECORD_ID)
        if first_search_ids != second_search_ids:
            errors.append(
                f"expected ids lists to be equal, but first is {first_search_ids} and second: {second_search_ids}")
        assert errors == []

    @pytest.mark.check_add_dropdown_list
    @doc_it()
    def test_11930_check_add_dropdown(self, browser):
        """
        The user selects collection and checks the list of
        options that can be added to the search table.
        The user adds filters and checks dropdown again.
        The user selects another table and checks
        if dropdown list contains field
        from previously searched collection
        """
        errors = []
        collection_name = GLOB_TEST_WITH_EXC_FOR_APP
        other_collection = TESTING_HALINA
        doc_id = 444
        doc_id_second_col = 1
        page = SearchPage(browser)
        login_and_search_record_by_record_id(browser, collection_name, doc_id)
        # add field check
        fields_to_be_added = page.get_add_column_values()
        if "curve_id_legacy_portal_beta" not in fields_to_be_added:
            errors.append(f"no fields from current collection in add dropdown list")
        page.select_collection(other_collection)
        # check that no dropdown is visible to be added:
        page.check_add_field_btn_visibility(False)
        # check that dropdown list was changed
        page.set_field_value(doc_id_second_col)
        page.search_init()
        page.add_field_drop()
        fields_to_be_added = page.get_options_list()
        if "curve_id_legacy_portal_beta" in fields_to_be_added:
            errors.append(f"fields from previously selected collection are in the list")
        filters = [{params.VALUE: 1000, params.OPERATION: texts.GREATER_THAN},
                   {params.VALUE: 2000, params.OPERATION: texts.LESS_THAN}]
        set_filters(browser, filters, collection_name)
        fields_to_be_added = page.get_add_column_values()
        if "curve_id_legacy_portal_beta" not in fields_to_be_added:
            errors.append(f"fields from collection are not in the list")
        page.select_collection(other_collection)
        # check that no dropdown is visible to be added:
        page.check_add_field_btn_visibility(False)
        assert errors == []

    @pytest.mark.check_number_of_found_records
    @doc_it()
    def test_12151_check_number_of_found_records(self, browser):
        """
        The user sets filters and finds records
        that are set to multi-page table.
        The user checks number of records displayed on form.
        The user checks number of pages and calculates if results are equal.
        """
        errors = []
        collection_name = GLOB_TEST_WITH_EXC_FOR_APP
        doc_id = 1500
        found_records = count_docs_mongo(collection_name, {RECORD_ID: {"$gt": doc_id}})
        page = SearchPage(browser)
        login_to_app(browser)
        set_filters(browser, [{params.OPERATION: texts.GREATER_THAN, params.VALUE: doc_id}], collection_name)
        if not page.check_number_of_found_records_in_search(found_records):
            errors.append(f"expected number of found records on form to be {found_records}")
        else:
            # check number of records on the page:
            records_on_page = len(page.get_cell_values(RECORD_ID))
            last_page_number = page.get_last_page_number()
            if not page.go_to_last_page():
                errors.append(f"next link is still displayed")
            time.sleep(2)
            records_on_last_page = len(page.get_cell_values(RECORD_ID))
            if (records_on_page * (last_page_number - 1) + records_on_last_page) != found_records:
                errors.append(f"number of records in table not equal to the text above the table")
        assert errors == []

    @pytest.mark.search_init_by_enter_btn
    @doc_it()
    def test_12148_search_init_by_enter_btn(self, browser):
        """
        The user goes to the dashboard.
        The user selects collection and checks search by enter button.
        """
        errors = []
        collection_name = GLOB_TEST_WITH_EXC_FOR_APP
        doc_id = 444
        login_to_app(browser)
        set_filters(browser, [{params.VALUE: doc_id}], collection_name, False)
        page = SearchPage(browser)
        found_records_text = page.get_found_records_text()
        if not found_records_text:
            errors.append(f"expected search was done by enter btn")
        assert errors == []

    @pytest.mark.search_for_enums
    @doc_it()
    def test_12450_search_for_enums(self, browser):
        """
        The user goes to the dashboard.
        The user searches for the documents
        by organization_id
        that is enum of numerics
        """
        errors = []
        collection_name = GLOB_TEST_WITH_EXC_FOR_APP
        org_id = 37116
        docs_found = count_docs_mongo(collection_name, {f"{CURRENT_STATE}.{ORGANIZATION_ID}": org_id})
        login_to_app(browser)
        set_filters(browser, [{NAME: ORGANIZATION_ID, params.VALUE: org_id}], collection_name)
        page = SearchPage(browser)
        if not page.check_number_of_found_records_in_search(docs_found):
            errors.append(f"expected {docs_found} to be in text on form")
        assert errors == []

    @pytest.mark.clear_search_form
    @doc_it()
    def test_12497_clear_search_form(self, browser):
        """
        The user sets up filters
        The user searches for one collection.
        The user selects another collection
        and checks that filters have been cleared
        """
        errors = []
        collection_name = GLOB_TEST_WITH_EXC_FOR_APP
        other_collection = TESTING_HALINA
        org_id = 59666
        login_to_app(browser)
        set_filters(browser, [{NAME: ORGANIZATION_ID, params.VALUE: org_id}, {NAME: CURRENCY_TO, params.VALUE: "AUD"}],
                    collection_name)
        dashboard = SearchPage(browser)
        dashboard.select_collection(other_collection)
        if dashboard.get_input_field_value():
            errors.append("expected filter to be cleared")
        assert errors == []

    @pytest.mark.return_record_id_to_search
    @doc_it()
    def test_12109_return_record_id_to_search(self, browser):
        """
        The user removed column RecordId
        from search results table
        """
        errors = []
        collection_name = GLOB_TEST_WITH_EXC_FOR_APP
        doc_id = 445
        page = SearchPage(browser)
        login_and_search_record_by_record_id(browser, collection_name, doc_id)
        if not page.remove_column(RECORD_ID):
            errors.append(f"expected {RECORD_ID} to be removed")
        if not page.add_column(RECORD_ID):
            errors.append(f"expected column to be visible after being added")
        assert errors == []

    @pytest.mark.add_new_record_from_search
    @doc_it()
    def test_12329_add_new_record_from_search(self, browser):
        """
        The user goes to search,
        looks for the collection with set up add_new_record=true.
        Check that btn add new record is displayed to the user.
        Update config and remove field.
        Check that no btn is displayed
        """
        errors = []
        collection_name = GLOB_TEST_WITH_EXC_FOR_APP
        doc_id = 445
        page = SearchPage(browser)
        login_and_search_record_by_record_id(browser, collection_name, doc_id)
        if not page.add_new_record(collection_name):
            errors.append(f"expected url to contain {collection_name}")
        browser.switch_to.window(browser.window_handles[0])
        # remove config
        update_mongo(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name}, {"$unset": {"add_new_record": ''}})
        browser.refresh()
        if not page.add_new_record(displayed=False):
            errors.append("expected btn not to be present on form")
        assert errors == []

    @pytest.mark.check_brackets_search
    @doc_it()
    def test_12438_check_brackets_search(self, browser):
        """
        The user sets filters and finds records
        that contains brackets.
        """
        errors = []
        collection_name = GLOB_TEST_WITH_EXC_FOR_APP
        provider_name = "(anz)"
        found_records = count_docs_mongo(collection_name, {"CurrentState.provider_name": {"$regex": f"\(([ANZ]+)\)"}})
        page = SearchPage(browser)
        login_to_app(browser)
        set_filters(browser, [{NAME: PROVIDER_NAME, params.VALUE: provider_name}], collection_name)
        if not page.check_number_of_found_records_in_search(found_records):
            errors.append(f"expected number of found records on form to be {found_records}")
        assert errors == []

    @pytest.mark.search_clear_multiple_filters
    @doc_it()
    def test_12622_search_filters_clear(self, browser):
        """
        The user set up filters (at least 2)
        and searches in collection 1.
        The user changes collection and
        checks that no results from previous collection is displayed.
        """
        errors = []
        currency_from = "aud"
        currency_to = "usd"
        collection_name = GLOB_TEST_WITH_EXC_FOR_APP
        other_collection = TESTING_HALINA
        page = SearchPage(browser)
        login_to_app(browser)
        set_filters(browser,
                    [{NAME: CURRENCY_FROM, params.VALUE: currency_from},
                     {NAME: CURRENCY_TO, params.VALUE: currency_to}],
                    collection_name)
        page.select_collection(other_collection)
        if not page.check_number_of_found_records_in_search(0):
            errors.append("expected no records found without search init")
        assert errors == []

    @pytest.mark.check_remove_all_columns
    @doc_it()
    def test_12038_check_remove_all_columns(self, browser):
        """
        The user selects collection.
        Then removes all the columns from search
        screen. After that user selects another
        collection and checks that we display correct data
        """
        errors = []
        currency_from = "aud"
        currency_to = "usd"
        collection_name = GLOB_TEST_WITH_EXC_FOR_APP
        other_collection = TESTING_HALINA
        page = SearchPage(browser)
        login_to_app(browser)
        set_filters(browser,
                    [{NAME: CURRENCY_FROM, params.VALUE: currency_from},
                     {NAME: CURRENCY_TO, params.VALUE: currency_to}],
                    collection_name)
        theaders = page.get_table_headers()
        for th in theaders:
            page.remove_column(th)
        set_filters(browser, [{params.VALUE: 1}], other_collection)
        other_col_theaders = page.get_table_headers()
        if theaders == other_col_theaders:
            errors.append(f"expected column lists to be different")
        record_ids = page.get_cell_values(RECORD_ID)
        if len(record_ids) != 1 and int(record_ids[0]) != 1:
            errors.append(f"expected only 1 record to be in search results with recordId=1")
        assert errors == []

    @doc_it()
    @pytest.mark.dva_search
    def test_14687_dva_search(self, browser):
        """
        The user searches on the form
        the collection docs by params
        Check that url gives the same result
        :param browser:
        :return:
        """
        errors = []
        collection_name = ISSUER_CARDS
        current_config = find_docs_in_collection(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name})
        current_users = current_config[VISIBILITY][ALLOWED_USERS]
        if os.getenv('DV_USER') not in current_users:
            current_users.append(os.getenv('DV_USER'))
            update_mongo(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name},
                         {'$set': {f"{VISIBILITY}.{ALLOWED_USERS}": current_users}})

        page = SearchPage(browser)
        login_to_app(browser)
        set_filters(browser,
                    [{NAME: "T&C link where the info was found", params.VALUE: None}],
                    collection_name)
        found_records = page.get_found_records_text()
        browser.refresh()
        if page.get_found_records_text() != found_records:
            errors.append("expected found records to be the same")
        assert errors == []
