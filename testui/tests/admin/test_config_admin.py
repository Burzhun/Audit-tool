import random
import time
from datetime import datetime

import pytest
from faker import Faker

from conftest import doc_it
from dbutil.db_utils import find_docs_in_collection, update_mongo
from pages.admin.admin_page import AdminPage
from params import db_params, params
from params.db_params import DEFAULT_FIELDS_TO_DISPLAY_IN_SEARCH_RESULT_VIEW, SEARCH_FIELD_NAMES, ADD_NEW_RECORD, \
    UN_DISPLAYABLE_FIELDS
from params.params import IS_DROPDOWN
from params.texts import FIELD_VALIDATION, SUCCESSFULLY_UPDATED, SEARCH_SCREEN, SHOULD_BE_DATE_STRINGS, \
    DELETE_VALIDATOR, USER_ACCESS, FIELD_NOT_IN_SCHEMA_OVERVIEWS, EMPTY_CONSTRAINTS_NOT_ALLOWED, \
    VALUE_SHOULD_BE_GREATER_THAN, VALIDATOR_WITHOUT_TYPE, FIELD_NOT_IN_DATASET_ONLY_IN_CONFIGURATION_VALIDATORS, CHARTS, \
    AUTOMATIC_UPDATE
from utils.app_actions import login_to_app, login_and_go_to_url


def get_container_items(admin_page, is_right):
    page_dict_items = admin_page.get_cont_items(is_right, True, None)
    page_hof_items = admin_page.get_cont_items(is_right, False, None)
    page_sub_items = {}
    page_all_sub_items = []
    for dict_it in page_dict_items:
        admin_page.open_item(is_right, dict_it)
        # get all open items (sub-fields)
        sub_items = admin_page.get_cont_items(is_right, None, None, dict_it)
        page_sub_items[dict_it] = sub_items
        page_all_sub_items.extend(sub_items)
    return {params.SUB_FIELDS_ITEMS_WITH_PARENT: page_sub_items,
            params.HOF_ITEMS: page_hof_items, params.ALL_SUB_ITEMS: page_all_sub_items}


def remove_sub_fields_from_config(search_results_from_db, opt, get_fields_from_collection):
    dicts = [x for x in search_results_from_db if type(x) == dict]
    for dic in dicts:
        if dic[db_params.NAME] in search_results_from_db:
            search_results_from_db.remove(dic[db_params.NAME])
        if dic in search_results_from_db:
            search_results_from_db.remove(dic)
        search_results_from_db.extend(dic[opt])
    if type(search_results_from_db == list):
        search_results_from_db = [x for x in search_results_from_db if
                                  x[x.find(".") + 1:] not in get_fields_from_collection[
                                      params.DICT_LISTS].keys()]
    return search_results_from_db


def handle_constraints_gt_lt_set(browser, constraint_1=None, constraint_1_value=None, constraint_2=None,
                                 constraint_2_value=None, is_passed=True, to_add_1=False, to_add_2=False):
    errors = []
    admin_page = AdminPage(browser)
    admin_page.set_constraint(constraint_1, constraint_1_value, to_add=to_add_1)
    admin_page.set_constraint(constraint_2, constraint_2_value, 1, 1, to_add=to_add_2)
    admin_page.save_validator()
    alert_text = admin_page.get_alert_text()
    if is_passed and SUCCESSFULLY_UPDATED not in alert_text:
        errors.append(f"expected {SUCCESSFULLY_UPDATED} to be in alert got {alert_text}")
    elif not is_passed and VALUE_SHOULD_BE_GREATER_THAN not in alert_text:
        errors.append(f"expected {VALUE_SHOULD_BE_GREATER_THAN} to be in alert got {alert_text}")
    admin_page.confirm_alert()
    return errors


