import os
import time
from datetime import datetime
from pages.base.common_elements_actions import CommonElementsPage
from pages.base.common_elements_locators import CommonElementsLocators
from pages.validation.validation_page_locators import ValidationPageLocators
from params import texts
from selenium.webdriver import ActionChains


class ValidationPage(CommonElementsPage):
    def set_dropdown_is_valid(self, field, valid, index=0):
        self.click_on_element(ValidationPageLocators.get_dropdown(field), index)
        self.select_validate_option(valid)

    def select_validate_option(self, valid):
        self.click_on_element(ValidationPageLocators.get_validate_option(valid))

    def set_new_valid_value(self, field, value, index=0, dt=False):
        self.type_in_element(ValidationPageLocators.new_field_value(field, dt), value, index)

    def set_comment(self, field, comment, index=0):
        self.type_in_element(ValidationPageLocators.field_comment(field), comment, index)

    def save_form_changes(self):
        self.click_on_element(ValidationPageLocators.SAVE_BTN)

    def set_utc_diff(self, diff, field_name, row_id=None, table_name=None, index=0):
        if diff > 0:
            diff = f"+ {diff}"
        self.click_on_element(ValidationPageLocators.get_utc_dropdown(field_name, table_name, row_id), index)
        self.click_on_element((ValidationPageLocators.get_utc_option(diff)))

    def open_list_for_dropdown_fields(self, sub_field_name=None, row_id=None):
        self.click_on_element(ValidationPageLocators.get_sub_field_dropdown(sub_field_name, row_id))

    def open_doc_list_for_dropdown_fields(self, sub_field_name=None, row_id=None):
        self.click_on_element(
            ValidationPageLocators.get_updated_data_cell_dropdown_field(sub_field_name, row_id=row_id))

    def select_value_input(self, text, cell_name=None, row_id=None, table_name=None, index=0):
        self.set_updated_dropdown_value(cell_name, row_id, table_name, index)
        # check if array, then multiple to be selected:
        # todo: add check on sub-range
        if text is not None:
            if isinstance(text, (list, tuple)):
                for i in text:
                    self.select_option_by_text(i, True)
                    # todo: handle
                    # self.check_element_is_displayed((ValidationPageLocators.selected_item_from_multidrop(i)))
                    self.check_element_is_displayed((ValidationPageLocators.selected_item_from_multidrop_by_div(i)))
            else:
                self.select_option_by_text(text, True)

    def open_calendar(self, field_name, table_name=None, index=0):
        self.click_on_element(ValidationPageLocators.cal_dropdown(field_name, table_name), index)

    def select_cal_date_and_time(self, field_name, date, month, year, errors, caltime=None, table_name=None, index=0):
        self.open_calendar(field_name, table_name, index)
        if caltime != "12:00 PM" and caltime is not None:
            hours = int(caltime[:2])
            minutes = int(caltime[3:5])
            am_pm = caltime[-2:]
            # select time:
            time_sel = self.find_clickable_element(ValidationPageLocators.TIME_SELECT)
            time_sel.click()
            form_hours = int(self.get_el_text(ValidationPageLocators.CALENDAR_TIME, index=0))
            form_minutes = int(self.get_el_text(ValidationPageLocators.CALENDAR_TIME, index=1))
            minutes_back = self.find_clickable_element((ValidationPageLocators.set_time(2, 2)))
            minutes_forward = self.find_clickable_element((ValidationPageLocators.set_time(2, 1)))
            if form_minutes == 0 and form_hours == 12:
                # check changing hours when listing back:
                minutes_back.click()
                form_minutes = int(self.get_el_text(ValidationPageLocators.CALENDAR_TIME, index=1))
                form_hours = int(self.get_el_text(ValidationPageLocators.CALENDAR_TIME, index=0))
                if form_minutes != 59 and form_hours != 11:
                    errors.append(f"expected displayed 11:59 after change, got: {form_hours}:{form_minutes}")
                # set back:
                minutes_forward.click()
            form_am_pm = self.get_el_text(ValidationPageLocators.CALENDAR_TIME, index=2)
            # get again value 00
            form_minutes = int(self.get_el_text(ValidationPageLocators.CALENDAR_TIME, index=1))
            minutes_diff = minutes - form_minutes
            if minutes_diff > 0:
                for _ in range(abs(minutes_diff)):
                    minutes_forward.click()
            elif minutes_diff < 0:
                for _ in range(abs(minutes_diff)):
                    minutes_back.click()
            # check time is ok:
            form_minutes = self.text_present_in_element((ValidationPageLocators.get_time(2)), str(minutes))
            if form_minutes is False:
                errors.append(f"minutes to be selected: {minutes}")
            form_hours = int(self.get_el_text(ValidationPageLocators.CALENDAR_TIME, index=0))
            hours_diff = form_hours - hours
            hours_forward = self.find_clickable_element((ValidationPageLocators.set_time(1, 1)))
            hours_backward = self.find_clickable_element((ValidationPageLocators.set_time(1, 2)))
            if hours_diff < 0:
                for _ in range(abs(hours_diff)):
                    hours_forward.click()
            elif hours_diff > 0:
                for _ in range(abs(hours_diff)):
                    hours_backward.click()

            # check hours text:
            form_hours = self.text_present_in_element((ValidationPageLocators.get_time(1)), str(hours))
            if form_hours is False:
                errors.append(f"hours to be selected: {hours}")
            # check am/pm:
            form_am_pm = self.get_el_text(ValidationPageLocators.CALENDAR_TIME, index=2)
            if form_am_pm.lower() != am_pm.lower():
                am_pm_forward = self.find_clickable_element((ValidationPageLocators.set_time(3, 1)))
                am_pm_backward = self.find_clickable_element((ValidationPageLocators.set_time(3, 2)))
                am_pm_backward.click()
                # check switching is ok:
                if self.text_present_in_element((ValidationPageLocators.get_time(3)), am_pm) is False:
                    errors.append(f"expected switching to {am_pm}")
                for _ in range(2):
                    am_pm_forward.click()
                if self.text_present_in_element((ValidationPageLocators.get_time(3)), am_pm.upper()) is False:
                    errors.append(f"expected switching to {am_pm}")
            # return to calendar pick:
            switcher = self.find_element(ValidationPageLocators.CAL_MONTH_AND_YEAR)
            switcher.click()
        if date and month and year:
            switcher = self.find_element(ValidationPageLocators.CAL_MONTH_AND_YEAR)
            cal_text = switcher.text
            cal_date = datetime.strptime(cal_text, '%B %Y')
            if year == cal_date.year and cal_date.month == month:
                pass
            elif year != cal_date.year:
                # onclick on cal_text
                switcher.click()
                year_diff = year - cal_date.year
                if year_diff > 0:
                    click_item = self.find_element(ValidationPageLocators.CAL_FORWARD)
                else:
                    click_item = self.find_element(ValidationPageLocators.CAL_BACK)
                for _ in range(abs(year_diff)):
                    click_item.click()
                # select month then
                sel_mo = self.find_elements(ValidationPageLocators.CALENDAR_MONTH)[month - 1]
                sel_mo.click()
            elif year == cal_date.year and cal_date.month != month:
                month_diff = month - cal_date.month
                if month_diff > 0:
                    click_item = self.find_element(ValidationPageLocators.CAL_FORWARD)
                else:
                    click_item = self.find_element(ValidationPageLocators.CAL_BACK)
                for _ in range(abs(month_diff)):
                    click_item.click()
            date_to_sel = self.find_element((ValidationPageLocators.date_from_month(date)))
            date_to_sel.click()
        return errors

    def get_notification(self, field, table_name=None):
        try:
            text = self.get_el_text(ValidationPageLocators.field_notification(field, table_name))
            return True if texts.NOT_ALLOWED_DATA or texts.NOT_SATISFIED in text else False
        except IndexError:
            return False

    def get_text_from_fields_with_sub_range(self):
        names = []
        els = self.find_elements(ValidationPageLocators.SUB_DOCUMENT_HEADER)
        if els:
            for el in els:
                names.append(el.text)
        return names

    def get_column_name_from_tr(self, index=None):
        if index:
            try:
                return self.find_elements(ValidationPageLocators.TABLE_CELL_NAME)[index].text
            except IndexError:
                return False
        else:
            row_names = self.find_elements(ValidationPageLocators.TABLE_CELL_NAME)
            list_of_names = []
            if row_names:
                for i in row_names:
                    list_of_names.append(i.text)
            return list_of_names

    def check_updated_field_not_validated(self, field_name):
        if self.check_element_is_non_visible(ValidationPageLocators.get_dropdown(field_name)):
            return True
        else:
            return False

    def get_cell_val_by_name(self, name, row_id=None, table_name=None):
        locator = ValidationPageLocators.get_low_level_cell(row_id, name,
                                                            table_name) if row_id else ValidationPageLocators.get_cell_value(
            name)
        return self.get_el_text(locator)

    def check_cell_value(self, name, value, row_id=None, table_name=None):
        if value is None:
            value = ''
        else:
            value = str(value)
        return self.text_present_in_element(ValidationPageLocators.get_low_level_cell(row_id, name, table_name),
                                            value) if row_id else self.text_present_in_element(
            ValidationPageLocators.get_cell_value(name),
            value)

    def check_audit_btn(self, field, row_id=None):
        return self.check_element_is_displayed(
            ValidationPageLocators.get_audit_btn(field, row_id))

    def open_score_list(self):
        self.click_on_element(ValidationPageLocators.DROPDOWN_SCORE)

    def set_score(self, score):
        self.open_score_list()
        self.select_option_by_text(score)

    def get_score_field(self):
        return self.get_el_text(ValidationPageLocators.SCORE_FIELD)

    def get_current_doc_score(self):
        return self.get_el_text(ValidationPageLocators.SELECTED_CONFIDENCE_SCORE)

    # todo: start with
    def set_score_comment(self, comment):
        score_comment = self.find_element(ValidationPageLocators.SCORE_COMMENT_INPUT)
        score_comment.clear()
        score_comment.send_keys(str(comment))

    def get_score_comment(self):
        return self.find_element(ValidationPageLocators.SCORE_COMMENT_INPUT).get_attribute('value')

    def get_img_from_category(self, name):
        self.click_on_element((ValidationPageLocators.get_img_category(name)))

    def get_all_img_categories(self):
        el_list = self.find_elements(ValidationPageLocators.IMAGE_FIELDS)
        arr = []
        for el in el_list:
            arr.append(el.text)
        return arr

    def file_upload(self, file):
        self.type_in_element(ValidationPageLocators.LOAD_IMG_INPUT, file, clear=False)

    def upload_img(self, action=False, img=None):
        upload_btn = self.find_element(ValidationPageLocators.LOAD_IMG_BTN)
        if upload_btn:
            if action:
                self.file_upload(img)
                # check image was uploaded:
                self.check_element_is_non_visible(ValidationPageLocators.LOAD_IMG_BTN)
                return self.check_element_is_displayed(ValidationPageLocators.IMG_PLACE)
            else:
                return True
        else:
            return False

    def check_img_displayed(self):
        return self.check_element_is_displayed(ValidationPageLocators.IMG_PLACE)

    # action: None - check element is present, False - edit and cancel, True - save result on form
    def edit_img(self, action=None):
        self.img_btn_handle("edit", 2)
        self.draw()
        if action is True:
            self.img_btn_handle("save", 2)
        else:
            self.img_btn_handle("cancel", 2)

    def remove_img(self, action=False):
        if action:
            number_of_tabs_before_upd = self.check_number_of_img_in_category()
            self.click_on_element(ValidationPageLocators.REMOVE_BTN)
            # check that number of images decreased to -1 on form. Check load image is displayed in tab:
            self.check_element_is_displayed(ValidationPageLocators.LOAD_IMG_BTN)
            number_of_tabs_after_upd = self.check_number_of_img_in_category()
            if number_of_tabs_before_upd != number_of_tabs_after_upd + 1:
                return False
            else:
                return True
        else:
            return self.check_element_is_displayed(ValidationPageLocators.REMOVE_BTN)

    def check_required_notif(self):
        return self.check_element_is_displayed(ValidationPageLocators.NOTIFICATION_REQUIRED_FIELD)

    def check_number_of_img_in_category(self):
        els = self.find_all_links("Image")
        return len(els) if els else 0

    def get_image_attributes(self, image_number):
        self.click_on_element((ValidationPageLocators.get_image_tab(image_number)))
        # check tab is active now:
        return self.check_element_is_active((ValidationPageLocators.get_image_tab(image_number)))

    def draw(self):
        element = self.find_element(ValidationPageLocators.DRAWING_CANVAS)
        actions = ActionChains(self.browser)
        actions.move_to_element(element).click_and_hold().perform()

    # todo: start with
    def get_active_category_name(self):
        return self.get_el_text(ValidationPageLocators.ACTIVE_CATEGORY)

    def get_img_base64(self):
        return self.get_element_attribute(ValidationPageLocators.IMAGE_BASE64, "src")

    def check_img_base64_changed(self, base64):
        return self.check_element_is_non_visible(ValidationPageLocators.get_img_by_base64(base64))

    def img_saved(self):
        return self.check_element_is_non_visible(ValidationPageLocators.SAVE_IMG_BTN)

    def check_table_displayed(self, table_name):
        return self.check_element_is_displayed(ValidationPageLocators.sub_table_name(table_name))

    def get_sub_range_fields_and_values(self, block, sub_doc_id):
        table_columns = self.get_sub_range_column_names(block)
        # get all values for columns:
        cell_val = self.find_element(ValidationPageLocators.get_sub_table_row_values(block, sub_doc_id))
        vals = cell_val.text.split('\n')[1:]
        return dict(zip(table_columns, vals))

    def add_btn_handle(self):
        self.find_clickable_element(ValidationPageLocators.ADD_BTN).click()

    # disabled: True - is disabled, False - enabled, None - not present on form
    def check_dropdown(self, field, row_id=None):
        if "parent" in field:
            return self.check_element_is_displayed(ValidationPageLocators.dropdown_sub_range_name(row_id, field))
        else:
            return self.check_element_is_displayed(ValidationPageLocators.disabled_dropdown(field))

    def get_sub_range_column_names(self, block):
        thead = self.find_element(ValidationPageLocators.sub_table_columns(block))
        return thead.text.split('\n')

    def validate_sub_field(self, field_id, name, valid):
        self.click_on_element(ValidationPageLocators.dropdown_sub_range_name(field_id, name))
        self.select_validate_option(valid)

    def verify_selected_row(self, table_name):
        return self.check_element_is_displayed(ValidationPageLocators.add_sub_range_record(table_name))

    def select_sub_table_row_by_id(self, row_id):
        self.find_element(ValidationPageLocators.get_row_by_id(row_id)).click()
        # check that element border is visible now:
        if self.check_element_is_displayed(ValidationPageLocators.SELECTED_TO_EDIT_ROW_SUB_RANGE):
            return True
        else:
            return False

    def set_new_subrange_value(self, table_name, field_name, value):
        self.type_in_element(ValidationPageLocators.get_new_value_sub_table_input(table_name, field_name), value)

    def remove_sub_table_row(self, row_id):
        self.click_on_element(ValidationPageLocators.remove_row_icon(row_id))
        # check it's class:
        self.check_element_is_displayed(ValidationPageLocators.marked_removed(row_id))

    def get_all_ids_from_field_with_sub_ranges(self, table_name):
        els = self.find_elements(ValidationPageLocators.get_sub_table_rows(table_name))
        ids = []
        for el in els:
            ids.append(el.get_attribute("id"))
        return ids

    def get_selected_row_id(self, table_name):
        return self.get_element_attribute(ValidationPageLocators.selected_row_id(table_name), "id")

    def add_sub_range_row(self, table_name):
        self.click_on_element(ValidationPageLocators.add_sub_range_record(table_name))
        # check row appears:
        return self.verify_selected_row(table_name)

    def add_new_sub_range_record(self, user_data, doc_config):
        errors = []
        for param in user_data:
            errors += self.validate_field(param, doc_config, True)

    def hide_table(self, table_name):
        self.click_on_element(ValidationPageLocators.hide_table_btn(table_name))
        return self.check_element_is_non_visible(ValidationPageLocators.hide_table_btn(table_name))

    def remove_fixed_elements(self):
        # wait for page is loaded:
        if self.check_element_is_displayed(ValidationPageLocators.STICKY_HEADER):
            self.browser.execute_script(
                "let fixedElements = [...document.body.getElementsByTagName('*')].filter(x => "
                "getComputedStyle(x, null).getPropertyValue('position') === 'fixed' || "
                "getComputedStyle(x, null).getPropertyValue('position')==='sticky');"
                "fixedElements.forEach(el=>{"
                "el.style.position='static'});")

    def get_index_of_sub_table_header(self, table_name, field_name):
        cells = []
        els = self.find_elements(ValidationPageLocators.get_sub_fields_names(table_name))
        for el in els:
            cells.append(el.text)
        return cells.index(field_name)

    def check_cell_style(self, row_id, cell_index):
        cell_class = self.get_element_attribute((ValidationPageLocators.get_sub_table_cell(row_id, cell_index)),
                                                "class")
        if "updated_array_cell" in cell_class:
            return True
        else:
            return False

    def get_just_added_row(self, table_name, row_number):
        self.click_on_element(ValidationPageLocators.get_just_added_rows(table_name), row_number - 1)


    def show_middle_screen(self):
        self.click_on_element(ValidationPageLocators.SHOW_FIELDS_BTN)

    def get_middle_screen_cell_value(self, field):
        return self.get_el_text((ValidationPageLocators.get_middle_screen_cell_with_value(field)))

    def get_class_of_low_level_table_row(self, row_id):
        return self.get_element_attribute(ValidationPageLocators.get_row_by_id(row_id), "class")

    def get_cell_value_by_row_number_and_column_name(self, table_name, row_number, column_name):
        return self.get_el_text(
            ValidationPageLocators.get_column_values_for_sub_table(table_name, column_name), index=row_number - 1)

    def copy_record(self):
        self.click_on_element(ValidationPageLocators.COPY_RECORD_BTN)

    def get_audit_info(self, field, row_id=None):
        self.click_on_element(ValidationPageLocators.get_audit_btn(field, row_id))
        return self.get_el_text(ValidationPageLocators.AUDIT_POPOVER)

    def check_text_on_confidence_score(self, text):
        return self.get_el_text(ValidationPageLocators.TEXT_ON_CONFIDENCE_SCORE)

    def check_text_on_note_on_confidence_score(self, text):
        return self.get_el_text(ValidationPageLocators.TEXT_ON_NOTE_ON_CONFIDENCE_SCORE)

    def set_sub_table_column_filter(self, column_name, filter_value):
        self.type_in_element(ValidationPageLocators.get_filter_input_for_sub_table_column(column_name), filter_value)

    def get_column_values(self, table_name, column_name):
        """
        Method to find column values for the table
        :return: array of text elements
        """
        column_val = []
        els = self.find_elements(ValidationPageLocators.get_column_values_for_sub_table(table_name, column_name))
        if els:
            for el in els:
                column_val.append(el.text)
        return column_val

    def get_cell_color_by_name(self, name, row_id=None, table_name=None):
        locator = ValidationPageLocators.get_low_level_cell(row_id, name,
                                                            table_name) if row_id else ValidationPageLocators.get_cell_value(
            name)
        return self.get_css_property(locator, 'background-color')

    def check_column_name_is_visible(self, table_name, column_name):
        text_size = self.get_element_size(ValidationPageLocators.get_table_header_span(table_name, column_name))
        cell_size = self.get_element_size(ValidationPageLocators.get_table_header_div(table_name, column_name))
        return True if cell_size["width"] > text_size["width"] and cell_size["height"] > text_size[
            "height"] else False

    def check_cells_styling(self, text_prop):
        errors = []
        els = self.find_elements(ValidationPageLocators.CURRENT_STATE_CELL)
        for el in els:
            if el.value_of_css_property("text-align") != text_prop:
                errors.append(False)
        return True if errors == [] else False

    def dropdown_sub_table_select(self, table_name):
        self.click_on_element(ValidationPageLocators.dropdown_for_sub_table(table_name))

    def set_bulk_changes_checkbox(self, table_name, row_id, field_name, check):
        el = self.find_element(ValidationPageLocators.bulk_changes_checkbox(table_name, row_id, field_name))
        if el:
            if (el.is_selected() and not check) or (not el.is_selected() and check):
                el.click()
                return True if (check and self.is_element_selected(
                    ValidationPageLocators.bulk_changes_checkbox(table_name, row_id, field_name), check)) or (
                                       not check and self.is_element_selected(
                                   ValidationPageLocators.bulk_changes_checkbox(table_name, row_id, field_name),
                                   check)) else False

    def get_time_from_calendar(self):
        return self.get_el_text(ValidationPageLocators.TIME_SELECT)

    def get_time_from_input(self, table_name, field_name):
        return self.get_el_text(ValidationPageLocators.get_new_value_sub_table_input(table_name, field_name), True)

    def get_auto_updated_fields(self):
        return self.get_el_text(ValidationPageLocators.AUTO_UPDATED_FIELDS)

    def get_manual_override_fields(self):
        return self.get_el_text(ValidationPageLocators.MANUAL_OVERRIDE_FIELDS)

    def add_sub_table_field(self, table_name, field_name):
        self.dropdown_sub_table_select(table_name)
        self.select_option_by_text(field_name)
        self.add_sub_field_btn_click(table_name)

    def remove_column_from_sub_field(self, table_name, column_name):
        self.click_on_element(ValidationPageLocators.remove_column_from_sub_field_icon(table_name, column_name))
        return self.check_element_is_non_visible(
            ValidationPageLocators.remove_column_from_sub_field_icon(table_name, column_name))

    def add_sub_field_btn_click(self, table_name):
        self.click_on_element((ValidationPageLocators.add_field_to_sub_table_btn(table_name)))

    def get_calendar_widget_date(self):
        month_and_year = self.get_el_text(ValidationPageLocators.CAL_MONTH_AND_YEAR)
        day = self.get_el_text(ValidationPageLocators.ACTIVE_CALENDAR_DATE)
        return datetime.strptime(f"{day} {month_and_year}", "%d %B %Y")

    def get_calendar_input_value(self, field, table_name=None):
        return self.get_el_text(ValidationPageLocators.cal_dropdown(field, table_name),
                                True)

    def bulk_checkbox_present(self, table_name, row_id, field_name):
        return self.check_element_is_displayed(
            ValidationPageLocators.bulk_changes_checkbox(table_name, row_id, field_name))

    def check_api_link_clickable(self, table_name, column_name):
        arr = []
        els = self.find_elements(ValidationPageLocators.get_api_link_from_sub_table(table_name, column_name))
        for el in els:
            if el.text != el.get_attribute("href"):
                arr.append(False)
        return True if False not in arr else False

    def get_on_hover_field_hint(self, field, table_name=None, row_id=None, ):
        if table_name:
            el = self.find_element(ValidationPageLocators.get_low_level_cell(row_id, field, table_name))
        else:
            el = self.find_element(ValidationPageLocators.get_cell_value(field))
        self.on_hover_element(el)
        # huck click on el:
        hint = self.get_hint_text()
        self.click_on_element(CommonElementsLocators.BODY)
        return hint

    def check_dropdown_disabled(self, field_name, row_id):
        attributes = self.get_element_attribute(ValidationPageLocators.dropdown_sub_range_name(row_id, field_name),
                                                "class")
        return True if "disabled" in attributes else False

    def img_btn_handle(self, btn_name, action):
        if btn_name == "load":
            if action == 0:
                return self.check_element_is_non_visible(ValidationPageLocators.LOAD_IMG_BTN)
            elif action == 1:
                return self.check_element_is_displayed(ValidationPageLocators.LOAD_IMG_BTN)
            elif action == 2:
                self.find_element(ValidationPageLocators.LOAD_IMG_BTN).click()
        elif btn_name == "edit":
            if action == 0:
                return self.check_element_is_non_visible(ValidationPageLocators.EDIT_BTN)
            elif action == 1:
                return self.check_element_is_displayed(ValidationPageLocators.EDIT_BTN)
            elif action == 2:
                self.find_element(ValidationPageLocators.EDIT_BTN).click()
        elif btn_name == "replace":
            if action == 0:
                return self.check_element_is_non_visible(ValidationPageLocators.REPLACE_BTN)
            elif action == 1:
                return self.check_element_is_displayed(ValidationPageLocators.REPLACE_BTN)
            elif action == 2:
                self.find_element(ValidationPageLocators.REPLACE_BTN).click()
        elif btn_name == "remove":
            if action == 0:
                return self.check_element_is_non_visible(ValidationPageLocators.REMOVE_BTN)
            elif action == 1:
                return self.check_element_is_displayed(ValidationPageLocators.REMOVE_BTN)
            elif action == 2:
                self.find_element(ValidationPageLocators.REMOVE_BTN).click()
        elif btn_name == "save":
            if action == 0:
                return self.check_element_is_non_visible(ValidationPageLocators.SAVE_IMG_BTN)
            elif action == 1:
                return self.check_element_is_displayed(ValidationPageLocators.SAVE_IMG_BTN)
            elif action == 2:
                self.find_element(ValidationPageLocators.SAVE_IMG_BTN).click()
                return self.check_element_is_non_visible(ValidationPageLocators.SAVE_BTN)
        elif btn_name == "cancel":
            if action == 0:
                return self.check_element_is_non_visible(ValidationPageLocators.CANCEL_BTN)
            elif action == 1:
                return self.check_element_is_displayed(ValidationPageLocators.CANCEL_BTN)
            elif action == 2:
                self.find_element(ValidationPageLocators.CANCEL_BTN).click()
                return self.check_element_is_non_visible(ValidationPageLocators.CANCEL_BTN)
        elif btn_name == "add":
            if action == 0:
                return self.check_element_is_non_visible(ValidationPageLocators.ADD_IMG)
            elif action == 1:
                return self.check_element_is_displayed(ValidationPageLocators.ADD_IMG)
            elif action == 2:
                self.find_element(ValidationPageLocators.ADD_IMG).click()

    def download_file(self, file, hub):
        file_name = file[file.rfind("/") + 1:]
        self.click_on_element(ValidationPageLocators.download_file_btn(file_name))
        time_to_wait = 10
        time_counter = 0
        if int(hub) == 1:
            return True
        else:
            while not os.path.exists(file):
                time.sleep(1)
                time_counter += 1
                if time_counter > time_to_wait:
                    return False
            return True

    def get_field_comment(self, field):
        return self.get_el_text(ValidationPageLocators.field_comment(field), True)

    def check_search_bar_presence(self):
        return self.find_elements(ValidationPageLocators.SEARCH_BAR)

    def add_transformation_click(self):
        self.click_on_element(ValidationPageLocators.ADD_TRANSFORMATION_BTN)

    def set_transformation(self, function_name=None, updated_field=None, function_formula=None, comment=None,
                           save_function_name=None, save_formula=False, apply_changes=True,
                           add_transformation=True):
        if add_transformation:
            self.click_on_element(ValidationPageLocators.ADD_TRANSFORMATION_BTN)
        if function_name:
            self.click_on_element(ValidationPageLocators.SELECT_FUNCTION_DROPDOWN)
            self.select_option_by_text(function_name)
        if updated_field:
            self.click_on_element(ValidationPageLocators.UPDATED_FIELD_DROPDOWN)
            self.select_option_by_text(updated_field)
        if function_formula:
            self.type_in_element(ValidationPageLocators.SET_FUNCTION_TEXTAREA, function_formula)
        if comment:
            self.type_in_element(ValidationPageLocators.FUNCTION_COMMENT_INPUT, comment)
        if save_function_name:
            self.type_in_element(ValidationPageLocators.SAVE_FUNCTION_NAME_INPUT, save_function_name)
        if save_formula:
            self.click_on_element(ValidationPageLocators.SAVE_FUNCTION_BTN)
        if apply_changes:
            el_to_click = ValidationPageLocators.APPLY_FUNCTION_BTN
        else:
            el_to_click = ValidationPageLocators.CANCEL_FUNCTION_BTN
        self.click_on_element(el_to_click)

    def get_error_msg(self):
        return self.get_el_text(ValidationPageLocators.ERROR_MSG)

    def count_fields_or_sub_tables(self, field_name, is_high):
        return self.count_elements(
            ValidationPageLocators.get_cell_value(field_name)) if is_high else self.count_elements(
            ValidationPageLocators.sub_table_name(field_name))

    def scroll_to_field(self, field_name, is_high=True):
        if is_high:
            el = ValidationPageLocators.get_cell_value(field_name)
        else:
            el = ValidationPageLocators.sub_table_name(field_name)
        self.scroll_to_element(el)

    def check_sub_table_is_displayed(self, sub_table_name):
        return self.check_element_is_displayed(ValidationPageLocators.sub_table_name(sub_table_name))

    def check_btn_is_displayed(self, btn_save=True):
        if btn_save:
            el = ValidationPageLocators.SAVE_BTN
        else:
            el = ValidationPageLocators.SHOW_FIELDS_BTN
        return self.check_element_is_displayed(el)

    def get_sub_table_field_upd_value(self, row_id, column_name, is_dropdown=False, index=0):
        txt = self.get_el_text(ValidationPageLocators.get_sub_field_new_value(row_id, column_name, is_dropdown),
                               not is_dropdown, index)
        return txt[txt.find("\n") + 1:] if is_dropdown else txt

    def get_hof_upd_value(self, cell_name, is_dropdown=False, index=0):
        txt = self.get_el_text(ValidationPageLocators.get_hof_new_value(cell_name, is_dropdown), not is_dropdown, index)
        return txt[txt.find("\n") + 1:] if is_dropdown else txt

    # done
    def set_updated_dropdown_value(self, cell_name, row_id=None, table_name=None, index=0):
        self.click_on_element(ValidationPageLocators.updated_field_value(cell_name, table_name, row_id), index)

    def reorder_column(self, table_name, column_name, to_right=True):
        el = self.find_element(ValidationPageLocators.get_table_header_div(table_name, column_name))
        elClick = self.find_element(ValidationPageLocators.get_move_icon_sub_table(table_name, column_name, to_right))
        self.browser.execute_script("arguments[0].scrollIntoView();", el)
        ActionChains(self.browser).move_to_element(el).click(elClick).perform()

    def check_uneditable_field(self, field_name, row_id=None):
        if row_id:
            return False if self.check_element_is_displayed(
                ValidationPageLocators.dropdown_sub_range_name(row_id, field_name)) else True
        else:
            pointer_events = self.get_css_property(ValidationPageLocators.get_dropdown(field_name), 'pointer-events')
            return True if pointer_events == 'none' else False

    def add_delete_range_element(self, add, index=0):
        locator = ValidationPageLocators.ADD_RANGE_ELEMENT if add else ValidationPageLocators.DELETE_RANGE_ELEMENT
        self.click_on_element(locator, index)

    def remove_field(self, field_name, index=0):
        self.click_on_element(ValidationPageLocators.get_div_row_by_id(field_name), index, double_click=True)

    def check_hof_is_displayed(self, field_name, index):
        return self.check_element_is_displayed(ValidationPageLocators.get_row_by_id(field_name), index)

    def get_dropdown_for_sub_table_options(self, table_name):
        self.click_on_element(ValidationPageLocators.dropdown_for_sub_table(table_name))
        option_list = self.find_elements(ValidationPageLocators.dropdown_for_sub_table_items(table_name))
        return [x.text for x in option_list if option_list]
