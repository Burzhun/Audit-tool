from selenium.webdriver.common.by import By

from pages.base.common_elements_locators import CommonElementsLocators


class ValidationPageLocators:
    SAVE_BTN = "button[data-qa=save]"
    SAVE_IMG_BTN = "button[data-qa=save-img]"
    CAL_MONTH_AND_YEAR = "th.rdtSwitch"
    CAL_BACK = "th.rdtPrev"
    CAL_FORWARD = "th.rdtNext"
    NOTIFICATION = (By.XPATH, "//div[contains(text(),'Not satisfied')]")
    TABLE_ROW = "tbody tr"
    TABLE_BODY = "tbody"
    TABLE_CELL_NAME = "tr>td[name=name]"
    SUB_DOCUMENT_HEADER = "div.array_field_title"
    SCORE_FIELD = "div[data-qa=confidenceScore]>div"
    DROPDOWN_SCORE = "[data-qa=select-confidence-score]"
    SCORE_COMMENT_INPUT = "input#confidence_score"
    REPLACE_BTN = "button[data-qa*=Replace]"
    EDIT_BTN = "button[data-qa=edit]"
    REMOVE_BTN = "button[data-qa=remove]"
    CANCEL_BTN = "button[data-qa=cancel]"
    LOAD_IMG_BTN = "button[data-qa*=Load]"
    LOAD_IMG_INPUT = "div.image_buttons > input"
    IMAGE_FIELDS = "div.ui.vertical.menu a"
    IMG_PLACE = "div#image_div_id"
    NOTIFICATION_REQUIRED_FIELD = (By.XPATH, "//div[contains(text(),'This field is required')]")
    ADD_IMG = (By.LINK_TEXT, "+")
    DRAWING_CANVAS = ".upper-canvas"
    ACTIVE_CATEGORY = f"{IMAGE_FIELDS}.active.item"
    IMAGE_BASE64 = "#image_id"
    TIME_SELECT = "td.rdtTimeToggle"
    UTC_DROPDOWN = "div[class*=timezone_picker][aria-disabled=false]"
    ADD_BTN = "button[data-qa=add-field]"
    SHOW_FIELDS_BTN = "button[data-qa=show-fields]"
    AUDIT_POPOVER = "div[data-qa=updated-field]"
    SELECTED_TO_EDIT_ROW_SUB_RANGE = "tr.array_row_top_border.selected_array_row"
    STICKY_HEADER = "div.sticky-header"
    COPY_RECORD_BTN = "button[data-qa=copy-record]"
    TEXT_ON_CONFIDENCE_SCORE = ".footer>div"
    TEXT_ON_NOTE_ON_CONFIDENCE_SCORE = ".footer>div:nth-child(2)"
    CURRENT_STATE_CELL = "td[name=value]"
    SELECTED_CONFIDENCE_SCORE = "div[data-qa=select-confidence-score]"
    AUTO_UPDATED_FIELDS = "div[data-qa=auto-updated-fields]"
    MANUAL_OVERRIDE_FIELDS = "div[data-qa=manual-override-fields]"
    ACTIVE_CALENDAR_DATE = "td.rdtDay.rdtActive"
    SEARCH_BAR = "div[data-qa-type=search-bar]"
    ADD_TRANSFORMATION_BTN = "button[data-qa=add-transformation-btn]"
    SELECT_FUNCTION_DROPDOWN = "div[data-qa='select-function']"
    UPDATED_FIELD_DROPDOWN = "div[data-qa=updated-field]"
    SET_FUNCTION_TEXTAREA = "[data-qa=set-function]"
    FUNCTION_COMMENT_INPUT = "div[data-qa=function-comment] > input"
    SAVE_FUNCTION_NAME_INPUT = "div[data-qa=save-function-name] > input"
    SAVE_FUNCTION_BTN = "button[data-qa=save-btn]"
    CANCEL_FUNCTION_BTN = "button[data-qa=cancel-btn]"
    APPLY_FUNCTION_BTN = "button[data-qa=apply-btn]"
    ERROR_MSG = "[data-qa='error-msg']"
    CALENDAR_MONTH = "td.rdtMonth"
    CALENDAR_TIME = "div.rdtCount"
    ADD_RANGE_ELEMENT = "[data-qa=add-new-element]"
    DELETE_RANGE_ELEMENT = "[data-qa=delete-element]"

    @staticmethod
    def disabled_dropdown(field):
        return f"tr[@id='{field}'] div.ui.disabled.selection.dropdown"

    @staticmethod
    def el_to_be_added(text):
        return By.XPATH, f"//span[text()='{text}']/parent::div"

    @staticmethod
    def selected_item_from_multidrop(item):
        return By.XPATH, f"//a[contains(text(),'{item}')]"

    @staticmethod
    def selected_item_from_multidrop_by_div(item):
        return By.XPATH, f"//div[contains(text(),'{item}')]"

    @staticmethod
    def date_from_month(date):
        return By.XPATH, f"//reach-portal/descendant::td[@class='rdtDay' and text()='{date}']"

    @staticmethod
    def cal_dropdown(field, table_name):
        return f"[id*=array_input_field_date{table_name}][id*=masked][name='{field}']" if table_name else f"[id*=input_field_date{field}][id*=masked]"

    @staticmethod
    def get_dropdown(field):
        return f"tr[id='{field}'] div.dropdown"

    @staticmethod
    def get_updated_data_cell_dropdown_field(field, row_id=None):
        return f"[id='{field}'] input#react-select-8-input" if row_id else f"tr#{field} td.updated_data_cell"

    @staticmethod
    def get_cell_value(field):
        return f"tr[id='{field}'] td[name='value']"

    @staticmethod
    def get_audit_btn(field, field_row=None):
        if field_row:
            locator = f"[id='{field_row}'] td[name='{field}']"
        else:
            locator = f"[id='{field}']"
        return f"{locator} button[data-qa=audit-info]"

    @staticmethod
    def field_notification(field, table_name=None):

        return f"table[name='{table_name}'] div.error_message[name='{field}']" if table_name else f"tr[id='{field}'] td.updated_data_cell"

    @staticmethod
    def get_just_added_rows(table_name):
        return f"table[name='{table_name}'] tr.just_added_array_field"

    @staticmethod
    def get_image_tab(image_number):
        return By.XPATH, f"//a[contains(text(),'Image {image_number}')]"

    @staticmethod
    def new_field_value(field, dt=False):
        return f"[id*=input_field][id*={field}][id*=masked]" if dt else f"div[data-qa=new-value] > [id*={field}]"

    @staticmethod
    def field_comment(field):
        return f"#input_field_comment{field}"

    @staticmethod
    def get_img_category(name):
        return By.XPATH, f"//div[@class='ui vertical menu']//a[text()='{name}']"

    @staticmethod
    def get_img_by_base64(base64):
        return f"img[src='{base64}']"

    @staticmethod
    def set_time(up, down):
        return By.XPATH, f"//div[@class='rdtCounter'][{up}]/span[@class='rdtBtn'][{down}]"

    @staticmethod
    def get_utc_option(diff):
        return By.XPATH, f"//div[@class='visible menu transition']//span[text()='UTC {diff}']/parent::div"

    @staticmethod
    def get_time(el):
        return By.XPATH, f"(//div[@class='rdtCount'])[{el}]"

    @staticmethod
    def get_row_by_id(row_id):
        return f"tr[id='{row_id}']"

    @staticmethod
    def get_div_row_by_id(row_id):
        return By.XPATH, f"//tr[@id='{row_id}']"

    @staticmethod
    def get_sub_field_dropdown(field_name, row_id=None):
        return f"tr[id='{row_id}'] div.search.selection.dropdown[name='{field_name}']" if row_id else f"tr#{field_name} > td.updated_data_cell > div"

    @staticmethod
    def get_new_value_sub_table_input(table_name, field):
        return f"table[name='{table_name}'] input[name='{field}']"

    @staticmethod
    def get_sub_table_rows(table_name):
        return f"table[name='{table_name}'] tbody tr[id]"

    @staticmethod
    def add_field_to_sub_table_btn(table_name):
        return By.XPATH, f"//table[@name='{table_name}']/ancestor::div[@class='detail_table_array']//button[text()='Add field']"

    @staticmethod
    def get_validate_option(option):
        if option is None:
            src = "base64"
        elif option is True:
            src = "checkmark"
        elif option is False:
            src = "delete"
        return f"{CommonElementsLocators.VISIBLE_MENU_TRANSITION} img[src*={src}]"

    @staticmethod
    def sub_table_columns(table):
        return f"table[name='{table}'] > thead"

    @staticmethod
    def get_sub_table_row_values(table, row_id):
        return f"tr#{table}{row_id}"

    @staticmethod
    def remove_row_icon(row_id):
        return f"tr[id='{row_id}'] i.remove.circle.icon"

    @staticmethod
    def marked_removed(row_id):
        return f"tr[id='{row_id}'].deleted_array_field"

    @staticmethod
    def dropdown_sub_range_name(row_id, field_name):
        return f"tr[id='{row_id}'] div[class*=array_row_valid_select][name={field_name}]"

    @staticmethod
    def add_sub_range_record(table_name):
        return f"div[data-qa='{table_name}'] ~ div button[data-qa=add-record]"

    @staticmethod
    def get_utc_dropdown(field_name, table_name=None, row_id=None):
        return f"table[name='{table_name}'] tr#{row_id} div[class*=timezone_picker][name='{field_name}']" if table_name else f"tr#{field_name} div[class*=timezone_picker][aria-disabled=false]"

    @staticmethod
    def hide_table_btn(table_name):
        return f"div[data-qa='{table_name}'] ~ div button[data-qa=hide-table"

    @staticmethod
    def sub_table_name(table_name):
        return f"div.detail_table_array div[data-qa='{table_name}']"

    @staticmethod
    def get_sub_fields_names(table_name):
        return f"table[name='{table_name}'] th"

    @staticmethod
    def get_sub_table_cell(row_id, cell_index):
        # +1 is set as first value is remove button
        return By.XPATH, f"//tr[@id='{row_id}']/td[{cell_index + 1}]"

    @staticmethod
    def selected_row_id(table_name):
        return f"table[name='{table_name}'] tr.array_row_top_border.selected_array_row"

    @staticmethod
    def get_low_level_cell(row_id, field, table_name):
        return f"table[name='{table_name}'] tr[id='{row_id}'] td[name='{field}']"

    @staticmethod
    def get_middle_screen_cell_with_value(field):
        return By.XPATH, f"//b[text()='{field}']/following-sibling::span"

    @staticmethod
    def get_filter_input_for_sub_table_column(column_name):
        return f"div[data-qa='{column_name}'] input"

    @staticmethod
    def get_column_values_for_sub_table(table_name, column_name):
        return f"table[name='{table_name}'] td[name='{column_name}']"

    @staticmethod
    def get_table_header_span(table_name, column_name):
        return f"table[name='{table_name}'] span[data-qa='{column_name}']"

    @staticmethod
    def get_table_header_div(table_name, column_name):
        return f"table[name='{table_name}'] th[data-qa='{column_name}']"

    @staticmethod
    def dropdown_for_sub_table(table_name):
        return f"div[data-qa='{table_name}'] + span div[data-qa=add-field]"

    @staticmethod
    def dropdown_for_sub_table_items(table_name):
        return f"div[data-qa='{table_name}'] + span div[data-qa=add-field] div[role=option] span"

    @staticmethod
    def bulk_changes_checkbox(table_name, row_id, field_name):
        input_id = row_id.replace(table_name, "")
        return f"table[name='{table_name}'] input[id='{input_id}{field_name}']"

    @staticmethod
    def remove_column_from_sub_field_icon(table_name, column_name):
        return f"{ValidationPageLocators.get_table_header_div(table_name, column_name)} div.remove_field_button"

    @staticmethod
    def get_api_link_from_sub_table(table_name, column_name):
        return f"{ValidationPageLocators.get_column_values_for_sub_table(table_name, column_name)} a"

    @staticmethod
    def download_file_btn(file_name):
        return f"button[data-qa='Download file {file_name}']"

    @staticmethod
    def updated_field_value(cell_name, table_name=None, row_id=None):
        common_path = f"//span[contains(@class, indicatorSeparator)]/following-sibling::div[contains(@class, 'indicatorContainer')]"
        return By.XPATH, f"//table[@name='{table_name}']//tr[@id='{row_id}']//span/following-sibling::div[@name='{cell_name}']/preceding-sibling::span{common_path}" if table_name else f"//tr[@id='{cell_name}']/td[@class='updated_data_cell']{common_path}"

    @staticmethod
    def get_sub_field_new_value(row_id, cell_name, is_dropdown=True):
        return By.XPATH, f"//tr[@id='{row_id}']//div[@name='{cell_name}']/preceding-sibling::span//div[contains(@class, 'container')]" if is_dropdown else f"//tr[@id='{row_id}']//div[@name='{cell_name}']/preceding-sibling::div/input"

    @staticmethod
    def get_hof_new_value(cell_name, is_dropdown=True):
        return f"tr[id='{cell_name}'] td.updated_data_cell> span>div[class*='container']" if is_dropdown else f"tr[id='{cell_name}'] td.updated_data_cell input"

    @staticmethod
    def get_move_icon_sub_table(table, column, to_right=True):
        icon = "right" if to_right else "left"
        return f"""{ValidationPageLocators.get_table_header_div(table, column)} i.{icon}"""