@pytest.mark.usefixtures("remove_files")
class TestAdminPanelGenData:
    @doc_it()
    @pytest.mark.parametrize("collection_name", [db_params.GLOB_TEST_WITH_EXC_FOR_APP])
    @pytest.mark.check_admin_params
    @pytest.mark.skip
    def test_config(self, browser, get_fields_from_collection, collection_name):
        """
        The user checks all tabs one by one
        and checks that displayed items in containers
        are the same as for collected fields
        from config and SchemaOverviews collections.
        Check that admin can manage items and add new fields
        in the config, remove existing or change their order.

        Check that admin can set up collection to private mode
        and give access only to some users
        """
        # todo: add to jest
        errors = []
        tabs_to_validate = ['Search Screen', 'Audit Screen']
        exclude_options = ['DefaultSearchFieldName', 'AllowCopyFunction', 'ConfidenceScores', 'DefaultSortings', 'user_functions']
        collection_name = db_params.GLOB_TEST_WITH_EXC_FOR_APP
        login_to_app(browser, admin=True)
        admin_page = AdminPage(browser)
        admin_page.select_collection(collection_name)
        time.sleep(2)
        tabs = admin_page.get_tab_names()
        for el in [FIELD_VALIDATION, USER_ACCESS]:
            tabs.remove(el)
        fields_with_par_audit = get_fields_from_collection[params.AUDITED_FIELDS]
        fields_with_par_curstate = get_fields_from_collection[params.NON_DICT_CUR_STATE_FIELDS]
        for tab in tabs:
            if tab in tabs_to_validate:
                admin_page.select_link_by_text(tab)
                # select config field if exists
                option_list = admin_page.get_config_options()
                for opt in option_list:
                    if opt not in exclude_options:
                        admin_page.select_config_field(opt)
                        # check selected:
                        doc_config = find_docs_in_collection(db_params.CONFIGURATION,
                                                             {db_params.COLLECTION_RELEVANT_FOR: collection_name})
                        # get options from text area:
                        time.sleep(5)
                        page_unselected_items = get_container_items(admin_page, False)
                        page_selected_items = get_container_items(admin_page, True)
                        # select/unselect fields
                        right = [True, False]
                        selected_all = right
                        for r in right:
                            for s in selected_all:
                                admin_page.select_unselect_all(r, s)
                                if sorted(admin_page.get_items_selected(False, r, s)) != sorted(
                                        admin_page.get_cont_items(r, False, None)):
                                    errors.append("expected all items in the container to be selected")
                        if opt == db_params.DEFAULT_FIELDS_TO_DISPLAY_IN_SEARCH_RESULT_VIEW:
                            all_fields_to_be_on_form = fields_with_par_audit + list(fields_with_par_curstate) + [
                                (db_params.RECORD_ID, db_params.RECORD_ID)]
                        elif opt in [db_params.UN_DISPLAYABLE_FIELDS, db_params.DEFAULT_AUDIT_FIELDS,
                                     db_params.UN_EDITABLE_FIELDS]:
                            all_fields_to_be_on_form = fields_with_par_curstate

                        search_results_from_db = doc_config[opt]
                        search_results_from_db = remove_sub_fields_from_config(search_results_from_db, opt,
                                                                               get_fields_from_collection)
                        fields_to_be_displayed = [(x[x.rfind(".") + 1:], x) for x in search_results_from_db]
                        # check right(selected) list

                        selected_sub_fields = []
                        for k, v in page_selected_items[params.SUB_FIELDS_ITEMS_WITH_PARENT].items():
                            selected_sub_fields.extend([x.replace(f"{k}.", "") for x in v])
                        selected_on_form = selected_sub_fields + page_selected_items[params.HOF_ITEMS]
                        if sorted(selected_on_form) != sorted(
                                [x[0] for x in fields_to_be_displayed]):
                            errors.append(f"expected list item on form to be the same as in db for {opt}")
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
                        if sorted(set(
                                [x[x.find(".") + 1:] for x in page_selected_items[params.ALL_SUB_ITEMS] + page_selected_items[
                                    params.HOF_ITEMS] + items_to_add])) != sorted(set(
                            right_items_list)) or sorted(set([x[x.find(".") + 1:] for x in
                                                              page_unselected_items[params.ALL_SUB_ITEMS] +
                                                              page_unselected_items[
                                                                  params.HOF_ITEMS]])) != sorted(set(
                            left_items_list + items_to_add)):
                            errors.append(
                                f"expected selected items to be in right list, left item should be prev state plus removed items. "
                                f"Added items {items_to_add} for {opt} in {tab}")
                        admin_page.handle_save_click(True)
                        # check in db field list was changed:
                        upd_doc_config = find_docs_in_collection(db_params.CONFIGURATION,
                                                                 {db_params.COLLECTION_RELEVANT_FOR: collection_name})
                        upd_search_results_from_db = upd_doc_config[opt]
                        upd_search_results_from_db = remove_sub_fields_from_config(upd_search_results_from_db, opt,
                                                                                   get_fields_from_collection)
                        if sorted(set([x[x.rfind(".") + 1:] for x in upd_search_results_from_db])) != sorted(set(
                                right_items_list)):
                            errors.append(f"expected lists to be the same in DB and on page for {opt}")

        assert errors == []

    @doc_it()
    @pytest.mark.parametrize("collection_name", [db_params.GLOB_TEST_WITH_EXC_FOR_APP])
    @pytest.mark.set_up_duplicate_validator
    @pytest.mark.config_update
    @pytest.mark.collection_not_to_update
    def test_set_up_duplicate_validator(self, browser, collection_name, gen_data):
        """
        The user removes validator by script.
        The user sets validator.
        The user tries to set the same validator once again
        """
        errors = []
        constraint_val = 10
        update_mongo(db_params.CONFIGURATION, {db_params.COLLECTION_RELEVANT_FOR: collection_name},
                     {"$pull": {db_params.VALIDATORS: {db_params.NAME: db_params.CURRENCY_FROM}}})
        login_to_app(browser, admin=True)
        admin_page = AdminPage(browser)
        admin_page.select_collection(collection_name)
        admin_page.select_link_by_text(FIELD_VALIDATION)
        admin_page.select_validator_by_name(db_params.CURRENCY_FROM)
        admin_page.set_validator_field(db_params.TEXT)
        admin_page.set_constraint(db_params.MAX_LENGTH, constraint_val)
        admin_page.add_constraint_click()
        constraints_list = admin_page.get_constraint_list(True, 1)
        if db_params.MAX_LENGTH in constraints_list:
            errors.append(f"expected param {db_params.MAX_LENGTH} not to be in constraint list")
        admin_page.remove_constraint(1)
        admin_page.save_validator()
        alert_text = admin_page.get_alert_text()
        if SUCCESSFULLY_UPDATED not in alert_text:
            errors.append(f"expected {SUCCESSFULLY_UPDATED} to be in alert")
        admin_page.confirm_alert()
        upd_config = find_docs_in_collection(db_params.CONFIGURATION,
                                             {db_params.COLLECTION_RELEVANT_FOR: collection_name})
        cur_from_validators = [x for x in upd_config[db_params.VALIDATORS] if
                               x[db_params.NAME] == db_params.CURRENCY_FROM]
        if cur_from_validators:
            if cur_from_validators[0][db_params.TYPE] != db_params.TEXT:
                errors.append(f"expected datatype to be {db_params.TEXT} for field {db_params.CURRENCY_FROM}")
            db_constraints = cur_from_validators[0][db_params.CONSTRAINTS]
            if len(db_constraints.keys()) != 1:
                errors.append("expected to get 1 constraint")
            if db_params.MAX_LENGTH not in db_constraints.keys():
                errors.append(f"expected {db_params.MAX_LENGTH} to be in constraints")
            if db_constraints[db_params.MAX_LENGTH] != constraint_val:
                errors.append(
                    f"expected value {constraint_val} in {db_params.MAX_LENGTH} got {db_constraints[db_params.MAX_LENGTH]}")
        else:
            errors.append(f"expected validator to be present for {db_params.CURRENCY_FROM} field")
        assert errors == []

    @doc_it()
    @pytest.mark.no_preset_validators
    @pytest.mark.skip
    def test_13187_no_preset_validators(self, browser, get_fields_from_collection):
        """
        The user goes to validators and checks that
        fields without validators are marked with grey color
        """
        errors = []
        all_fields_in_validators = get_fields_from_collection[params.ALL_SUB_ITEMS].union(
            get_fields_from_collection[params.NON_DICT_CUR_STATE_FIELDS])
        collection_name = db_params.GLOB_TEST_WITH_EXC_FOR_APP
        db_config = find_docs_in_collection(db_params.CONFIGURATION,
                                            {db_params.COLLECTION_RELEVANT_FOR: collection_name})
        global_updates = db_config[db_params.GLOBAL_AUTOMATIC_UPDATES]
        glob_upd_fields = [x[db_params.UPDATABLE_FIELDS] for x in global_updates]
        global_upd_field_flatten = [item for sublist in glob_upd_fields for item in sublist]
        to_be_in_validator_list = set(global_upd_field_flatten).union(all_fields_in_validators)
        db_config_validators = set([x[db_params.NAME] for x in db_config[db_params.VALIDATORS]])
        to_be_in_validator_list.update(db_config_validators)
        to_be_in_validator_list.remove(db_params.IMAGE_LINKS)
        login_to_app(browser, admin=True)
        admin_page = AdminPage(browser)
        admin_page.select_collection(collection_name)
        admin_page.select_link_by_text(FIELD_VALIDATION)
        missing_validators = admin_page.get_validators()
        present_validators = admin_page.get_validators(False)
        to_be_in_validator_list.remove(db_params.RECORD_ID)
        if sorted(set(to_be_in_validator_list)) != sorted(set(missing_validators + present_validators)):
            errors.append("expected list on form to be the same as in db for all validators")
        # check missing:
        db_validators = [x[db_params.NAME] for x in db_config[db_params.VALIDATORS]]
        if [x for x in missing_validators if x in db_validators]:
            errors.append("Present in db config validator is set as missing on form")
        errors += admin_page.check_color_for_missing_validator()
        assert errors == []

    @doc_it()
    @pytest.mark.skip
    @pytest.mark.automatic_updates_required_fields
    def test_global_automatic_updates_required_fields(self, browser, get_fields_from_collection):
        """
        The user goes to validators and checks that
        all fields are required fields
        """
        errors = []

        collection_name = db_params.GLOB_TEST_WITH_EXC_FOR_APP
        login_to_app(browser, admin=True)
        admin_page = AdminPage(browser)
        admin_page.select_collection(collection_name)
        admin_page.select_link_by_text(AUTOMATIC_UPDATE)
        admin_page.updates_dropdown_data("Global Updates")

        admin_page.updates_sub_dropdown_data("Global Update 1")
        admin_page.add_new_updates()
        admin_page.save_validator()
        alert_text = admin_page.get_alert_text()
        if "'Name' Field must be populated" not in alert_text:
            errors.append(f"expected 'Name' Field must be populated to be in alert got {alert_text}")
        admin_page.confirm_alert()

        assert errors == []

    @doc_it()
    @pytest.mark.no_preset_validators
    def test_create_new_global_updates(self, browser, get_fields_from_collection):
        """
        """
        errors = []

        collection_name = db_params.GLOB_TEST_WITH_EXC_FOR_APP
        login_to_app(browser, admin=True)
        admin_page = AdminPage(browser)
        admin_page.select_collection(collection_name)
        admin_page.select_link_by_text(AUTOMATIC_UPDATE)
        admin_page.updates_dropdown_data("Global Updates")

        #admin_page.updates_sub_dropdown_data("Global Update 1")
        admin_page.add_new_updates()
        admin_page.save_validator()
        alert_text = admin_page.get_alert_text()

        if "'Name' Field must be populated" not in alert_text:
            errors.append(f"expected 'Name' Field must be populated to be in alert got {alert_text}")
        admin_page.confirm_alert()

        admin_page.set_name_field_value(field_text="DL-GU1")
        admin_page.set_description_field_value(field_text="Test DL-Description1")
        admin_page.set_piplene_field_value(field_text="['text':'12test']")
        admin_page.set_update_function_field_value(field_text="x=1")

        admin_page.matching_fields_dropdown_click()
        admin_page.select_option_in_react_dropdown("ConfidenceScore")

        admin_page.updatable_fields_dropdown_click()
        admin_page.select_option_in_react_dropdown("ConfidenceScore")

        admin_page.save_validator()
        alert_text = admin_page.get_alert_text()
        if "Successfully updated" not in alert_text:
            errors.append(f"expected text 'Successfully updated', got in alert: {alert_text}")
        admin_page.confirm_alert()

        admin_page.delete_validator()
        alert_text = admin_page.get_alert_text()
        if "Are you sure you want do delete this global update?" not in alert_text:
            errors.append(f"expected text 'Are you sure you want do delete this global update?', got in alert: {alert_text}")
        admin_page.confirm_alert()

        alert_text = admin_page.get_alert_text()
        if "Successfully updated" not in alert_text:
            errors.append(f"expected text 'Successfully updated', got in alert: {alert_text}")
        admin_page.confirm_alert()

        assert errors == []

    @doc_it()
    @pytest.mark.remove_btn_check
    def test_13191_remove_btn_check(self, browser):
        """
        The user selects validator that
        has no constraints.
        Check that there is no remove btn on the form
        """
        errors = []
        collection_name = db_params.GLOB_TEST_WITH_EXC_FOR_APP
        db_config = find_docs_in_collection(db_params.CONFIGURATION,
                                            {db_params.COLLECTION_RELEVANT_FOR: collection_name})
        db_constraints = db_config[db_params.VALIDATORS]
        validator = db_constraints[0][db_params.NAME]
        login_to_app(browser, admin=True)
        admin_page = AdminPage(browser)
        admin_page.select_collection(collection_name)
        admin_page.select_link_by_text(FIELD_VALIDATION)
        for i in [False, True]:
            admin_page.select_validator_by_name(validator)
            admin_page.remove_validator()
            alert_text = admin_page.get_alert_text()
            if DELETE_VALIDATOR not in alert_text:
                errors.append(f"expected {DELETE_VALIDATOR} to be in alert, got {alert_text}")
            if i:
                admin_page.confirm_alert()
            else:
                admin_page.dismiss_alert()
            # check that no changes done in db:
            upd_db_config = find_docs_in_collection(db_params.CONFIGURATION,
                                                    {db_params.COLLECTION_RELEVANT_FOR: collection_name})
            upd_validator = [x for x in upd_db_config[db_params.VALIDATORS] if x[db_params.NAME] == validator]
            if (i and upd_validator) or (i is False and not upd_validator):
                errors.append(f"expected validator present to be {not i} for alert_confirm={i}")


        assert errors == []

    @doc_it()
    @pytest.mark.search_non_match_items
    def test_13225_search_non_match_items(self, browser):
        """
        The user searches for the validator
        and checks that no no-existing no matching
        items are in the container
        """
        errors = []
        collection_name = db_params.GLOB_TEST_WITH_EXC_FOR_APP
        search_str = "curren"
        login_to_app(browser, admin=True)
        admin_page = AdminPage(browser)
        admin_page.select_collection(collection_name)
        admin_page.select_link_by_text(FIELD_VALIDATION)
        admin_page.search_value_in_container(search_str, is_validator=True)
        found_items = admin_page.get_validators(None)
        if [x for x in found_items if search_str not in x]:
            errors.append("expected no items that do not match search str found")
        assert errors == []

    @doc_it()
    @pytest.mark.check_visibility_option
    def test_check_visibility_option(self, browser):
        """
        The user checks that
        collection visibility is the same as set up in db.
        Check that user list contains users that are without new
        role.
        """
        errors = []
        collection_name = db_params.GLOB_TEST_WITH_EXC_FOR_APP
        login_to_app(browser, admin=True)
        admin_page = AdminPage(browser)
        admin_page.select_collection(collection_name)
        admin_page.select_link_by_text(USER_ACCESS)
        admin_page.select_config_field(db_params.VISIBILITY)
        admin_page.get_cont_items(False, False, None)
        right_container = admin_page.get_cont_items(True, False, None)
        left_container = admin_page.get_cont_items(False, False, None)
        if not admin_page.check_checkbox(False):
            errors.append("expected collection to be set a public")
        else:
            all_users = find_docs_in_collection(db_params.USERS, {}, False)
            user_emails = [x[db_params.REGISTERED_USER_EMAIL] for x in all_users]
            if sorted(set(user_emails)) != sorted(right_container + left_container):
                errors.append("expected all users to be in both containers")

            for i in [False, True]:
                if not admin_page.check_grid_is_disabled():
                    errors.append("expected grid to be disabled")
                if not admin_page.set_checkbox(True):
                    errors.append("expected checkbox to be set")
                if admin_page.check_grid_is_disabled():
                    errors.append("expected grid to be enabled")
                items_to_add = []
                for n in range(3):
                    item = random.choice(left_container)
                    admin_page.select_container_item(False, item)
                    items_to_add.append(item)
                # right btn should be enabled now and user clicks on it
                if not admin_page.handle_arrow_btn():
                    errors.append("expected right button to be enabled")
                # check left_list
                left_upd_list = admin_page.get_cont_items(False, False, None)
                right_upd_list = admin_page.get_cont_items(True, False, None)
                if sorted(left_upd_list + items_to_add) != sorted(left_container) or sorted(
                        left_container) != sorted(right_upd_list + left_upd_list):
                    errors.append(
                        "expected selected items to be in right list, left item should be prev state plus removed items")
                if not i:
                    admin_page.abort_changes()
                    # check that all changes were rollback
                    left_after_abort = admin_page.get_cont_items(False, False, None)
                    right_after_abort = admin_page.get_cont_items(True, False, None)
                    if sorted(left_after_abort) != sorted(left_container) and sorted(right_after_abort) != sorted(
                            right_container):
                        errors.append("expected all changes to be reverted")
                else:
                    admin_page.handle_save_click()
                    changed_visibility = \
                        find_docs_in_collection(db_params.CONFIGURATION,
                                                {db_params.COLLECTION_RELEVANT_FOR: collection_name})[
                            db_params.VISIBILITY]
                    if changed_visibility[db_params.PUBLIC]:
                        errors.append("expected visibility to become private")
                    if db_params.ALLOWED_USERS not in changed_visibility:
                        errors.append(f"expected field {db_params.ALLOWED_USERS} to appear in doc")
                    elif db_params.ALLOWED_USERS in changed_visibility and sorted(
                            changed_visibility[db_params.ALLOWED_USERS]) != sorted(items_to_add):
                        errors.append("expected user list to be the same as set by user")
            # return back to public:
            if admin_page.set_checkbox(False):
                errors.append("expected checkbox to be unset")
            admin_page.handle_save_click()
            upd_rollback_visibility = \
                find_docs_in_collection(db_params.CONFIGURATION, {db_params.COLLECTION_RELEVANT_FOR: collection_name})[
                    db_params.VISIBILITY]
            if not upd_rollback_visibility[db_params.PUBLIC]:
                errors.append("expected visibility to become public")
            assert errors == []

    @doc_it()
    @pytest.mark.check_missing_highlight
    @pytest.mark.config_update
    @pytest.mark.collection_not_to_update
    @pytest.mark.parametrize("collection_name", [db_params.GLOB_TEST_WITH_EXC_FOR_APP])
    def test_13186_check_missing_highlight(self, browser, get_fields_from_collection, collection_name, gen_data):
        """
        The user checks
        that fields that are missing in the document
        but present in config are highlight with red.
        The user moves field to the left and checks that
        color has been changed.
        The user moves field to the right (back)
        and checks that color was removed
        """
        errors = []
        additional_field = "tester_field"
        update_mongo(db_params.CONFIGURATION, {db_params.COLLECTION_RELEVANT_FOR: collection_name},
                     {"$set": {db_params.DEFAULT_FIELDS_TO_DISPLAY_IN_SEARCH_RESULT_VIEW: [additional_field, "RecordId",
                                                                                           "CurrentState.organization_id",
                                                                                           "CurrentState.provider_name",
                                                                                           "CurrentState.country_iso2",
                                                                                           "CurrentState.currency_from",
                                                                                           "CurrentState.currency_to",
                                                                                           "CurrentState.datetime_record_submitted_utc",
                                                                                           "CurrentState.name_of_researcher",
                                                                                           "CurrentState.client_type",
                                                                                           "CurrentState.imti_monthly_curve_legacy_portal_beta",
                                                                                           "CurrentState.any_qa_issues",
                                                                                           "CurrentState.any_amount_outside_of_min_max_fx_margin",
                                                                                           "CurrentState.any_amount_with_negative_fx_margin",
                                                                                           "CurrentState.any_amount_duplicated",
                                                                                           "CurrentState.rate_does_not_consistently_improve",
                                                                                           "CurrentState.any_amount_with_fx_margin_reldiff_gt15pct_mom",
                                                                                           "AuditState.ConfidenceScore"]}})
        login_to_app(browser, admin=True)
        admin_page = AdminPage(browser)
        admin_page.select_collection(collection_name)
        admin_page.select_link_by_text(SEARCH_SCREEN)
        admin_page.select_config_field(db_params.DEFAULT_FIELDS_TO_DISPLAY_IN_SEARCH_RESULT_VIEW)
        display_in_search = \
            find_docs_in_collection(db_params.CONFIGURATION, {db_params.COLLECTION_RELEVANT_FOR: collection_name})[
                db_params.DEFAULT_FIELDS_TO_DISPLAY_IN_SEARCH_RESULT_VIEW]
        without_prefix_display = [x[x.find(".") + 1:] for x in display_in_search]
        missing_fields = [x for x in without_prefix_display if
                          x not in (get_fields_from_collection[params.NON_DICT_CUR_STATE_FIELDS] +
                                    get_fields_from_collection[params.AUDITED_FIELDS])]
        for m in missing_fields:
            els_attr = admin_page.check_field_or_validator_color_and_hint(True, m, True)
            if els_attr[params.TOOLTIP] != FIELD_NOT_IN_SCHEMA_OVERVIEWS:
                errors.append(
                    f"expected {FIELD_NOT_IN_SCHEMA_OVERVIEWS} to be in tooltip, got {els_attr[params.TOOLTIP]}")
            if els_attr[params.COLOR] != "rgba(255, 0, 0, 1)":
                errors.append("expected red color for element")
        present_fields = [x for x in without_prefix_display if x not in missing_fields]
        if present_fields:
            present_attr = admin_page.check_field_or_validator_color_and_hint(True, present_fields[0], False)
            if present_attr[params.TOOLTIP] == FIELD_NOT_IN_SCHEMA_OVERVIEWS:
                errors.append(f"expected no tooltip to be for {present_fields[0]} got {FIELD_NOT_IN_SCHEMA_OVERVIEWS}")
            if present_attr[params.COLOR] == "rgba(255, 0, 0, 1)":
                errors.append("expected black color for element")
        admin_page.select_container_item(True, additional_field)
        admin_page.handle_arrow_btn(False, True)
        styles = admin_page.check_field_or_validator_color_and_hint(False, additional_field, True)
        if styles[params.COLOR] != params.RED_COLOR and styles[params.BG_COLOR] != params.GREEN_COLOR and not styles[
            params.TOOLTIP]:
            errors.append("expected field to be red color and green background")
        admin_page.select_container_item(False, additional_field)
        admin_page.handle_arrow_btn(True, True)
        styles = admin_page.check_field_or_validator_color_and_hint(True, additional_field, True)
        if styles[params.COLOR] != params.RED_COLOR and styles[params.BG_COLOR] == params.GREEN_COLOR and not styles[
            params.TOOLTIP]:
            errors.append("expected field to be red color and green background")

        assert errors == []


