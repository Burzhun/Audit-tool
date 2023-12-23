import time

import pytest
from faker import Faker

from conftest import doc_it
from dbutil.db_utils import find_docs_in_collection, delete_mongo, update_mongo
from pages.admin.admin_page import AdminPage
from pages.login.login_page_actions import LoginPage
from params import texts
from params.db_params import LAST_NAME, FIRST_NAME, ROLE, REGISTERED_USER_EMAIL, REGISTERED_DATE
from params.texts import PSWD_LENGTH_NOTIFICATION
from utils.app_actions import register_new_user, login_to_app
from datetime import datetime, timedelta


@pytest.mark.usefixtures("remove_files")
class TestGeneralFunctional:
    @doc_it()
    def test_13700_check_user_registration(self, browser):
        """
        User open registration page
        User fill all fields and create a new account
        """
        errors = []
        col_name = "User"
        existing_email = "a1@getnada.com"
        register_new_user(browser)
        page = LoginPage(browser)
        page.submit_login_form()
        if page.get_error_for_field("Password", True) != PSWD_LENGTH_NOTIFICATION:
            errors.append(f"expected password field to contain {PSWD_LENGTH_NOTIFICATION}")
        if not page.check_color_for_error():
            errors.append(f"errors are not properly colored")

        email = Faker().email()
        password = Faker().pystr()
        page.fill_register_from(email=email, password=password)
        page.submit_login_form()
        if not page.get_error_for_field("First Name", False):
            errors.append("expected First Name to be with error")
        if not page.get_error_for_field("Last Name", False):
            errors.append("expected Last Name to be with error")
        if not page.check_color_for_error():
            errors.append(f"errors are not properly colored")

        # register with email only
        firstname = Faker().first_name()
        lastname = Faker().last_name()
        page.fill_register_from(firstname, lastname, existing_email, password)
        page.submit_login_form()
        alert_text = page.get_alert_text()
        if texts.ALREADY_REGISTERED_USER not in alert_text:
            errors.append(f"expected alert to contain {texts.ALREADY_REGISTERED_USER}")
        page.confirm_alert()

        page.fill_register_from(firstname, lastname, email, password)
        page.submit_login_form()
        alert_text = page.get_alert_text()
        if texts.SIGN_UP_SUCCESS not in alert_text:
            errors.append(f"expected alert to contain {texts.SIGN_UP_SUCCESS}")
        new_user = find_docs_in_collection(col_name, {"RegisteredUserEmail": email})
        if new_user[LAST_NAME] != lastname:
            errors.append(f"expected lastname in db to be {lastname}, got {new_user[LAST_NAME]}")
        if new_user[FIRST_NAME] != firstname:
            errors.append(f"expected firstname in db to be {firstname}, got {new_user[FIRST_NAME]}")
        if new_user[ROLE] != "new":
            errors.append(f"expected role to be new got {new_user[ROLE]}")
        if new_user[REGISTERED_USER_EMAIL] != email:
            errors.append(f"expected email to be {email} got {new_user[REGISTERED_USER_EMAIL]}")
        cur_time = datetime.utcnow()
        if cur_time - datetime.strptime(new_user[REGISTERED_DATE], "%Y-%m-%dT%H:%M:%S.%fZ") > timedelta(minutes=2):
            errors.append(f"expected registered date to be no more than 2 minutes")

        page.confirm_alert()
        page.enter_login_pswd(email, password)
        page.submit_login_form()
        alert_access = page.get_alert_text()
        if texts.NO_ACCESS_GRANTED not in alert_access:
            errors.append(f"expected {texts.NO_ACCESS_GRANTED} to be in alert, got {alert_access}")

        delete_mongo(col_name, {"RegisteredUserEmail": email})
        assert errors == []

    @doc_it()
    def test_13610_check_added_users_in_admin_account(self, browser):
        """
        A new user create account
        Admin Login to the system
        Admin Open profile page
        Admin can see created user
        Admin can approve/reject user account
        """
        errors = []
        col_name = "User"
        register_new_user(browser)
        page = LoginPage(browser)
        email = Faker().email()
        password = Faker().pystr()
        firstname = Faker().first_name()
        lastname = Faker().last_name()

        page.fill_register_from(firstname, lastname, email, password)
        page.submit_login_form()
        alert_text = page.get_alert_text()
        if texts.SIGN_UP_SUCCESS not in alert_text:
            errors.append(f"expected alert to contain {texts.SIGN_UP_SUCCESS}")
        new_user = find_docs_in_collection(col_name, {"RegisteredUserEmail": email})
        if new_user[LAST_NAME] != lastname:
            errors.append(f"expected lastname in db to be {lastname}, got {new_user[LAST_NAME]}")
        if new_user[FIRST_NAME] != firstname:
            errors.append(f"expected firstname in db to be {firstname}, got {new_user[FIRST_NAME]}")
        if new_user[ROLE] != "new":
            errors.append(f"expected role to be new got {new_user[ROLE]}")
        if new_user[REGISTERED_USER_EMAIL] != email:
            errors.append(f"expected email to be {email} got {new_user[REGISTERED_USER_EMAIL]}")
        cur_time = datetime.utcnow()
        if cur_time - datetime.strptime(new_user[REGISTERED_DATE], "%Y-%m-%dT%H:%M:%S.%fZ") > timedelta(minutes=2):
            errors.append(f"expected registered date to be no more than 2 minutes")

        page.confirm_alert()

        login_to_app(browser, admin=True)
        admin_page = AdminPage(browser)
        admin_page.go_to_profile_page()
        if email != admin_page.find_email_on_page():
            errors.append(f"There is no email on page. Email = {email}, got {admin_page.find_email_on_page()}")
        delete_mongo(col_name, {"RegisteredUserEmail": email})
        assert errors == []

    @doc_it()
    def test_13610_check_approve_users_in_admin_account(self, browser):
        """
        A new user create account
        Admin Login to the system
        Admin Open profile page
        Admin can approve user
        """
        errors = []
        col_name = "User"
        register_new_user(browser)
        page = LoginPage(browser)
        email = Faker().email()
        password = Faker().pystr()
        firstname = Faker().first_name()
        lastname = Faker().last_name()

        page.fill_register_from(firstname, lastname, email, password)
        page.submit_login_form()
        page.confirm_alert()

        login_to_app(browser, admin=True)
        admin_page = AdminPage(browser)
        admin_page.go_to_profile_page()
        if email != admin_page.find_email_on_page():
            errors.append(f"There is no email on page. Email = {email}, got {admin_page.find_email_on_page()}")
        admin_page.click_give_access(email)
        alert_text = admin_page.get_alert_text()
        if texts.SUCCESSFULLY_UPDATED not in alert_text:
            errors.append(f"expected alert to contain {texts.SUCCESSFULLY_UPDATED}")
        admin_page.confirm_alert()
        delete_mongo(col_name, {"RegisteredUserEmail": email})
        assert errors == []

    @doc_it()
    def test_13610_check_delete_users_in_admin_account(self, browser):
        """
        A new user create account
        Admin Login to the system
        Admin Open profile page
        Admin can approve user
        """
        errors = []
        col_name = "User"
        register_new_user(browser)
        page = LoginPage(browser)
        email = Faker().email()
        password = Faker().pystr()
        firstname = Faker().first_name()
        lastname = Faker().last_name()

        page.fill_register_from(firstname, lastname, email, password)
        page.submit_login_form()
        alert_text = page.get_alert_text()
        page.confirm_alert()

        login_to_app(browser, admin=True)
        admin_page = AdminPage(browser)
        admin_page.go_to_profile_page()
        if email != admin_page.find_email_on_page():
            errors.append(f"There is no email on page. Email = {email}, got {admin_page.find_email_on_page()}")
        admin_page.click_delete_user(email)
        alert_text = admin_page.get_alert_text()
        if texts.DELETE_USER_CONFIRMATION_MESSAGE not in alert_text:
            errors.append(f"expected alert to contain {texts.DELETE_USER_CONFIRMATION_MESSAGE}")
        admin_page.confirm_alert()

        alert_text = admin_page.get_alert_text()
        if texts.USER_DELETED_MESSAGE not in alert_text:
            errors.append(f"expected alert to contain {texts.USER_DELETED_MESSAGE}")
        admin_page.confirm_alert()

        user_exist = find_docs_in_collection(col_name, {"RegisteredUserEmail": email})
        if user_exist:
            errors.append(f"expected {user_exist} not in db, got {user_exist} in db")
            delete_mongo(col_name, {"RegisteredUserEmail": email})
        assert errors == []

    @doc_it()
    def test_13610_check_change_passwords_in_user_account(self, browser):
        """
        User login to the account
        User open profile page
        User can change his password
        """
        errors = []
        col_name = "User"
        register_new_user(browser)
        page = LoginPage(browser)
        email = Faker().email()
        password = Faker().pystr()
        new_password = Faker().pystr()
        firstname = Faker().first_name()
        lastname = Faker().last_name()

        page.fill_register_from(firstname, lastname, email, password)
        page.submit_login_form()
        alert_text = page.get_alert_text()
        if texts.SIGN_UP_SUCCESS not in alert_text:
            errors.append(f"expected alert to contain {texts.SIGN_UP_SUCCESS}")
        new_user = find_docs_in_collection(col_name, {"RegisteredUserEmail": email})
        if new_user[LAST_NAME] != lastname:
            errors.append(f"expected lastname in db to be {lastname}, got {new_user[LAST_NAME]}")
        if new_user[FIRST_NAME] != firstname:
            errors.append(f"expected firstname in db to be {firstname}, got {new_user[FIRST_NAME]}")
        if new_user[ROLE] != "new":
            errors.append(f"expected role to be new got {new_user[ROLE]}")
        if new_user[REGISTERED_USER_EMAIL] != email:
            errors.append(f"expected email to be {email} got {new_user[REGISTERED_USER_EMAIL]}")
        cur_time = datetime.utcnow()
        if cur_time - datetime.strptime(new_user[REGISTERED_DATE], "%Y-%m-%dT%H:%M:%S.%fZ") > timedelta(minutes=2):
            errors.append(f"expected registered date to be no more than 2 minutes")

        page.confirm_alert()
        page.enter_login_pswd(email, password)
        page.submit_login_form()
        time.sleep(1)
        alert_access = page.get_alert_text()
        if texts.NO_ACCESS_GRANTED not in alert_access:
            errors.append(f"expected {texts.NO_ACCESS_GRANTED} to be in alert, got {alert_access}")
        page.confirm_alert()

        update_mongo(col_name, {REGISTERED_USER_EMAIL: email},
                     {"$set": {f"{ROLE}": ""}})
        time.sleep(1)
        page.enter_login_pswd(email, password)
        time.sleep(1)
        page.submit_login_form()
        time.sleep(1)
        page.go_to_user_profile_page()
        time.sleep(1)
        page.click_change_password_btn()
        page.fill_change_password_form(password, new_password)
        page.click_set_password_btn()

        alert_text = page.get_alert_text()
        if texts.PSWD_CHANGED_SUCCESS not in alert_text:
            errors.append(f"expected {texts.PSWD_CHANGED_SUCCESS} to be in alert, got {alert_text}")
        page.confirm_alert()

        delete_mongo(col_name, {"RegisteredUserEmail": email})

        assert errors == []