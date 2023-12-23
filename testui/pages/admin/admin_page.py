import time

from selenium.webdriver.common.keys import Keys

import params.texts
import params.texts
from pages.admin.admin_page_locators import AdminPageLocators
from pages.base.common_elements_actions import CommonElementsPage
from pages.base.common_elements_locators import CommonElementsLocators
from params import db_params
from params.params import COLOR, TOOLTIP, BG_COLOR


class AdminPage(CommonElementsPage):
    def select_collection(self, collection_name):
        self.click_on_element(AdminPageLocators.SELECT_COLLECTION_DROPDOWN)
        self.select_option_by_text(collection_name)

    def get_tab_names(self):
        els_text = []
        els = self.find_elements(CommonElementsLocators.MENU_TAB)
        if els:
            for el in els:
                els_text.append(el.text)
        return els_text

    def go_to_profile_page(self):
        self.click_on_element(AdminPageLocators.MAIN_ADMIN_PAGE_PROFILE_LINK)

    def go_to_user_profile_page(self):
        self.click_on_element(AdminPageLocators.PROFILE_LINK)

    def find_email_on_page(self):
        email_elem = self.find_element(AdminPageLocators.LAST_EMAIL_ON_PAGE).text
        return email_elem

    def open_close_config_dropdown(self):
        self.click_on_element(AdminPageLocators.SELECT_CONFIG_FIELD_DROPDOWN)

    def get_config_options(self):
        self.open_close_config_dropdown()
        opts = self.get_options_list()
        self.open_close_config_dropdown()
        return opts

    def select_config_field(self, option):
        self.open_close_config_dropdown()
        self.select_option_by_text(option)

    def get_cont_items(self, is_right, is_dict_type, selected, parent=None):
        texts = []
        els = self.find_elements(AdminPageLocators.selected_unselected_items(is_dict_type, is_right, selected, parent))
        if els:
            for el in els:
                texts.append(el.text)
        return texts

    def get_items_selected(self, dict_type, is_right, selected=True):
        texts = []
        els = self.find_elements(AdminPageLocators.selected_unselected_items(dict_type, is_right, selected))
        if els:
            for el in els:
                texts.append(el.text)
        return texts

    def handle_arrow_btn(self, right=True, enabled=True):
        """
        Method handles arrow btn manipulation.
        :param right: True - then right btn will be handled, False - left
        :param enabled: if true: checks that btn is really disbaled on form
        :return:
        """
        if enabled:
            is_enabled = self.check_btn_is_enabled(AdminPageLocators.arrow_button(right))
            self.click_on_element(AdminPageLocators.arrow_button(right))
            return is_enabled
        else:
            return self.check_btn_is_enabled(AdminPageLocators.arrow_button(right))

    def select_container_item(self, selected, field_name):
        self.click_on_element(AdminPageLocators.container_item(selected, field_name))

    def set_checkbox(self, checked):
        checkbox = self.find_element(AdminPageLocators.VISIBILITY_CHECKBOX)
        is_selected = checkbox.is_selected()
        if checked and not is_selected or not checked and is_selected:
            self.find_element(AdminPageLocators.LABEL).click()
            return self.checkbox_is_set(AdminPageLocators.VISIBILITY_CHECKBOX)
        else:
            return True

    def check_checkbox(self, is_selected):
        return self.is_element_selected(AdminPageLocators.VISIBILITY_CHECKBOX, is_selected)

    def select_unselect_all(self, is_right, select_all):
        if is_right:
            self.click_on_element(AdminPageLocators.SELECT_HEADER_RIGHT)
        else:
            self.click_on_element(AdminPageLocators.SELECT_HEADER_LEFT)
        if select_all:
            self.select_option_by_text(params.texts.SELECT_ALL)
        else:
            self.select_option_by_text(params.texts.UNSELECT_ALL)

    def close_active_dropdown(self):
        self.click_on_element(AdminPageLocators.ACTIVE_DROPDOWN_ICON)

    def abort_changes(self, action=True):
        if action:
            self.click_on_element(AdminPageLocators.ABORT_CHANGES_BTN)
        else:
            return self.check_btn_is_enabled(AdminPageLocators.ABORT_CHANGES_BTN)

    def handle_save_click(self, enabled=True):
        is_btn_enabled = self.check_btn_is_enabled(AdminPageLocators.SAVE_CHANGES_BTN)
        if enabled:
            self.click_on_element(AdminPageLocators.SAVE_CHANGES_BTN)
        return is_btn_enabled

    def save_user_functions(self):
        self.click_on_element(AdminPageLocators.SAVE_USER_FUNCTIONS_BTN)

    def save_validator(self):
        self.click_on_element(AdminPageLocators.SAVE_CONSTRAINT_BTN)

    def delete_validator(self):
        self.click_on_element(AdminPageLocators.DELETE_VALIDATOR_BTN)

    def check_grid_is_disabled(self):
        return True if "disabled" in self.get_element_attribute(AdminPageLocators.CONTAINER_GRID, "class") else False

    def get_default_search_field(self):
        return self.get_el_text(AdminPageLocators.ACTIVE_SELECTED_ITEM_IN_DEFAULT_SEARCH)

    def remove_default_search_field(self):
        self.click_on_element(AdminPageLocators.CLEAR_DEFAULT_SEARCH_INPUT)

    def default_search_dropdown_click(self):
        self.click_on_element(AdminPageLocators.DEFAULT_SEARCH_DROPDOWN)

    def set_default_search_field(self, text=None, prev_value=None):
        self.default_search_dropdown_click()
        # get option text
        if text is not None:
            self.select_option_by_text(text)
            # wait until field value is field:
            return self.text_present_in_element(AdminPageLocators.ACTIVE_SELECTED_ITEM_IN_DEFAULT_SEARCH, text, True)
        else:
            # get options:
            options_text = (self.get_el_text(CommonElementsLocators.VISIBLE_MENU_TRANSITION)).split('\n')
            for i in range(len(options_text)):
                if options_text[i] != prev_value:
                    self.select_option_by_text(options_text[i])
                    return self.text_present_in_element(AdminPageLocators.ACTIVE_SELECTED_ITEM_IN_DEFAULT_SEARCH,
                                                        options_text[i], True)

    def get_validator_fields(self):
        return self.get_el_text(AdminPageLocators.VALIDATORS_FIELDS)

    def select_validator_by_name(self, name):
        self.find_element(AdminPageLocators.validator_by_name(name)).click()

    def open_item(self, is_right, field_name, check=False):
        el = self.find_element(AdminPageLocators.container_item_by_name(is_right, field_name))
        is_extended = el.get_attribute("data-qa-extended")
        if check:
            return is_extended
        else:
            if not el.get_attribute("data-qa-extended"):
                el.click()

    def get_field_data_type(self):
        return self.get_el_text(AdminPageLocators.FIELD_DATA_TYPE)

    def set_field_data_type(self, data_type):
        self.click_on_element(AdminPageLocators.FIELD_DATA_TYPE)
        self.select_option_by_text(data_type)

    def get_constraint(self, key=True, index=0, numbers=None):
        """Cannot be set unique method as we have different
        types and somewhere it's input and somewhere div"""
        texts = []
        # get text from div (dropdown values)
        els = self.find_elements(AdminPageLocators.handle_constraint(key, True, key))
        if els:
            if index is not None:
                texts.append(els[0].text)
            else:
                for el in els:
                    el_text = el.text
                    if el_text:
                        texts.append(el_text)
                    else:
                        texts.append(el.get_attribute("value"))
            if numbers and len(els) != numbers:
                # get text from span (input)
                els2 = self.find_elements(AdminPageLocators.handle_constraint(key, False, "input"))
            else:
                els2 = []
            if index is not None:
                texts.append(els2[0].get_attribute("value"))
            else:
                for el2 in els2:
                    texts.append(el2.get_attribute("value"))
        return texts

    def get_field_name(self):
        return self.get_el_text(AdminPageLocators.FIELD_NAME_INPUT, True)

    def set_field_dt(self, dt):
        self.click_on_element(AdminPageLocators.FIELD_DATA_TYPE)
        self.select_option_by_text(dt)

    def set_field_api_parameters(self, param_val):
        self.click_on_element(AdminPageLocators.API_FIELD_DROPDOWN_OPTION)
        self.select_option_by_text(param_val)

    def set_fields_to_be_updated_by_api(self, param_val):
        self.click_on_element(AdminPageLocators.FIELD_TO_BE_UPDATED_DROPDOWN_OPTION)
        self.select_option_by_text(param_val)

    def to_json_switch(self, switch_on):
        classes = self.get_element_attribute(AdminPageLocators.TO_JSON_SWITCHER, "class").split(" ")
        if "checked" in classes and not switch_on or "checked" not in classes and switch_on:
            self.click_on_element(AdminPageLocators.TO_JSON_SWITCHER_LABEL)

    def set_validator_field(self, field_type):
        self.set_field_dt(field_type)

    def add_constraint_click(self):
        self.click_on_element(AdminPageLocators.ADD_CONSTRAINT_BTN)

    def cancel_validator(self):
        self.click_on_element(AdminPageLocators.CANCEL_VALIDATOR_BTN)

    def remove_validator(self):
        self.click_on_element(AdminPageLocators.REMOVE_VALIDATOR_BTN)

    def remove_constraint(self, index):
        self.click_on_element(AdminPageLocators.REMOVE_CONSTRAINT_BTN, index)

    def set_constraint(self, constraint_name, constraint_value=None, constraint_name_index=0, constraint_value_index=0,
                       is_dropdown=False, to_add=True, constraint_type="input"):
        if to_add:
            self.click_on_element(AdminPageLocators.ADD_CONSTRAINT_BTN)
        # select constraint name
        if constraint_name:
            input_constraint_name = self.find_elements(AdminPageLocators.FIELD_CONSTRAINT_INPUT)[
                constraint_name_index]
            self.clear_field(input_constraint_name)
            # huck! Sometimes dropdowns are not closed/open by driver
            # visible_menu = self.find_element(CommonElementsLocators.OPEN_DROPDOWN_OPTIONS)
            # if not visible_menu:
            #     self.find_elements(AdminPageLocators.handle_constraint(True, True))[constraint_name_index].click()
            self.type_in_element(AdminPageLocators.FIELD_CONSTRAINT_INPUT, constraint_name, constraint_name_index)
            # self.select_option_by_text(constraint_name)
        # set constraint value
        if constraint_value is not None:
            constraint_value = f"{constraint_value}"
            set_val_el = self.find_elements(AdminPageLocators.handle_constraint(False, is_dropdown, constraint_type))[
                constraint_value_index]
            if is_dropdown:
                set_val_el.click()
                self.select_option_by_text(constraint_value)
            else:
                set_val_el.clear()
                set_val_el.send_keys(constraint_value)

    def get_values_from_value_constraint(self):
        constraints = self.get_field_constraints()
        values = [x[db_params.NEW_VALUE] for x in constraints if x[db_params.NAME] == "values"][0].split(',')
        return values

    def set_exclusive_value_constraint(self, exclusive_constraint_values):
        self.add_constraint_click()
        self.click_on_element("[data-qa='constraint-name'][data-qa-name='']")
        self.click_on_element(CommonElementsLocators.select_option_from_visible_dropdown(db_params.EXCLUSIVE_VALUE))

        self.click_on_element("[data-qa='constraint-value'][class*='Exclusive_value']")
        for x in exclusive_constraint_values:
            self.click_on_element(CommonElementsLocators.select_option_from_visible_dropdown(x))

    def get_revision(self):
        return self.get_el_text(AdminPageLocators.REVISION)

    def get_constraint_list(self, is_name, constraint_index=0):
        # open element, get text and close element (dropdown list)
        els = self.find_elements(AdminPageLocators.handle_constraint(is_name, True, "i"))
        if els:
            el = els[constraint_index]
            el.click()
            texts = self.get_options_list()
            el.click()
        else:
            texts = []
        return texts

    def set_input_value(self, field_name=None, field_text=None):
        self.type_in_element(f"[data-qa='{field_name}'] input", field_text)

    def search_value_in_container(self, search_value, is_right=True, is_validator=False):
        self.type_in_element(AdminPageLocators.SEARCH_VALIDATOR_INPUT,
                             search_value) if is_validator else self.type_in_element(
            AdminPageLocators.search_item_in_container(is_right, False), search_value)

    def remove_search_value(self, is_right=True):
        self.click_on_element(AdminPageLocators.search_item_in_container(is_right, True))

    def get_updated_by_fields_list(self):
        return self.get_el_text(AdminPageLocators.UPDATED_BY_FIELDS)

    def get_validators(self, missing=True):
        els = self.find_elements(AdminPageLocators.missing_validators(missing))
        texts = []
        if els:
            for el in els:
                texts.append(el.text)
        return texts

    def check_color_for_missing_validator(self):
        errors = []
        els = self.find_elements(AdminPageLocators.missing_validators(True))
        for el in els:
            if el.value_of_css_property("color") != "rgba(128, 128, 128, 0.55)":
                errors.append("expected color to be grey")
        return errors

    def check_color_for_no_type_validator(self):
        errors = []
        els = self.find_elements(AdminPageLocators.missing_validators(missing=False, is_no_type=True))
        for el in els:
            el.click()
            if self.get_el_text(AdminPageLocators.FIELD_DATA_TYPE):
                errors.append("validator Data type is not empty")
        return errors

    def check_field_or_validator_color_and_hint(self, is_right=False, field_name=None, is_missing=True,
                                                is_validator=False):
        locator = AdminPageLocators.validator_by_name(field_name) if is_validator else AdminPageLocators.container_item(is_right, field_name, is_missing)
        el = self.scroll_to_element(locator)
        self.on_hover_element(el)
        # sleep to make sure another tooltip is read
        time.sleep(1)
        if is_missing and not is_validator:
            return {COLOR: el.value_of_css_property(COLOR),
                    TOOLTIP: self.get_el_text(AdminPageLocators.MISSING_ITEM_TOOLTIP),
                    BG_COLOR: el.value_of_css_property(BG_COLOR)}
        else:
            return {COLOR: el.value_of_css_property(COLOR),
                    TOOLTIP: self.get_el_text(AdminPageLocators.VALIDATOR_TOOLTIP),
                    BG_COLOR: el.value_of_css_property(BG_COLOR)}

    def updates_dropdown_data(self, data_type):
        self.click_on_element(AdminPageLocators.UPDATES_DROPDOWN)
        self.select_option_by_text(data_type)

    def updates_sub_dropdown_data(self, data_type):
        self.click_on_element(AdminPageLocators.UPDATES_SUB_DROPDOWN)
        self.select_option_by_text(data_type)

    def add_new_updates(self):
        self.click_on_element(AdminPageLocators.CREATE_NEW_UPDATE_BTN)

    def check_if_attribute_in_tag(self, field_name=None, attribute=None, attr_name=None):
        attr = self.get_element_attribute(f"div[data-qa='{field_name}']", attr_name).split(" ")
        if f"{attribute}" in attr:
            return True
        else:
            return False

    def set_field_value(self, field_name, field_text=None, index=0, is_input=True):
        if is_input:
            self.type_in_element(AdminPageLocators.field_by_attribute_value(field_name), field_text)
        else:
            self.click_on_element(AdminPageLocators.open_dropdown_fields_click(field_name), index)
            self.select_option_by_text(field_name)

    def set_name_field_value(self, field_text=None):
        self.type_in_element(AdminPageLocators.NAME_FIELD, field_text)

    def set_input_field_value(self, field_text=None, is_input=True):
        self.type_in_element(AdminPageLocators.NAME_FIELD, field_text)

    def set_api_token_field_value(self, field_text=None):
        self.type_in_element(AdminPageLocators.API_TOKEN, field_text)

    def set_api_base_url_field_value(self, field_text=None):
        self.type_in_element(AdminPageLocators.API_BASE_URL, field_text)

    def set_description_field_value(self, field_text=None):
        self.type_in_element(AdminPageLocators.DESCRIPTION_FIELD, field_text)

    def set_piplene_field_value(self, field_text=None):
        self.type_in_element(AdminPageLocators.PIPELINE_FIELD, field_text)

    def set_update_function_field_value(self, field_text=None):
        self.type_in_element(AdminPageLocators.UPDATE_FUNCTION_FIELD, field_text)

    def dropdown_field_click(self, field_name):
        self.click_on_element(AdminPageLocators.open_dropdown_fields_click(field_name))

    def matching_fields_dropdown_click(self):
        self.click_on_element(AdminPageLocators.open_dropdown_fields_click("matching_fields"))

    def updatable_fields_dropdown_click(self):
        self.click_on_element(AdminPageLocators.open_dropdown_fields_click("updatable_fields"))

    def select_option_in_react_dropdown(self, text):
        self.click_on_element((AdminPageLocators.select_option_from_visible_dropdown(text)))

    def click_on_add_field_button(self, text):
        self.click_on_element((AdminPageLocators.click_add_field_button(text)))

    def click_give_access(self, text):
        self.click_on_element(AdminPageLocators.click_give_access_btn(text))

    def click_delete_user(self, text):
        self.click_on_element(AdminPageLocators.click_delete_user_btn(text))

    def get_field_constraints(self):
        constraints = self.find_elements(AdminPageLocators.FIELD_CONSTRAINT)
        arr = []
        for c in constraints:
            arr.append(
                {db_params.NAME: c.get_attribute("data-qa-name"), db_params.NEW_VALUE: c.get_attribute("data-qa-val")})
        return arr