@pytest.mark.usefixtures("remove_files")
class TestAdminPanelWithoutGenData:
    @doc_it()
    @pytest.mark.check_validators
    def test_check_validators(self, browser):
        """
        The user gets field validators and try to set up them
        """
        errors = []
        collection_name = db_params.GLOB_TEST_WITH_EXC_FOR_APP
        login_to_app(browser, admin=True)
        admin_page = AdminPage(browser)
        admin_page.select_collection(collection_name)
        admin_page.select_link_by_text(FIELD_VALIDATION)
        # get all field validators
        col_conf = find_docs_in_collection(db_params.CONFIGURATION,
                                           {db_params.COLLECTION_RELEVANT_FOR: collection_name})
        db_validators = col_conf[db_params.VALIDATORS]
        updatable_fields_global = [x[db_params.UPDATABLE_FIELDS] for x in col_conf[db_params.GLOBAL_AUTOMATIC_UPDATES]]
        updatable_fields_set = set([item for sublist in updatable_fields_global for item in sublist])
        updatable_fields_set.update(set([x[db_params.NAME] for x in col_conf[db_params.VALIDATORS]]))
        # get form validators
        for dt in [db_params.ENUM, db_params.TEXT, db_params.DATE_TYPE, db_params.BOOL]:
            els_with_dt = [x for x in db_validators if db_params.TYPE in x and x[db_params.TYPE] == dt]
            if els_with_dt:
                validator = els_with_dt[0]
                admin_page.select_validator_by_name(validator[db_params.NAME])
                # check datatype and constraints
                dt_on_form = admin_page.get_field_data_type()
                if dt_on_form != dt:
                    errors.append(f"expected dt to be {dt}, got {dt_on_form}")
                # check constraints
                if db_params.CONSTRAINTS in validator:
                    val_constraints = validator[db_params.CONSTRAINTS]
                else:
                    val_constraints = None
                if val_constraints:
                    # get all constraints on form:
                    all_constraint_names_form = admin_page.get_constraint(True, None)
                    all_constraint_values_form = admin_page.get_constraint(False, None,
                                                                           numbers=len(all_constraint_names_form))
                    form_validators = {}
                    for i in range(len(all_constraint_names_form)):
                        if "," in all_constraint_values_form[i]:
                            vals = all_constraint_values_form[i].split(",")
                        else:
                            vals = all_constraint_values_form[i]
                        if vals == "false":
                            vals = False
                        elif vals == "true":
                            vals = True
                        form_validators[all_constraint_names_form[i]] = vals
                    if form_validators != val_constraints:
                        errors.append("expected validators on form and in db to be the same")
                else:
                    # no validators to be on form:
                    if admin_page.get_constraint(True, 0):
                        errors.append("expected no validators found")
        assert errors == []

    @doc_it()
    @pytest.mark.config_without_collection
    def test_12987_config_without_collection(self, browser):
        """
        The user tries to select config without collection select
        """
        errors = []
        collection_name = db_params.GLOB_TEST_WITH_EXC_FOR_APP
        login_to_app(browser, admin=True)
        admin_page = AdminPage(browser)
        tabs = admin_page.get_tab_names()
        if tabs:
            errors.append("expected no tabs to be displayed until collection is selected")
        admin_page.select_collection(collection_name)
        tabs_after_collection_select = admin_page.get_tab_names()
        if not tabs_after_collection_select:
            errors.append("expected no tabs to be displayed until collection is selected")
        assert errors == []

    @doc_it()
    @pytest.mark.check_revision
    def test_12683_add_revision_number(self, browser):
        """
        User checks if revision number is present on form
        """
        login_to_app(browser, admin=True)
        admin_page = AdminPage(browser)
        revision = admin_page.get_revision()
        assert revision is not False

    @doc_it()
    @pytest.mark.check_validators_dt_constraints
    def test_check_validators_dt_constraints(self, browser):
        """
        Admin checks that only preset constraint
        can be applies to validator type
        """
        collection_name = db_params.GLOB_TEST_WITH_EXC_FOR_APP
        validators = {
            db_params.NUMERIC: {db_params.NULLABLE: {IS_DROPDOWN: True, db_params.VALUES: ["true", "false"]},
                                db_params.GT: {IS_DROPDOWN: False, db_params.VALUES: []},
                                db_params.GTE: {IS_DROPDOWN: False, db_params.VALUES: []},
                                db_params.LT: {IS_DROPDOWN: False, db_params.VALUES: []},
                                db_params.LTE: {IS_DROPDOWN: False, db_params.VALUES: []},
                                db_params.POSITIVE: {IS_DROPDOWN: True, db_params.VALUES: ["true", "false"]}},
            db_params.TEXT: {db_params.MIN_LENGTH: {IS_DROPDOWN: False, db_params.VALUES: []},
                             db_params.MAX_LENGTH: {IS_DROPDOWN: False, db_params.VALUES: []},
                             db_params.PATTERN: {IS_DROPDOWN: False, db_params.VALUES: []}},
            db_params.BOOL: {db_params.NULLABLE: {IS_DROPDOWN: True, db_params.VALUES: ["true", "false"]}},
            db_params.ENUM: {db_params.MULTIPLE: {IS_DROPDOWN: True, db_params.VALUES: ["true", "false"]},
                             db_params.VALUES: {IS_DROPDOWN: False, db_params.VALUES: []},
                             db_params.NULLABLE: {IS_DROPDOWN: True, db_params.VALUES: ["true", "false"]}},
            db_params.ENUM_ARRAY: {db_params.MULTIPLE: {IS_DROPDOWN: True, db_params.VALUES: ["true", "false"]},
                                 db_params.VALUES: {IS_DROPDOWN: False, db_params.VALUES: []},
                                 db_params.NULLABLE: {IS_DROPDOWN: True, db_params.VALUES: ["true", "false"]}},
            db_params.ISO_DATE: {db_params.GT: {IS_DROPDOWN: False, db_params.VALUES: []},
                                 db_params.GTE: {IS_DROPDOWN: False, db_params.VALUES: []},
                                 db_params.LT: {IS_DROPDOWN: False, db_params.VALUES: []},
                                 db_params.LTE: {IS_DROPDOWN: False, db_params.VALUES: []},
                                 db_params.LT_NOW: {IS_DROPDOWN: False, db_params.VALUES: ["true", "false"]},
                                 db_params.NULLABLE: {IS_DROPDOWN: True, db_params.VALUES: ["true", "false"]}},
            db_params.URL_TYPE: {}
        }
        new_validator = {
            db_params.NAME: db_params.CURRENCY_FROM,
            db_params.TYPE: db_params.NUMERIC,
            db_params.CONSTRAINTS: {
            }
        }
        update_mongo(db_params.CONFIGURATION, {db_params.COLLECTION_RELEVANT_FOR: collection_name},
                     {"$pull": {db_params.VALIDATORS: {db_params.NAME: new_validator[db_params.NAME]}}})
        update_mongo(db_params.CONFIGURATION, {db_params.COLLECTION_RELEVANT_FOR: collection_name},
                     {"$push": {db_params.VALIDATORS: new_validator}})
        errors = []
        login_to_app(browser, admin=True)
        admin_page = AdminPage(browser)
        admin_page.select_collection(collection_name)
        admin_page.select_link_by_text(FIELD_VALIDATION)
        admin_page.select_validator_by_name(db_params.CURRENCY_FROM)
        for k in validators.keys():
            admin_page.set_validator_field(k)
            admin_page.add_constraint_click()
            form_constraints_list = admin_page.get_constraint_list(True)
            if sorted(form_constraints_list) != sorted(list(validators[k].keys())):
                errors.append(f"expected constraint list to be as preset for type {k}")
            for val_key in validators[k].keys():
                if val_key in form_constraints_list:
                    admin_page.set_constraint(val_key, is_dropdown=validators[k][val_key][IS_DROPDOWN], to_add=False)
                    values_form_list = admin_page.get_constraint_list(False)
                    if sorted(validators[k][val_key][db_params.VALUES]) != sorted(values_form_list):
                        errors.append(f"expected constraint values to be as set per type: {k}")
            admin_page.remove_constraint(0)
        assert errors == []

    @doc_it()
    @pytest.mark.parametrize("params_fields", [DEFAULT_FIELDS_TO_DISPLAY_IN_SEARCH_RESULT_VIEW, SEARCH_FIELD_NAMES, ADD_NEW_RECORD, UN_DISPLAYABLE_FIELDS])
    @pytest.mark.open_dropdown_list_when_search
    def test_13061_open_dropdown_list_when_search(self, browser, params_fields):
        """
        The user searches value in sub list
        and checks that we open dropdown list in admin panel
        """
        errors = []
        exclude_dropdown_options = ['SearchFieldNames']
        text = "fx_margin"
        option = params_fields
        collection_name = db_params.GLOB_TEST_WITH_EXC_FOR_APP
        login_to_app(browser, admin=True)
        admin_page = AdminPage(browser)
        admin_page.select_collection(collection_name)
        admin_page.select_link_by_text(SEARCH_SCREEN)
        if option not in exclude_dropdown_options:
            admin_page.select_config_field(option)
            time.sleep(1)
            admin_page.search_value_in_container(text, False)
            is_open = admin_page.open_item(False, db_params.AMOUNTS_AND_RATES, True)
            if not is_open:
                errors.append("expected list to be open")
            admin_page.select_container_item(False, db_params.AMOUNTS_AND_RATES)
            is_open_upd = admin_page.open_item(False, db_params.AMOUNTS_AND_RATES, True)
            if is_open_upd:
                errors.append("expected list to be open")
        assert errors == []

    @doc_it()
    @pytest.mark.parametrize("field", [{db_params.VALID: True, db_params.TYPE: db_params.ISO_DATE, params.FORMAT: "Z"},
                                       {db_params.VALID: True, db_params.TYPE: db_params.ISO_DATE,
                                        params.FORMAT: "seconds_Z"},
                                       {db_params.VALID: True, db_params.TYPE: db_params.ISO_DATE,
                                        params.FORMAT: "seconds_not_Z"},
                                       {db_params.VALID: True, db_params.TYPE: db_params.ISO_DATE,
                                        params.FORMAT: "not_Z"},
                                       {db_params.VALID: False, db_params.TYPE: db_params.ISO_DATE}])
    @pytest.mark.iso_date_add_field
    def test_13063_iso_date_add_field(self, browser, field):
        """
        The user sets upo validator as isodate.
        Check that there is check on form.
        Check that date is correctly set in DB
        """
        errors = []
        if field[db_params.VALID]:
            constraint_val_dt = datetime.now()
            if field[params.FORMAT] == "Z":
                constraint_val = constraint_val_dt.isoformat() + "Z"
            elif field[params.FORMAT] == "seconds_Z":
                constraint_val = constraint_val_dt.isoformat("T", "seconds") + "Z"
            elif field[params.FORMAT] == "not_Z":
                constraint_val = constraint_val_dt.isoformat()
            elif field[params.FORMAT] == "seconds_not_Z":
                constraint_val = constraint_val_dt.isoformat("T", "seconds")
        else:
            constraint_val = Faker().name()
        field_to_change = db_params.CURRENCY_FROM
        collection_name = db_params.GLOB_TEST_WITH_EXC_FOR_APP
        update_mongo(db_params.CONFIGURATION, {db_params.COLLECTION_RELEVANT_FOR: collection_name},
                     {"$pull": {db_params.VALIDATORS: {db_params.NAME: field_to_change}}})
        login_to_app(browser, admin=True)
        admin_page = AdminPage(browser)
        admin_page.select_collection(collection_name)
        admin_page.select_link_by_text(FIELD_VALIDATION)
        admin_page.select_validator_by_name(field_to_change)
        admin_page.set_validator_field(db_params.ISO_DATE)
        admin_page.set_constraint(db_params.GTE, constraint_val)
        admin_page.save_validator()
        alert_text = admin_page.get_alert_text()
        if field[db_params.VALID] and SUCCESSFULLY_UPDATED not in alert_text or not field[
            db_params.VALID] and SHOULD_BE_DATE_STRINGS not in alert_text:
            errors.append(f"expected other alert_text to be for valid={field[db_params.VALID]}")
        upd_conf = find_docs_in_collection(db_params.CONFIGURATION,
                                           {db_params.COLLECTION_RELEVANT_FOR: collection_name})
        if field[db_params.VALID]:
            field_validators = [x for x in upd_conf[db_params.VALIDATORS] if x[db_params.NAME] == field_to_change]
            if field_validators:
                db_constraint_value = field_validators[0][db_params.CONSTRAINTS][db_params.GTE]
                if db_constraint_value.strftime("%Y-%m-%d %H:%M:%S") != constraint_val_dt.strftime("%Y-%m-%d %H:%M:%S"):
                    errors.append(f"expected value in db to be: {constraint_val_dt} got {db_constraint_value}")
        assert errors == []

    @doc_it()
    @pytest.mark.skip(reason="no more dependent fields in UI. Test should be re-created for the Apdated By field")
    @pytest.mark.dependent_fields
    def test_13188_dependent_fields(self, browser):
        """
        The user checks that
        dependent fields are displayed on form
        when setting validators
        """
        errors = []
        collection_name = db_params.GLOB_TEST_WITH_EXC_FOR_APP
        upd_logics = \
            find_docs_in_collection(db_params.CONFIGURATION, {db_params.COLLECTION_RELEVANT_FOR: collection_name})[
                db_params.UPDATE_LOGICS]

        login_to_app(browser, admin=True)
        admin_page = AdminPage(browser)
        admin_page.select_collection(collection_name)
        admin_page.select_link_by_text(FIELD_VALIDATION)
        if upd_logics:
            updated_field = upd_logics[0][db_params.UPDATED_FIELD]
            parent_fields_db = upd_logics[0][db_params.DEPENDENCY_FIELDS]
            val_by_name = admin_page.select_validator_by_name(updated_field)
            print(val_by_name)
            parent_fields_form = admin_page.get_updated_by_fields_list()
            if parent_fields_form and sorted(parent_fields_form.split(", ")) != sorted(parent_fields_db):
                errors.append("expected updatable fields to be the same in db and on form")
            elif not parent_fields_form:
                errors.append("expected updatable fields to be on form")
        assert errors == []

    @doc_it()
    @pytest.mark.check_invalid_validators
    def test_12951_check_invalid_validators(self, browser):
        """
        The user checks that there is no possibility to set up
        invalid validator.
        Check that no possibility to set gte>lte and gt>=lt
        """
        errors = []
        collection_name = db_params.GLOB_TEST_WITH_EXC_FOR_APP
        validators = \
            find_docs_in_collection(db_params.CONFIGURATION, {db_params.COLLECTION_RELEVANT_FOR: collection_name})[
                db_params.VALIDATORS]
        # remove validators without type:
        validators = [x for x in validators if db_params.TYPE in x]
        validator = [x for x in validators if x[db_params.TYPE] != db_params.NUMERIC][0]
        login_to_app(browser, admin=True)
        admin_page = AdminPage(browser)
        admin_page.select_collection(collection_name)
        admin_page.select_link_by_text(FIELD_VALIDATION)
        admin_page.select_validator_by_name(validator[db_params.NAME])
        admin_page.set_validator_field(db_params.NUMERIC)
        admin_page.set_constraint(db_params.GT)
        admin_page.save_validator()
        alert_text = admin_page.get_alert_text()
        if EMPTY_CONSTRAINTS_NOT_ALLOWED not in alert_text:
            errors.append(f"expected {EMPTY_CONSTRAINTS_NOT_ALLOWED} to be in alert got {alert_text}")
        admin_page.confirm_alert()
        errors += handle_constraints_gt_lt_set(browser, None, 10, db_params.LT, 10, False, False, True)
        errors += handle_constraints_gt_lt_set(browser, None, None, None, 10.01, True)
        errors += handle_constraints_gt_lt_set(browser, db_params.GTE, None, None, 10, False)
        errors += handle_constraints_gt_lt_set(browser, None, None, None, 10.01, True)
        errors += handle_constraints_gt_lt_set(browser, db_params.GT, None, db_params.LTE, 10, False)
        errors += handle_constraints_gt_lt_set(browser, None, None, None, 10.01, True)
        errors += handle_constraints_gt_lt_set(browser, None, None, None, 9.999999, False)
        errors += handle_constraints_gt_lt_set(browser, db_params.GTE, None, db_params.LTE, 10, False)
        errors += handle_constraints_gt_lt_set(browser, db_params.GTE, None, db_params.LTE, 10.99, True)
        upd_config = find_docs_in_collection(db_params.CONFIGURATION,
                                             {db_params.COLLECTION_RELEVANT_FOR: collection_name})
        upd_validator = [x for x in upd_config[db_params.VALIDATORS] if x[db_params.NAME] == validator[db_params.NAME]]
        if upd_validator:
            if upd_validator[0][db_params.CONSTRAINTS][db_params.GTE] != 10 and upd_validator[0][db_params.CONSTRAINTS][
                db_params.LTE]:
                errors.append("expected gte and lte values to be 10 in db")
        else:
            errors.append("expected validator to be present in db")
        assert errors == []

    @pytest.mark.check_invalid_validators
    def test_13375_do_not_display_validator_as_missing_when_its_present_in_db(self, browser, get_fields_from_collection):
        """
        The user goes to validators and checks that
        fields without validators are marked with grey color
        """
        errors = []
        all_fields_in_validators = get_fields_from_collection[params.ALL_SUB_ITEMS].union(
            get_fields_from_collection[params.NON_DICT_CUR_STATE_FIELDS])
        collection_name = db_params.GLOB_TEST_WITH_EXC_FOR_APP
        db_config = find_docs_in_collection(db_params.CONFIGURATION,
                                            {db_params.COLLECTION_RELEVANT_FOR: collection_name})
        global_updates = db_config[db_params.GLOBAL_AUTOMATIC_UPDATES]
        glob_upd_fields = [x[db_params.UPDATABLE_FIELDS] for x in global_updates]
        global_upd_field_flatten = [item for sublist in glob_upd_fields for item in sublist]
        to_be_in_validator_list = set(global_upd_field_flatten).union(all_fields_in_validators)
        db_config_validators = set([x[db_params.NAME] for x in db_config[db_params.VALIDATORS]])
        to_be_in_validator_list.update(db_config_validators)
        to_be_in_validator_list.remove(db_params.IMAGE_LINKS)
        login_to_app(browser, admin=True)
        admin_page = AdminPage(browser)
        admin_page.select_collection(collection_name)
        admin_page.select_link_by_text(FIELD_VALIDATION)
        missing_validators = admin_page.get_validators()
        present_validators = admin_page.get_validators(False)
        to_be_in_validator_list.remove(db_params.RECORD_ID)
        if sorted(set(to_be_in_validator_list)) != sorted(set(missing_validators + present_validators)):
            errors.append("expected list on form to be the same as in db for all validators")
        # check missing:
        db_validators = [x[db_params.NAME] for x in db_config[db_params.VALIDATORS]]
        if [x for x in missing_validators if x in db_validators]:
            errors.append("Present in db config validator is set as missing on form")
        errors += admin_page.check_color_for_no_type_validator()
        assert errors == []

    @doc_it()
    @pytest.mark.parametrize("constraint", [db_params.GTE, db_params.GT, db_params.LTE, db_params.LT])
    @pytest.mark.constraints_are_not_transformed
    def test_13243_constraints_are_not_transformed(self, browser, constraint):
        """
        The user goes to admin panel.
        Selects validator and tries to set up
        constraint for numeric field.
        Check that floats are not transformed into ints
        """
        errors = []
        constraint_val = 9.9999
        collection_name = db_params.GLOB_TEST_WITH_EXC_FOR_APP
        update_mongo(db_params.CONFIGURATION, {db_params.COLLECTION_RELEVANT_FOR: collection_name},
                     {"$pull": {db_params.VALIDATORS: {db_params.NAME: db_params.CURRENCY_FROM}}})
        login_to_app(browser, admin=True)
        admin_page = AdminPage(browser)
        admin_page.select_collection(collection_name)
        admin_page.select_link_by_text(FIELD_VALIDATION)
        admin_page.select_validator_by_name(db_params.CURRENCY_FROM)
        admin_page.set_validator_field(db_params.NUMERIC)
        admin_page.set_constraint(constraint, constraint_val)
        admin_page.save_validator()
        admin_page.confirm_alert()
        upd_config = find_docs_in_collection(db_params.CONFIGURATION,
                                             {db_params.COLLECTION_RELEVANT_FOR: collection_name})
        const_in_db = [x for x in upd_config[db_params.VALIDATORS] if x[db_params.NAME] == db_params.CURRENCY_FROM]
        try:
            if const_in_db[0][db_params.CONSTRAINTS][constraint] != constraint_val:
                errors.append(
                    f"expected val {constraint_val} to be in db, got {const_in_db[0][db_params.CONSTRAINTS][constraint]}")
        except (KeyError, TypeError):
            errors.append(f"Key ot type error for check")
        except IndexError:
            errors.append(f"expected validator for {db_params.CURRENCY_FROM} to be present in db")
        assert errors == []

    @doc_it()
    @pytest.mark.non_existing_validators_in_docs
    def test_13289_non_existing_validators_in_docs(self, browser):
        """
        Check that validators that are in db but not in the doc are
        marked with red color.
        The pre-set validator is missing type.
        Check that background for the constraint is yellow
        :return:
        """
        errors = []
        new_validator_missing_in_doc = {
            db_params.NAME: Faker().word(),
            db_params.TYPE: db_params.NUMERIC,
            db_params.CONSTRAINTS: {}
        }
        new_validator_missing_type = {
            db_params.NAME: db_params.CURRENCY_FROM,
        }
        collection_name = db_params.GLOB_TEST_WITH_EXC_FOR_APP
        for validator in [new_validator_missing_type, new_validator_missing_in_doc]:
            update_mongo(db_params.CONFIGURATION, {db_params.COLLECTION_RELEVANT_FOR: collection_name},
                         {"$push": {db_params.VALIDATORS: validator}})

        login_to_app(browser, admin=True)
        admin_page = AdminPage(browser)
        admin_page.select_collection(collection_name)
        admin_page.select_link_by_text(FIELD_VALIDATION)
        if admin_page.check_field_or_validator_color_and_hint(
                field_name=new_validator_missing_in_doc[db_params.NAME],
                is_validator=True)[params.COLOR] != params.RED_COLOR:
            errors.append("expected non-found doc validator to be red colored")
        els_attr = admin_page.check_field_or_validator_color_and_hint(field_name=new_validator_missing_in_doc[db_params.NAME],
                is_validator=True)
        if els_attr[params.TOOLTIP] != FIELD_NOT_IN_DATASET_ONLY_IN_CONFIGURATION_VALIDATORS:
            errors.append(
                f"expected {FIELD_NOT_IN_DATASET_ONLY_IN_CONFIGURATION_VALIDATORS} to be in tooltip, got {els_attr[params.TOOLTIP]}")
        hint_and_color_missing_type_validator = admin_page.check_field_or_validator_color_and_hint(
            field_name=new_validator_missing_type[db_params.NAME],
            is_validator=True)
        if hint_and_color_missing_type_validator[params.COLOR] != params.SAND_SOLOR:
            errors.append("expected missing type validator to be sand colored")
        if hint_and_color_missing_type_validator[params.TOOLTIP] != VALIDATOR_WITHOUT_TYPE:
            errors.append(f"expected tooltip to be {VALIDATOR_WITHOUT_TYPE}")
        for validator in [new_validator_missing_type, new_validator_missing_in_doc]:
            update_mongo(db_params.CONFIGURATION, {db_params.COLLECTION_RELEVANT_FOR: collection_name},
                         {"$pull": {db_params.VALIDATORS: {db_params.NAME: validator[db_params.NAME]}}})

        assert errors == []

    @doc_it()
    @pytest.mark.duplicated_fields
    def test_13374_notification_for_duplicate_validators(self, browser):
        """
        Check that all duplicate fields underlined
        :return:
        """
        errors = []
        new_validator_missing_type = {
            db_params.NAME: Faker().word(),
            # db_params.NAME: db_params.CURRENCY_FROM,
        }
        collection_name = db_params.GLOB_TEST_WITH_EXC_FOR_APP
        for validator in [new_validator_missing_type]:
            update_mongo(db_params.CONFIGURATION, {db_params.COLLECTION_RELEVANT_FOR: collection_name},
                         {"$push": {db_params.VALIDATORS: validator}})

        for validator in [new_validator_missing_type]:
            update_mongo(db_params.CONFIGURATION, {db_params.COLLECTION_RELEVANT_FOR: collection_name},
                         {"$push": {db_params.VALIDATORS: validator}})

        field_name_for_search = new_validator_missing_type[db_params.NAME]
        login_to_app(browser, admin=True)
        admin_page = AdminPage(browser)
        admin_page.select_collection(collection_name)
        admin_page.select_link_by_text(FIELD_VALIDATION)
        admin_page.search_value_in_container(field_name_for_search, is_validator=True)
        found_items = admin_page.get_validators(None)
        if len(found_items) < 2:
            errors.append(f"There is no duplicate for the {field_name_for_search}")
        if [x for x in found_items if field_name_for_search not in x]:
            errors.append("expected no items that do not match search str found")
        is_class = admin_page.check_if_attribute_in_tag(field_name=field_name_for_search, attribute="repeated", attr_name="class")
        if not is_class:
            errors.append(f"There is no underline for the {field_name_for_search}")
        for validator in [new_validator_missing_type]:
            update_mongo(db_params.CONFIGURATION, {db_params.COLLECTION_RELEVANT_FOR: collection_name},
                         {"$pull": {db_params.VALIDATORS: {db_params.NAME: validator[db_params.NAME]}}})

        assert errors == []

    @doc_it()
    @pytest.mark.charts
    def test_13516_charts_page(self, browser):
        """
        Chart page test
        :return:
        """
        errors = []
        collection_name = db_params.GLOB_TEST_WITH_EXC_FOR_APP
        login_to_app(browser, admin=True)
        admin_page = AdminPage(browser)
        admin_page.select_collection(collection_name)
        admin_page.select_link_by_text(CHARTS)

        assert errors == []
    # TODO: add checks for the Chart fields

    @doc_it()
    @pytest.mark.parametrize("params_fields", [ADD_NEW_RECORD])
    @pytest.mark.open_dropdown_list_when_search
    def test_13518_add_new_records_page_move_left_to_right(self, browser, params_fields):
        """
        The user searches value in sub list
        and checks that we open dropdown list in admin panel
        """
        errors = []
        text = "fx_margin"
        option = params_fields
        collection_name = db_params.GLOB_TEST_WITH_EXC_FOR_APP
        login_to_app(browser, admin=True)
        admin_page = AdminPage(browser)
        admin_page.select_collection(collection_name)
        admin_page.select_link_by_text(SEARCH_SCREEN)
        admin_page.select_config_field(option)
        time.sleep(1)
        '''admin_page.search_value_in_container(text, False)
        is_open = admin_page.open_item(False, db_params.AMOUNTS_AND_RATES, True)
        if not is_open:
            errors.append("expected list to be open")
        admin_page.select_container_item(False, db_params.AMOUNTS_AND_RATES)
        is_open_upd = admin_page.open_item(False, db_params.AMOUNTS_AND_RATES, True)
        if is_open_upd:
            errors.append("expected list to be open")'''

        time.sleep(5)
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

        assert errors == []

    @doc_it()
    @pytest.mark.parametrize("params_fields", [ADD_NEW_RECORD])
    @pytest.mark.open_dropdown_list_when_search
    def test_13518_add_new_records_page(self, browser, params_fields):
        """
        The user searches value in sub list
        and checks that we open dropdown list in admin panel
        """
        errors = []
        text = "fx_margin"
        option = params_fields
        collection_name = db_params.GLOB_TEST_WITH_EXC_FOR_APP
        login_to_app(browser, admin=True)
        admin_page = AdminPage(browser)
        admin_page.select_collection(collection_name)
        admin_page.select_link_by_text(SEARCH_SCREEN)
        admin_page.select_config_field(option)
        time.sleep(1)
        admin_page.search_value_in_container(text, False)
        is_open = admin_page.open_item(False, db_params.AMOUNTS_AND_RATES, True)
        if not is_open:
            errors.append("expected list to be open")
        admin_page.select_container_item(False, db_params.AMOUNTS_AND_RATES)
        is_open_upd = admin_page.open_item(False, db_params.AMOUNTS_AND_RATES, True)
        if is_open_upd:
            errors.append("expected list to be open")

        assert errors == []

        #TODO: add test for On/Off checkbox

        #TODO: add test for the ImageLinks field