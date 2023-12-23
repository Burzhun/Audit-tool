from pages.base.common_elements_actions import CommonElementsPage
from pages.search.search_page_locators import SearchPageLocators
from params import db_params, texts


class SearchPage(CommonElementsPage):
    def set_input_value(self, placeholder, value, index=0):
        self.type_in_element(SearchPageLocators.get_filter_input(placeholder), value, index)

    def select_row_by_id(self, record_id, name=db_params.RECORD_ID):
        self.click_on_element((SearchPageLocators.get_row_by_cell_value(name, record_id)))

    def open_score_dropdown(self):
        self.click_on_element(SearchPageLocators.SCORE_DROPDOWN)

    def select_dropdown_input(self, text, index=0):
        self.click_on_element(SearchPageLocators.DROPDOWN_INPUT, index)
        self.select_option_by_text(text)

    def select_collection(self, collection_name):
        self.click_on_element(SearchPageLocators.COLLECTION_DROPDOWN)
        self.select_option_by_text(collection_name)

    def select_field(self, field_name=db_params.RECORD_ID, index=0):
        self.click_on_element(SearchPageLocators.FIELD_DROPDOWN, index)
        self.select_option_by_text(field_name)

    def select_operation(self, operation=texts.EQUAL_TO, index=0):
        if operation:
            self.click_on_element(SearchPageLocators.OPERATION_DROPDOWN, index)
            self.select_option_by_text(operation)

    def set_field_value(self, field_value, index=0, is_input=True):
        if is_input:
            self.type_in_element(SearchPageLocators.FIELD_VALUE_INPUT, field_value, index)
        else:
            self.click_on_element(SearchPageLocators.FIELD_VALUE_DROPDOWN, index)
            self.select_option_by_text(field_value)

    # todo: start with
    def add_field_drop(self):
        self.click_on_element(SearchPageLocators.ADD_COLUMN_DROPDOWN)

    def check_result_table_is_displayed(self):
        return True if self.check_element_is_displayed(SearchPageLocators.RESULT_TABLE) else False

    def add_search_param(self, index):
        self.click_on_element(SearchPageLocators.ADD_PARAM_BTN, index)
        # wait for next btn to appear:
        return self.check_element_is_displayed(SearchPageLocators.ADD_PARAM_BTN, index + 1)

    def get_cell_values(self, cell_name):
        cell_values = []
        els = self.find_elements((SearchPageLocators.get_cell(cell_name)))
        for el in els:
            cell_values.append(el.text)
        return cell_values

    def get_found_records_text(self):
        return self.get_el_text(SearchPageLocators.FOUND_RECORDS)

    def search_init(self):
        self.click_on_element(SearchPageLocators.SEARCH_BTN)

    def remove_filter_from_search(self, index):
        # get number of filters
        self.click_on_element(SearchPageLocators.FILTER_REMOVE_BTN, index)

    def select_mini_table_row(self, index):
        self.click_on_element(SearchPageLocators.MINI_TABLE_ROW, index)

    def select_selected_row_in_min_table(self, index):
        self.click_on_element(SearchPageLocators.TABLE_ROW_CLICKED, index)

    def get_selected_row_cell_value(self, row_number, cell_name):
        return self.get_el_text((SearchPageLocators.get_cell_value_of_selected_row(row_number, cell_name)))

    def check_row_cell_value(self, row_number, column_name, text):
        return self.text_present_in_element(
            (SearchPageLocators.get_cell_value_by_number_and_column_name(row_number, column_name)), text)

    def get_row_cell_value(self, row_number, column_name):
        return self.get_el_text((SearchPageLocators.get_cell_value_by_number_and_column_name(row_number, column_name)))

    def get_selected_rows_number(self):
        return self.count_elements(SearchPageLocators.TABLE_ROW_CLICKED)

    def get_number_of_rows_before_selected(self):
        return self.count_elements(SearchPageLocators.ROWS_BEFORE_SELECTED)

    def get_all_column_values(self, column_name):
        els = self.find_elements(SearchPageLocators.get_all_column_values(column_name))
        texts = []
        for el in els:
            texts.append(el.text)
        return texts

    def check_number_of_found_records_in_search(self, docs_number):
        return self.text_present_in_element(SearchPageLocators.FOUND_RECORDS,
                                            f"{docs_number} ") if docs_number != 0 else self.check_element_is_non_visible(
            SearchPageLocators.FOUND_RECORDS)

    def check_mini_search_filter_present(self, option, value):
        return self.check_element_is_displayed((SearchPageLocators.get_mini_filter(option, value)))

    def check_mini_search_filter_input_data(self, option, text, index=0):
        form_text = self.get_el_text((SearchPageLocators.get_mini_filter_set_data(option)), True, index)
        return True if text == form_text else False

    def go_to_last_page(self):
        self.click_on_element(SearchPageLocators.PRE_LAST_PAGE_SEARCH_TABLE)
        return self.check_element_is_non_visible(SearchPageLocators.NEXT_LINK_SEARCH_TABLE)

    def get_last_page_number(self):
        return int(self.get_el_text(SearchPageLocators.PRE_LAST_PAGE_SEARCH_TABLE))

    # todo: add check enter for any field
    def search_init_by_enter_btn(self):
        self.type_in_element(SearchPageLocators.get_filter_input(db_params.RECORD_ID), u'\ue007')

    def remove_column(self, column_name):
        self.click_on_element(SearchPageLocators.remove_btn(column_name))
        return False if self.check_element_is_displayed(SearchPageLocators.remove_btn(column_name)) else True

    def add_new_record(self, collection_name=None, displayed=True):
        if displayed:
            self.click_on_element(SearchPageLocators.ADD_NEW_RECORD)
            self.switch_to_tab(1, 1)
            return self.check_url_contains(f"{collection_name}/new/0")
        else:
            return self.check_element_is_non_visible(SearchPageLocators.ADD_NEW_RECORD)

    def get_input_field_value(self, index=0):
        return self.get_el_text(SearchPageLocators.FIELD_VALUE_INPUT, True, index)

    def set_search_filters(self, field_name=db_params.RECORD_ID, field_value=1, operation=texts.EQUAL_TO,
                           second_field_value=None, index=0, is_field_input=True, field_index=None):
        if field_index is None:
            field_index = index
        if field_name:
            self.select_field(field_name, index)
        if field_value:
            self.set_field_value(field_value, field_index, is_field_input)
        if operation:
            self.select_operation(operation, index)
        if operation == texts.BETWEEN:
            if second_field_value:
                self.set_field_value(second_field_value, index + 1, is_field_input)

    def add_column(self, column_name):
        self.click_on_element(SearchPageLocators.ADD_COLUMN_DROPDOWN)
        self.select_option_by_text(column_name)
        self.add_field_btn_click()
        return self.check_element_is_displayed(SearchPageLocators.remove_btn(column_name))

    def get_add_column_values(self):
        self.click_on_element(SearchPageLocators.ADD_COLUMN_DROPDOWN)
        return self.get_options_list()
