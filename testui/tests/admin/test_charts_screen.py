import time

import pytest

from conftest import doc_it
from pages.admin.admin_page import AdminPage
from params import db_params
from params.texts import CHARTS, SUCCESSFULLY_UPDATED
from utils.app_actions import login_to_app


@pytest.mark.usefixtures("remove_files")
class TestAdminPanelAuditScreenData:
    @doc_it()
    @pytest.mark.check_charts
    def test_check_charts_screen_fields(self, browser):
        """
        The test check Audit Tool dropdown options one by one and open it
        """
        errors = []

        collection_name = db_params.GLOB_TEST_WITH_EXC_FOR_APP
        login_to_app(browser, admin=True)
        admin_page = AdminPage(browser)
        admin_page.select_collection(collection_name)
        time.sleep(2)
        tabs = admin_page.get_tab_names()
        for el in [CHARTS]:
            tabs.remove(el)
        for tab in [CHARTS]:
            admin_page.select_link_by_text(tab)

        admin_page.select_validator_by_name("amounts_and_rates")
        admin_page.save_validator()
        alert_text = admin_page.get_alert_text()
        if SUCCESSFULLY_UPDATED not in alert_text:
            errors.append(f"expected {SUCCESSFULLY_UPDATED} to be in alert")
        admin_page.confirm_alert()
        assert errors == []