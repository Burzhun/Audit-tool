import pytest

from conftest import doc_it
from pages.admin.admin_page import AdminPage
from params import db_params
from params.texts import API_CALLS
from utils.app_actions import login_to_app


@pytest.mark.usefixtures("remove_files")
class TestAdminPanelApiCallsScreen:
    @doc_it()
    @pytest.mark.check_api_cals
    def test_create_new_api_call(self, browser, get_fields_from_collection):
        """
        """
        errors = []
        api_update_name = "DL-API-1"

        collection_name = db_params.GLOB_TEST_WITH_EXC_FOR_APP
        login_to_app(browser, admin=True)
        admin_page = AdminPage(browser)
        admin_page.select_collection(collection_name)
        admin_page.select_link_by_text(API_CALLS)

        # admin_page.updates_sub_dropdown_data("Global Update 1")
        admin_page.add_new_updates()

        #uncomment after fix 13854
        '''admin_page.save_validator()
        alert_text = admin_page.get_alert_text()

        if "'Name' Field must be populated" not in alert_text:
            errors.append(f"expected 'Name' Field must be populated to be in alert got {alert_text}")
        admin_page.confirm_alert()'''

        admin_page.set_name_field_value(field_text=api_update_name)
        admin_page.set_api_token_field_value(field_text="TestToken-1234567890")
        admin_page.set_api_base_url_field_value(field_text="TestBaseURL-0987654321")

        admin_page.click_on_add_field_button("API parameters")
        admin_page.set_field_value("parameter-name", field_text="param1")
        admin_page.set_field_api_parameters("AuditNumber")

        admin_page.click_on_add_field_button("Fields to be updated by API")
        admin_page.set_field_value("update-name", field_text="param2")
        admin_page.set_fields_to_be_updated_by_api("AuditNumber")

        admin_page.save_validator()
        alert_text = admin_page.get_alert_text()
        if "Successfully updated" not in alert_text:
            errors.append(f"expected text 'Successfully updated', got in alert: {alert_text}")
        admin_page.confirm_alert()

        admin_page.updates_sub_dropdown_data(api_update_name)

        admin_page.delete_validator()
        alert_text = admin_page.get_alert_text()
        if "Are you sure you want do delete this auto update?" not in alert_text:
            errors.append(
                f"expected text 'Are you sure you want do delete this auto update?', got in alert: {alert_text}")
        admin_page.confirm_alert()

        alert_text = admin_page.get_alert_text()
        if "Successfully updated" not in alert_text:
            errors.append(f"expected text 'Successfully updated', got in alert: {alert_text}")
        admin_page.confirm_alert()

        assert errors == []