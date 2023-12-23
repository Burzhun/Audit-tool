import pytest

from conftest import doc_it
from pages.admin.admin_page import AdminPage
from params import db_params
from params.texts import IMAGES
from utils.app_actions import login_to_app


@pytest.mark.usefixtures("remove_files")
class TestAdminPanelImagesScreen:
    @doc_it()
    @pytest.mark.check_images_screen
    def test_check_images_screen(self, browser, get_fields_from_collection):
        """
        """
        errors = []

        collection_name = db_params.GLOB_TEST_WITH_EXC_FOR_APP
        login_to_app(browser, admin=True)
        admin_page = AdminPage(browser)
        admin_page.select_collection(collection_name)
        admin_page.select_link_by_text(IMAGES)

        admin_page.save_validator()
        alert_text = admin_page.get_alert_text()
        if "Successfully updated" not in alert_text:
            errors.append(f"expected text 'Successfully updated', got in alert: {alert_text}")
        admin_page.confirm_alert()