import functools
import time

import params
import pytest

from conftest import doc_it, get_fields_from_collection
from pages.admin.admin_page import AdminPage
from params import db_params
from params.texts import AUDIT_SCREEN, SUCCESSFULLY_UPDATED
from tests.admin.test_config_admin import get_container_items
from utils.app_actions import login_to_app


@pytest.mark.usefixtures("remove_files")
class TestAdminPanelAuditScreenData:
    @doc_it()
    @pytest.mark.check_audit_tool
    def test_check_audit_screen_dropdown_options(self, browser):
        """
        The test check Audit Tool dropdown options one by one and open it
        """
        errors = []
        list_of_audit_screen_options = ['AllowCopyFunction', 'ConfidenceScores', 'DefaultFieldsToDisplayInAuditSession', 'DefaultSortings',
                                        'user_functions', 'FieldsToDisplayOnMiddleScreen', 'UnEditableFields']

        collection_name = db_params.GLOB_TEST_WITH_EXC_FOR_APP
        login_to_app(browser, admin=True)
        admin_page = AdminPage(browser)
        admin_page.select_collection(collection_name)
        time.sleep(2)
        tabs = admin_page.get_tab_names()
        for el in [AUDIT_SCREEN]:
            tabs.remove(el)
        for tab in [AUDIT_SCREEN]:
            admin_page.select_link_by_text(tab)
            # select config field if exists
            option_list = admin_page.get_config_options()
            if not functools.reduce(lambda x, y: x and y,
                                    map(lambda p, q: p == q, option_list, list_of_audit_screen_options), True):
                errors.append(f"options in dropdown are: {option_list}")

            for opt in option_list:
                admin_page.select_config_field(opt)
                # check selected:
        assert errors == []

    @doc_it()
    @pytest.mark.check_audit_tool
    def test_check_confidence_scores_screen_user_functions_screen(self, browser):
        """
        The test check Audit Tool ConfidenceScores screen
        """
        errors = []

        collection_name = db_params.GLOB_TEST_WITH_EXC_FOR_APP
        login_to_app(browser, admin=True)
        admin_page = AdminPage(browser)
        admin_page.select_collection(collection_name)
        time.sleep(2)
        tabs = admin_page.get_tab_names()

        for tab in [AUDIT_SCREEN]:
            admin_page.select_link_by_text(tab)
            # select config field if exists
            option_list = admin_page.get_config_options()

            for opt in option_list:
                if 'ConfidenceScores' == opt:
                    admin_page.select_config_field(opt)
                    # check selected:
            admin_page.save_validator()
            alert_text = admin_page.get_alert_text()
            if SUCCESSFULLY_UPDATED not in alert_text:
                errors.append(f"expected {SUCCESSFULLY_UPDATED} to be in alert")
            admin_page.confirm_alert()
        assert errors == []

    @doc_it()
    @pytest.mark.check_audit_tool
    def test_check_audit_screen_user_functions_screen(self, browser):
        """
        The test check Audit Tool user_functions screen
        """
        errors = []

        collection_name = db_params.GLOB_TEST_WITH_EXC_FOR_APP
        login_to_app(browser, admin=True)
        admin_page = AdminPage(browser)
        admin_page.select_collection(collection_name)
        time.sleep(2)
        tabs = admin_page.get_tab_names()

        for tab in [AUDIT_SCREEN]:
            admin_page.select_link_by_text(tab)
            # select config field if exists
            option_list = admin_page.get_config_options()

            for opt in option_list:
                if 'user_functions' == opt:
                    admin_page.select_config_field(opt)
                    # check selected:
            admin_page.save_user_functions()
            alert_text = admin_page.get_alert_text()
            if SUCCESSFULLY_UPDATED not in alert_text:
                errors.append(f"expected {SUCCESSFULLY_UPDATED} to be in alert")
            admin_page.confirm_alert()
        assert errors == []