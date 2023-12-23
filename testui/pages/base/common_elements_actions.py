import time

from pages.base.base_page import BasePage
from pages.base.common_elements_locators import CommonElementsLocators


class CommonElementsPage(BasePage):
    def get_title(self):
        return self.get_el_text(CommonElementsLocators.TITLE)

    def click_on_global_updates_button(self, passed=True):
        self.click_on_element(CommonElementsLocators.GLOBAL_UPDATES_BTN)

    def check_global_updates_validation(self, passed=True):
        # wait until button
        exec_time = 0
        if passed:
            program_starts = time.time()
            for i in range(1, 100):
                if self.check_element_is_displayed(CommonElementsLocators.GLOBAL_UPDATES_BTN):
                    exec_time = time.time() - program_starts
                    break
                else:
                    time.sleep(1)
                    i += 1
            # todo: check that number of fields increased on form
            time.sleep(1)
            return exec_time

    # todo: done
    def global_updates(self, passed=True):
        self.click_on_element(CommonElementsLocators.GLOBAL_UPDATES_BTN)
        self.confirm_alert()
        # wait until button
        exec_time = 0
        if passed:
            program_starts = time.time()
            for i in range(1, 100):
                if self.check_element_is_displayed(CommonElementsLocators.GLOBAL_UPDATES_BTN):
                    exec_time = time.time() - program_starts
                    break
                else:
                    time.sleep(1)
                    i += 1
            # todo: check that number of fields increased on form
            return exec_time

    def add_field_btn_click(self):
        self.click_on_element(CommonElementsLocators.ADD_FIELD_BTN)

    def get_hint_text(self):
        return self.get_el_text(CommonElementsLocators.COMMON_HINT)

    def get_table_headers(self):
        texts = []
        els = self.find_elements(CommonElementsLocators.TABLE_HEADER)
        for el in els:
            texts.append(el.text)
        return texts

    def select_link_by_text(self, text):
        self.click_on_element((CommonElementsLocators.get_link_by_text(text)))

    def find_all_links(self, link_text):
        return self.find_elements((CommonElementsLocators.get_link_by_text(link_text)))

    def select_option_by_text(self, text, react_el=False):
        locator = (CommonElementsLocators.option_from_react_dropdown(text)) if react_el else (
            CommonElementsLocators.select_option_from_visible_dropdown(text))
        self.click_on_element(locator)

    def select_option_by_text_in_cell_dropdown(self, text, cell_name):
        self.click_on_element(
            (CommonElementsLocators.select_option_from_visible_dropdown_by_cell_name(text, cell_name)))

    def open_add_field_dropdown(self):
        self.click_on_element(CommonElementsLocators.ADD_FIELD_DROPDOWN)

    def add_field_on_form(self, field_name, is_audit=True):
        self.open_add_field_dropdown()
        self.select_option_by_text(field_name)
        self.click_on_element(CommonElementsLocators.add_btn(is_audit))

    def get_options_list(self):
        opt_list = self.find_elements(CommonElementsLocators.OPEN_DROPDOWN_OPTIONS)
        options = []
        if opt_list:
            for el in opt_list:
                options.append(el.text)
        return options

    def check_add_field_btn_visibility(self, visible):
        return self.check_element_is_displayed(
            CommonElementsLocators.ADD_FIELD_BTN) if visible else self.check_element_is_non_visible(
            CommonElementsLocators.ADD_FIELD_BTN)

    def get_react_dropdown_values(self):
        return self.get_el_text(CommonElementsLocators.REACT_DROPDOWN_LIST)

    def click_on_body(self):
        self.click_on_element(CommonElementsLocators.BODY)

    def get_add_field_dropdown_options(self):
        self.open_add_field_dropdown()
        return self.get_options_list()
