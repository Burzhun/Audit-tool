from pages.base.base_page import BasePage
from pages.login.login_page_locators import LoginPageLocators


class LoginPage(BasePage):
    def go_to_login_form(self):
        self.click_on_element(LoginPageLocators.LOGIN_LNK)

    def enter_login_pswd(self, login, pswd):
        self.type_in_element(LoginPageLocators.LOGIN_INPUT, login)
        self.type_in_element(LoginPageLocators.PASSWORD_INPUT, pswd)

    def submit_login_form(self):
        self.click_on_element(LoginPageLocators.AUTH_BTN)

    def go_to_register_form(self):
        self.click_on_element(LoginPageLocators.SIGN_UP_LNK)

    def fill_register_from(self, firstname=None, lastname=None, email=None, password=None):
        if firstname:
            self.type_in_element(LoginPageLocators.FIRST_NAME_INPUT, firstname)
        if lastname:
            self.type_in_element(LoginPageLocators.LAST_NAME_INPUT, lastname)
        if email:
            self.type_in_element(LoginPageLocators.EMAIL_INPUT, email)
        if password:
            self.type_in_element(LoginPageLocators.PASSWORD_INPUT, password)

    def get_error_for_field(self, label, with_text):
        return self.get_el_text((LoginPageLocators.error(label, with_text))) if with_text else self.check_element_is_displayed(
            (LoginPageLocators.error(label, with_text)))

    def check_color_for_error(self):
        colors = []
        els = self.find_elements(LoginPageLocators.ERROR_FRAME)
        for el in els:
            if el.value_of_css_property("color") != 'rgba(159, 58, 56, 1)':
                colors.append(False)
        return True if not colors else False

    def go_to_user_profile_page(self):
        self.click_on_element(LoginPageLocators.PROFILE_LINK)

    def click_change_password_btn(self):
        self.click_on_element(LoginPageLocators.CHANGE_PASSWORD_BTN)

    def fill_change_password_form(self, old_password=None, new_password=None):
        if old_password:
            self.type_in_element(LoginPageLocators.OLD_PASSWORD, old_password)
        if new_password:
            self.type_in_element(LoginPageLocators.NEW_PASSWORD, new_password)

    def click_set_password_btn(self):
        self.click_on_element(LoginPageLocators.SET_PASSWORD_BTN)