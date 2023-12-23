import {CommonElementsAppPage} from "../CommonElementsAppPage";
import {By} from "selenium-webdriver";
import moment from "moment";
import fs from "fs";
import sleep from "sleep";
import {DBParams, Params} from "../../utils/params";
import {DBFields} from "../../utils/db.params";
import {AlertTexts} from "../../utils/texts";

class ValidationPageLocators {
    static SAVE_BTN = "button[data-qa=save]";
    static SAVE_IMG_BTN = "button[data-qa=save-img]";
    static CAL_MONTH_AND_YEAR = "th.rdtSwitch";
    static CAL_BACK = "th.rdtPrev";
    static CAL_FORWARD = "th.rdtNext";
    static TABLE_CELL_NAME = "tr>td[name=name]";
    static SUB_DOCUMENT_HEADER = "div.array_field_title";
    static SCORE_FIELD = "div[data-qa=confidenceScore]>div";
    static DROPDOWN_SCORE = "[data-qa=select-confidence-score]";
    static SCORE_COMMENT_INPUT = "input#confidence_score";
    static REPLACE_BTN = "button[data-qa*=Replace]";
    static EDIT_BTN = "button[data-qa=edit]";
    static REMOVE_BTN = "button[data-qa=remove]";
    static CANCEL_BTN = "button[data-qa=cancel]";
    static LOAD_IMG_BTN = "button[data-qa*=Load]";
    static LOAD_IMG_INPUT = "div.image_buttons > input";
    static IMAGE_FIELDS = "div.ui.vertical.menu a";
    static IMG_PLACE = "div#image_div_id";
    static ADD_IMG = By.linkText("+");
    static DRAWING_CANVAS = ".upper-canvas";
    static ACTIVE_CATEGORY = `${ValidationPageLocators.IMAGE_FIELDS}.active.item`;
    static IMAGE_BASE64 = "#image_id";
    static TIME_SELECT = "td.rdtTimeToggle";
    static ADD_BTN = "button[data-qa=add-field]";
    static SHOW_FIELDS_BTN = "button[data-qa=show-fields]";
    static AUDIT_POPOVER = "div[data-qa=updated-field]";
    static SELECTED_TO_EDIT_ROW_SUB_RANGE = "tr.array_row_top_border.selected_array_row";
    static STICKY_HEADER = "div.sticky-header";
    static COPY_RECORD_BTN = "button[data-qa=copy-record]";
    static CURRENT_STATE_CELL = "td[name=value]";
    static SELECTED_CONFIDENCE_SCORE = "div[data-qa=select-confidence-score]";
    static AUTO_UPDATED_FIELDS = "div[data-qa=auto-updated-fields]";
    static MANUAL_OVERRIDE_FIELDS = "div[data-qa=manual-override-fields]";
    static ACTIVE_CALENDAR_DATE = "td.rdtDay.rdtActive";
    static SEARCH_BAR = "div[data-qa-type=search-bar]";
    static ADD_TRANSFORMATION_BTN = "button[data-qa=add-transformation-btn]";
    static SELECT_FUNCTION_DROPDOWN = "div[data-qa='select-function']";
    static UPDATED_FIELD_DROPDOWN = "div[data-qa=updated-field]";
    static SET_FUNCTION_TEXTAREA = "[data-qa=set-function]";
    static FUNCTION_COMMENT_INPUT = "div[data-qa=function-comment] > input";
    static SAVE_FUNCTION_NAME_INPUT = "div[data-qa=save-function-name] > input";
    static SAVE_FUNCTION_BTN = "button[data-qa=save-btn]";
    static CANCEL_FUNCTION_BTN = "button[data-qa=cancel-btn]";
    static APPLY_FUNCTION_BTN = "button[data-qa=apply-btn]";
    static ERROR_MSG = "[data-qa='error-msg']";
    static CALENDAR_MONTH = "td.rdtMonth";
    static CALENDAR_TIME = "div.rdtCount";
    static ADD_RANGE_ELEMENT = "[data-qa=add-new-element]";
    static DELETE_RANGE_ELEMENT = "[data-qa=delete-element]";
    static CALENDAR_ERROR = "div.error_message";
    static ADD_FIELD_BTN = "button[data-qa='add-field-btn']";
    static ADD_FIELD_DROPDOWN = "span.array_row_add_field_selector div.multi_select__dropdown-indicator";
    static VIEW_DROPDOWN = "[data-qa='select-view']";
    static DEFAULT_VIEW = "[data-qa='default']";
    static OPEN_DROPDOWN_LIST = "div.multi_select__menu";

    static addFieldToSubTable(field) {
        return By.xpath(`//div[contains(text(),'${field}')]`)
    };

    static subField(field) {
        return `td[data-qa='${field}']`;
    }

    static getRowId(name) {
        return `tr[id='${name}']`
    };

    static getResearcherInfo(rowId, fieldName) {
        return `tr[id='${rowId}'] td[data-qa='${fieldName}']`
    };

    static subtableFieldValidation(fieldName) {
        return `td[data-qa='${fieldName}'] span.array_row_valid_select div[class*=multi_select__control] div.multi_select__dropdown-indicator`;
    };

    static subtableFieldDropdown(fieldName) {
        return `td[data-qa='${fieldName}'] span.new-value div[class*=multi_select__control]`;
    };

    static selected_item_from_multidrop_by_div(item) {
        return By.xpath(`//div[contains(text(),'${item}')]`);
    };

    static date_from_month(date) {
        return By.xpath(`//reach-portal/descendant::td[@class='rdtDay' and text()='${date}']`);
    };

    static cal_dropdown(field, tableName) {
        return tableName ? `[id*=array_input_field_date${tableName}][id*=masked][name='${field}']`
            : `[id*=input_field_date${field}][id*=masked]`;
    };

    static get_dropdown(field) {
        return `tr[id='${field}'] .valid_new_selector span[class*=indicatorSeparator] ~ div[class*=indicatorContainer]`
    };

    static get_updated_data_cell_dropdown_field(field, rowId = null) {
        return rowId ? `[id='${field}'] input#react-select-8-input` : `tr#${field} td.updated_data_cell`;
    };

    static get_cell_value(field) {
        return `tr[id='${field}'] td[name=value]`
    };

    static get_audit_btn(field, fieldRow = null) {
        const locator = fieldRow ? `"[id='${fieldRow}'] td[name='${field}']` : `[id='${field}']`;
        return `${locator} button[data-qa=audit-info]`;
    };

    static field_notification(field, tableName = null) {
        return tableName ? `table[name='${tableName}'] div.error_message[name='${field}']`
            : `tr[id='${field}'] td.updated_data_cell`;
    };

    static get_just_added_rows(tableName) {
        return `table[name='${tableName}'] tr.just_added_array_field`;
    };

    static new_field_value(field, dt = false) {
        return dt ? `[id*=input_field][id*=${field}][id*=masked]` : `div[data-qa=new-value] > [id*=${field}]`;
    };

    static field_comment(field) {
        return `#input_field_comment${field}`;
    };

    static get_img_category(name) {
        return By.xpath(`//div[@class='ui vertical menu']//a[text()='${name}']`);
    };

    static get_img_by_base64(base64) {
        return `img[src='${base64}']`;
    };

    static set_time(up, down) {
        return By.xpath(`//div[@class='rdtCounter'][${up}]/span[@class='rdtBtn'][${down}]`);
    };

    static get_utc_option(diff) {
        return By.xpath(`//div[@class='visible menu transition']//span[text()='UTC ${diff}']/parent::div`);
    };

    static get_time(el) {
        return By.xpath(`(//div[@class='rdtCount'])[${el}]`);
    };

    static get_row_by_id(rowId) {
        return `tr[id='${rowId}']`;
    };

    static get_div_row_by_id(rowId) {
        return By.xpath(`tr[id='${rowId}']`);
    };

    static get_sub_field_dropdown(fieldName, rowId = null) {
        return rowId ? `tr[id='{row_id}'] div.search.selection.dropdown[name='${fieldName}']`
            : `tr#${fieldName} > td.updated_data_cell > div`;
    };

    static get_new_value_sub_table_input(tableName, field) {
        return `table[name='${tableName}'] input[name='${field}'].fieldInput`;
    };

    static get_sub_table_rows(tableName) {
        return `table[name='${tableName}'] tbody tr[id]`;
    };

    static add_field_to_sub_table_btn(tableName) {
        return By.xpath(`//table[@name='${tableName}']/ancestor::div[@class='detail_table_array']//button[text()='Add field']`)
    };

    static get_validate_option(option) {
        let index;
        switch (option) {
            case null:
                index = "0";
                break
            case true:
                index = "1";
                break
            case false:
                index = "2";
                break
        }
        return `div[id*=-option-${index}]`;
    };

    static sub_table_columns(table) {
        return `table[name='${table}'] > thead`;
    };

    static get_sub_table_row_values(table, rowId) {
        return `tr#${table}${rowId}`;
    };

    static remove_row_icon(rowId) {
        return `tr[id='${rowId}'] i.remove.circle.icon`;
    };

    static marked_removed(rowId) {
        return `tr[id='${rowId}'].deleted_array_field`;
    };

    static dropdown_sub_range_name(rowId, fieldName) {
        return `tr[id='${rowId}'] td[data-qa=${fieldName}] .array_row_valid_select span[class*=indicatorSeparator] ~ div[class*=indicatorContainer]`;
    };

    static add_sub_range_record(tableName) {
        return `div[data-qa='${tableName}'] ~ div button[data-qa=add-record]`;
    };

    static get_utc_dropdown(fieldName, tableName = null, rowId = null) {
        return tableName ? `table[name='${tableName}'] tr#${rowId} div[class*=timezone_picker][name='${fieldName}']`
            : `tr#${fieldName} div[class*=timezone_picker][aria-disabled=false]`;
    };

    static hide_table_btn(tableName) {
        return `div[data-qa='${tableName}'] ~ div button[data-qa=hide-table]`
    };

    static sub_table_name(tableName) {
        return `div.detail_table_array div[data-qa='${tableName}']`;
    };

    static get_sub_fields_names(tableName) {
        return `table[name='${tableName}'] th`;
    };

    static get_sub_table_cell(rowId, cellIndex) {
        // +1 is set as first value is remove button
        return By.xpath(`//tr[@id='${rowId}']/td[${cellIndex + 1}]`);
    };

    static selected_row_id(tableName) {
        return `table[name='${tableName}'] tr.array_row_top_border.selected_array_row`;
    };

    static get_low_level_cell(rowId, field, tableName) {
        return `table[name='${tableName}'] tr[id='${rowId}'] td[name='${field}']`;
    };

    static get_middle_screen_cell_with_value(field) {
        return By.xpath(`//b[text()='${field}']/following-sibling::span`);
    };

    static get_filter_input_for_sub_table_column(columnName) {
        return `div[data-qa='${columnName}'] input`;
    };

    static get_column_values_for_sub_table(tableName, columnName) {
        return `table[name='${tableName}'] td[name='${columnName}']`;
    };

    static get_table_header_span(tableName, columnName) {
        return `table[name='${tableName}'] span[data-qa='${columnName}']`;
    };

    static get_table_header_div(tableName, columnName) {
        return `table[name='${tableName}'] th[data-qa='${columnName}']`;
    };

    static dropdown_for_sub_table(tableName) {
        return `div[data-qa='${tableName}'] + span div[data-qa=add-field]`;
    };

    static dropdown_for_sub_table_items(tableName) {
        return `div[data-qa='${tableName}'] + span div[data-qa=add-field] div[role=option] span`;
    };

    static bulk_changes_checkbox(tableName, rowId, fieldName) {
        const inputId = rowId.replace(tableName, "");
        return `table[name='${tableName}'] input[id='${inputId}${fieldName}']`;
    };

    static remove_column_from_sub_field_icon(tableName, columnName) {
        return `${this.get_table_header_div(tableName, columnName)} div.remove_field_button`;
    };

    static get_api_link_from_sub_table(tableName, columnName) {
        return `${this.get_column_values_for_sub_table(tableName, columnName)} a`;
    };

    static download_file_btn(fileName) {
        return `button[data-qa='Download file ${fileName}']`;
    };

    static updated_field_value(cellName, tableName = null, rowId = null) {
        const commonPath = `//span[contains(@class, indicatorSeparator)]/following-sibling::div[contains(@class, 'indicatorContainer')]`
        return tableName ? By.xpath(`//table[@name='${tableName}']//tr[@id='${rowId}']//span/following-sibling::div[@name='${cellName}']/preceding-sibling::span${commonPath}`)
            : By.xpath(`//tr[@id='${cellName}']/td[@class='updated_data_cell']${commonPath}`);
    };

    static get_sub_field_new_value(rowId, cellName, isDropdown = true) {
        return isDropdown ? By.xpath(`//tr[@id='${rowId}']//div[@name='${cellName}']/preceding-sibling::span//div[contains(@class, 'container')]`)
            : By.xpath(`//tr[@id='${rowId}']//div[@name='${cellName}']/preceding-sibling::div/input`)

    };

    static get_hof_new_value(cellName, isDropdown = true) {
        return isDropdown ? `tr[id='${cellName}'] td.updated_data_cell> span>div[class*='container']`
            : `tr[id='${cellName}'] td.updated_data_cell input`;
    };

    static get_move_icon_sub_table(table, column, to_right = true) {
        const icon = to_right ? "right" : "left";
        return `${this.get_table_header_div(table, column)} i.{icon}`;
    };

    static getSubArrayFieldUpdatedValues(fieldName, isPrimaryValue) {
        const cellCss = isPrimaryValue ? `[name=value]` : '.updated_data_cell';
        return `tr[id='${fieldName}'] ${cellCss}`;
    };
}

export class ValidationPage extends CommonElementsAppPage {
    async selectValidateOption(valid) {
        await this.clickOnElement(ValidationPageLocators.get_validate_option(valid));
    };

    async set_dropdown_is_valid(field, valid, index = 0) {
        await this.scrollToElement(ValidationPageLocators.get_dropdown(field))
        await this.clickOnElement(ValidationPageLocators.get_dropdown(field), index);
        sleep.sleep(1)
        await this.selectValidateOption(valid);
    };

    async set_new_valid_value(field, value, index = 0, dt = false) {
        await this.typeText(ValidationPageLocators.new_field_value(field, dt), value, index);
    };

    async set_comment(field, comment, index = 0) {
        await this.typeText(ValidationPageLocators.field_comment(field), comment, index);
    };

    async save_form_changes() {
        await this.clickOnElement(ValidationPageLocators.SAVE_BTN);
    };

    async set_utc_diff(diff, fieldName, rowId = null, tableName = null, index = 0) {
        const diffUtc = diff > 0 ? `+ ${diff}` : diff;
        await this.clickOnElement(ValidationPageLocators.get_utc_dropdown(fieldName, tableName, rowId), index)
        await this.clickOnElement(ValidationPageLocators.get_utc_option(diffUtc));
    };

    async open_list_for_dropdown_fields(subFieldName = null, rowId = null) {
        await this.clickOnElement(ValidationPageLocators.get_sub_field_dropdown(subFieldName, rowId));
    };

    async open_doc_list_for_dropdown_fields(subFieldName, rowId = null) {
        await this.clickOnElement(
            ValidationPageLocators.get_updated_data_cell_dropdown_field(subFieldName, rowId));
    };

    async setUpdatedDropdownValue(cell_name, rowId = null, tableName = null, index = 0) {
        await this.clickOnElement(ValidationPageLocators.updated_field_value(cell_name, tableName, rowId), index);
    }


    async select_value_input(text, cellName, rowId = null, tableName = null, index = 0) {
        await this.setUpdatedDropdownValue(cellName, rowId, tableName, index)
        // check if array, then multiple to be selected:
        if (text) {
            if (typeof text === 'string') {
                await this.selectOptionByText(text, true);
            } else {
                for (const i of text) {
                    await this.selectOptionByText(i, true);
                    await this.checkElementPresentOrNot(ValidationPageLocators.selected_item_from_multidrop_by_div(i));
                }
            }
        }
    };

    async open_calendar(fieldName, tableName = null, index = 0) {
        await this.clickOnElement(ValidationPageLocators.cal_dropdown(fieldName, tableName), index);
    };

    async select_cal_date_and_time(fieldName, date, month, year, calTime = '', tableName = null, index = 0) {
        let click_item;
        const errors = [];
        await this.open_calendar(fieldName, tableName, index);
        if (calTime !== "12:00 PM" && calTime !== '') {
            const hours = parseInt(calTime.slice(0, 2));
            const minutes = parseInt(calTime.slice(3, 5));
            const am_pm = calTime.slice(calTime.length - 2);
            // select time:
            await this.clickOnElement(ValidationPageLocators.TIME_SELECT);
            let form_hours = parseInt(await this.getElText(ValidationPageLocators.CALENDAR_TIME, index = 0));
            let form_minutes = parseInt(await this.getElText(ValidationPageLocators.CALENDAR_TIME, index = 1));
            if (form_minutes === 0 && form_hours === 12) {
                // check changing hours when listing back:
                await this.clickOnElement(ValidationPageLocators.set_time(2, 2));

                form_minutes = parseInt(await this.getElText(ValidationPageLocators.CALENDAR_TIME, index = 1));
                form_hours = parseInt(await this.getElText(ValidationPageLocators.CALENDAR_TIME, index = 0));
                if (form_minutes !== 59 || form_hours !== 11) {
                    errors.push(`expected displayed 11:59 after change, got: ${form_hours}:${form_minutes}`);
                    // set back:
                    await this.clickOnElement(ValidationPageLocators.set_time(2, 1));
                }
            }
            // get again value 00
            form_minutes = parseInt(await this.getElText(ValidationPageLocators.CALENDAR_TIME, index = 1));
            const minutes_diff = minutes - form_minutes
            if (minutes_diff > 0) {
                for (let i = 0; i < Math.abs(minutes_diff); i++) {
                    await this.clickOnElement(ValidationPageLocators.set_time(2, 1));
                }

            } else if (minutes_diff < 0) {
                for (let i = 0; i < Math.abs(minutes_diff); i++) {
                    await this.clickOnElement(ValidationPageLocators.set_time(2, 2));
                }
            }
            // check time is ok:
            if (await this.waitForElementToContainText(ValidationPageLocators.get_time(2), minutes) === false) {
                errors.push(`minutes to be selected: ${minutes}`);
            }
            form_hours = parseInt(await this.getElText(ValidationPageLocators.CALENDAR_TIME, index = 0));
            const hours_diff = form_hours - hours
            if (hours_diff < 0) {
                for (let i = 0; i < Math.abs(hours_diff); i++) {
                    await this.clickOnElement(ValidationPageLocators.set_time(1, 1));
                }
            } else if (hours_diff > 0) {
                for (let i = 0; i < Math.abs(hours_diff); i++) {
                    await this.clickOnElement(ValidationPageLocators.set_time(1, 2));
                }
            }
            // check hours text:
            if (await this.waitElementToIncludeText((ValidationPageLocators.get_time(1)), hours) === false) {
                errors.push(`hours to be selected: ${hours}`);
            }

            // check am/pm:
            const form_am_pm = await this.getElText(ValidationPageLocators.CALENDAR_TIME, index = 2);
            if (form_am_pm.toLowerCase() !== am_pm.toLowerCase()) {
                await this.clickOnElement(ValidationPageLocators.set_time(3, 2));
                // check switching is ok:
                if (await this.waitElementToIncludeText(ValidationPageLocators.get_time(3), am_pm) === false) {
                    errors.push(`expected switching to ${am_pm}`);
                }
                for (let i = 0; i < 2; i++) {
                    await this.clickOnElement(ValidationPageLocators.set_time(3, 1));
                }
                if (await this.waitElementToIncludeText(ValidationPageLocators.get_time(3), am_pm.toUpperCase()) === false) {
                    errors.push(`expected switching to ${am_pm}`)
                }
            }
            // return to calendar pick:
            await this.clickOnElement(ValidationPageLocators.CAL_MONTH_AND_YEAR);

        }
        if (date && month && year) {
            const cal_text = await this.getElText(ValidationPageLocators.CAL_MONTH_AND_YEAR);
            // todo: check it
            // const cal_date = datetime.strptime(cal_text, '%B %Y')
            const cal_date = moment(cal_text).format('MM YYYY');

            if (year !== +cal_date.slice(cal_date.length - 4)) {
                // onclick on cal_text
                await this.clickOnElement(ValidationPageLocators.CAL_MONTH_AND_YEAR);
                const year_diff = year - +cal_date.slice(cal_date.length - 4);
                click_item = year_diff > 0 ? ValidationPageLocators.CAL_FORWARD : ValidationPageLocators.CAL_BACK;
                for (let i = 0; i < Math.abs(year_diff); i++) {
                    await this.clickOnElement(click_item);
                }
                // todo: recheck select month then
                await this.clickOnElement(ValidationPageLocators.CALENDAR_MONTH, month - 1)
            } else if (year === +cal_date.slice(cal_date.length - 4) && cal_date.slice(0, 2) !== month) {
                const month_diff = month - cal_date.slice(0, 2);
                click_item = month_diff > 0 ? ValidationPageLocators.CAL_FORWARD : ValidationPageLocators.CAL_BACK;
                for (let i = 0; i < Math.abs(month_diff); i++) {
                    await this.clickOnElement(click_item);
                }
            }

            const croppDate = date[0] === '0' ? date.substring(1) : date
            await this.clickOnElement(ValidationPageLocators.date_from_month(croppDate));
        }
        return errors;
    };

    async get_notification(field, tableName = null) {
        return await this.waitForElementToContainText(ValidationPageLocators.field_notification(field, tableName))
    };

    async get_text_from_fields_with_sub_range() {
        await this.getElText(ValidationPageLocators.SUB_DOCUMENT_HEADER, null);
    };

    async get_column_name_from_tr(index = null) {
        return await this.getElText(ValidationPageLocators.TABLE_CELL_NAME, index);
    };

    async check_updated_field_not_validated(fieldName) {
        await this.checkElementPresentOrNot(ValidationPageLocators.get_dropdown(fieldName));
    };

    async get_cell_val_by_name(name, rowId = null, tableName = null) {
        const locator = rowId ? ValidationPageLocators.get_low_level_cell(rowId, name, tableName)
            : ValidationPageLocators.get_cell_value(name)
        return await this.getElText(locator);
    };

    async check_cell_value(name, value, rowId = null, tableName = null) {
        const locator = rowId ? ValidationPageLocators.get_low_level_cell(rowId, name, tableName)
            : ValidationPageLocators.get_cell_value(name);
        return await this.waitForElementToContainText(locator, value);
    };

    async check_audit_btn(field, rowId = null) {
        return await this.checkElementPresentOrNot(ValidationPageLocators.get_audit_btn(field, rowId));
    };

    async open_score_list() {
        await this.clickOnElement(ValidationPageLocators.DROPDOWN_SCORE);
    };

    async set_score(score) {
        await this.open_score_list();
        await this.selectOptionByText(score);
    };

    async get_score_field() {
        return await this.getElText(ValidationPageLocators.SCORE_FIELD);
    };

    async get_current_doc_score() {
        return this.getElText(ValidationPageLocators.SELECTED_CONFIDENCE_SCORE);
    };

    async set_score_comment(comment) {
        await this.typeText(ValidationPageLocators.SCORE_COMMENT_INPUT, comment);
    };

    async get_score_comment() {
        return await this.getInputValues(ValidationPageLocators.SCORE_COMMENT_INPUT);
    };

    async get_img_from_category(name) {
        await this.clickOnElement(ValidationPageLocators.get_img_category(name));
    };

    async get_all_img_categories() {
        return await this.getElText(ValidationPageLocators.IMAGE_FIELDS, null);
    };

    async file_upload(file) {
        await this.typeText(ValidationPageLocators.LOAD_IMG_INPUT, file);
    };

    async upload_img(action = false, img = null) {
        const uploadBtnPresent = await this.checkElementPresentOrNot(ValidationPageLocators.LOAD_IMG_BTN);
        if (uploadBtnPresent) {
            if (action) {
                await this.file_upload(img);
                // check image was uploaded:
                //todo: return both expectations
                const arr = [];
                arr.push(await this.checkElementPresentOrNot(ValidationPageLocators.LOAD_IMG_BTN, false));
                arr.push(await this.checkElementPresentOrNot(ValidationPageLocators.IMG_PLACE));
                return arr.every(el => el === true);
            } else {
                return true;
            }
        } else {
            return false;
        }
    };

    async check_img_displayed() {
        return await this.checkElementPresentOrNot(ValidationPageLocators.IMG_PLACE);
    };

    async img_btn_handle(btnName, action) {
        let locator;
        switch (btnName) {
            case 'load':
                locator = ValidationPageLocators.LOAD_IMG_BTN;
                break
            case 'edit':
                locator = ValidationPageLocators.EDIT_BTN;
                break
            case 'replace':
                locator = ValidationPageLocators.REPLACE_BTN;
                break
            case 'remove':
                locator = ValidationPageLocators.REMOVE_BTN;
                break
            case 'save':
                locator = ValidationPageLocators.SAVE_IMG_BTN;
                break
            case 'cancel':
                locator = ValidationPageLocators.CANCEL_BTN;
                break
            case 'add':
                locator = ValidationPageLocators.ADD_IMG;
                break
        }
        switch (action) {
            case 0:
                return await this.checkElementPresentOrNot(locator, false);
            case 1:
                return await this.checkElementPresentOrNot(locator);
            case 2:
                await this.clickOnElement(locator);
        }
    }

    async draw() {
        // todo: check on js
        const element = await this.findElementsBy(ValidationPageLocators.DRAWING_CANVAS);
        const actions = driver.actions({async: true});
        await actions.move({origin: element}).press().perform();
    }


    // action: None - check element is present, False - edit and cancel, True - save result on form
    async edit_img(action) {
        await this.img_btn_handle("edit", 2)
        await this.draw();
        const btnName = action ? 'save' : 'cancel';
        await this.img_btn_handle(btnName, 2);
    };

    async check_number_of_img_in_category() {
        return await this.countElements(this.linkName('Image'));
    }


    async remove_img(action = false) {
        if (action) {
            const numberOfTabsBeforeUpd = await this.check_number_of_img_in_category();
            await this.clickOnElement(ValidationPageLocators.REMOVE_BTN);
            // check that number of images decreased to -1 on form. Check load image is displayed in tab:
            const numberOfTabsAfterUpd = await this.check_number_of_img_in_category()
            return numberOfTabsBeforeUpd === numberOfTabsAfterUpd + 1;
        } else {
            return await this.checkElementPresentOrNot(ValidationPageLocators.REMOVE_BTN);
        }
    };

    async get_image_attributes(image_number) {
        await this.clickOnElement(this.linkName(`Image ${image_number}`));
        // check tab is active now:
        return this.checkElementIsActive(this.linkName(`Image ${image_number}`));
    }

    async get_active_category_name() {
        return await this.getElText(ValidationPageLocators.ACTIVE_CATEGORY);
    };

    async get_img_base64() {
        return await this.getElementAttribute(ValidationPageLocators.IMAGE_BASE64, "src");
    };

    async check_img_base64_changed(base64) {
        return await this.checkElementPresentOrNot(ValidationPageLocators.get_img_by_base64(base64), false);
    };

    async img_saved() {
        return await this.checkElementPresentOrNot(ValidationPageLocators.SAVE_IMG_BTN, false);
    };

    async check_table_displayed(tableName) {
        return await this.checkElementPresentOrNot(ValidationPageLocators.sub_table_name(tableName))
    };

    async get_sub_range_column_names(block) {
        const thead = await this.getElText(ValidationPageLocators.sub_table_columns(block));
        return thead.split('\n');
    }


    async get_sub_range_fields_and_values(block, subDocId) {
        // todo: recheck
        const tableColumns = this.get_sub_range_column_names(block)
        // get all values for columns:
        const cellVal = await this.getElText(ValidationPageLocators.get_sub_table_row_values(block, subDocId));
        const vals = cellVal.text.split('\n').slice(1);
        return tableColumns.map((e, i) => {
            return {[e]: vals[i]};
        });
    };

    async add_btn_handle() {
        await this.clickOnElement(ValidationPageLocators.ADD_BTN);
    };

    async validate_sub_field(fieldId, name, valid) {
        await this.scrollToElement(ValidationPageLocators.dropdown_sub_range_name(fieldId, name))
        await this.clickOnElement(ValidationPageLocators.dropdown_sub_range_name(fieldId, name));
        await this.selectValidateOption(valid);
    };

    async verify_selected_row(tableName) {
        return await this.checkElementPresentOrNot(ValidationPageLocators.add_sub_range_record(tableName));
    };

    async select_sub_table_row_by_id(rowId) {
        await this.clickOnElement(ValidationPageLocators.get_row_by_id(rowId))
        // check that element border is visible now:
        return await this.checkElementPresentOrNot(ValidationPageLocators.SELECTED_TO_EDIT_ROW_SUB_RANGE);
    };

    async setNewSubRangeValue(tableName, fieldName, value) {
        await this.typeText(ValidationPageLocators.get_new_value_sub_table_input(tableName, fieldName), value);
    };

    async remove_sub_table_row(rowId) {
        await this.clickOnElement(ValidationPageLocators.remove_row_icon(rowId));
        // check it's class:
        return await this.checkElementPresentOrNot(ValidationPageLocators.marked_removed(rowId));
    };

    async get_all_ids_from_field_with_sub_ranges(tableName) {
        return await this.getElementAttribute(ValidationPageLocators.get_sub_table_rows(tableName), 'id', null);
    };

    async get_selected_row_id(tableName) {
        return await this.getElementAttribute(ValidationPageLocators.selected_row_id(tableName), "id");
    };

    async add_sub_range_row(tableName) {
        await this.clickOnElement(ValidationPageLocators.add_sub_range_record(tableName));
        // check row appears:
        return this.verify_selected_row(tableName);
    };

    async hide_table(tableName) {
        await this.clickOnElement(ValidationPageLocators.hide_table_btn(tableName));
        return await this.checkElementPresentOrNot(ValidationPageLocators.hide_table_btn(tableName), false);
    };

    async remove_fixed_elements() {
        // wait for page is loaded:
        if (await this.checkElementPresentOrNot(ValidationPageLocators.STICKY_HEADER)) {
            await driver.executeScript(
                `let fixedElements = [...document.body.getElementsByTagName('*')].filter(x => 
                getComputedStyle(x, null).getPropertyValue('position') === 'fixed' || getComputedStyle(x, null).getPropertyValue('position')==='sticky'); 
                fixedElements.forEach(el=>{el.style.position='static'});`);
        }
    };

    async get_index_of_sub_table_header(tableName, fieldName) {
        const cellTexts = await this.getElText(ValidationPageLocators.get_sub_fields_names(tableName));
        return cellTexts.indexOf(fieldName);
    };

    async check_cell_style(rowId, cellIndex) {
        const cellClasses = await this.getElementAttribute((ValidationPageLocators.get_sub_table_cell(rowId, cellIndex)),
            "class");
        return cellClasses.includes("updated_array_cell");
    };

    async get_just_added_row(tableName, rowNumber) {
        await this.clickOnElement(ValidationPageLocators.get_just_added_rows(tableName), rowNumber - 1);
    };

    async show_middle_screen() {
        await this.clickOnElement(ValidationPageLocators.SHOW_FIELDS_BTN);
    };

    async get_middle_screen_cell_value(field) {
        return await this.getElText((ValidationPageLocators.get_middle_screen_cell_with_value(field)));
    };

    async get_class_of_low_level_table_row(rowId) {
        return await this.getElementAttribute(ValidationPageLocators.get_row_by_id(rowId), "class");
    };

    async get_cell_value_by_row_number_and_column_name(tableName, rowNumber, columnName) {
        return await this.getElText(ValidationPageLocators.get_column_values_for_sub_table(tableName, columnName), rowNumber - 1);
    };

    async copy_record() {
        await this.clickOnElement(ValidationPageLocators.COPY_RECORD_BTN);
    };

    async get_audit_info(field, rowId = null) {
        await this.clickOnElement(ValidationPageLocators.get_audit_btn(field, rowId));
        return await this.getElText(ValidationPageLocators.AUDIT_POPOVER);
    };

    async set_sub_table_column_filter(columnName, filterValue) {
        await this.typeText(ValidationPageLocators.get_filter_input_for_sub_table_column(columnName), filterValue);
    };

    async get_column_values(tableName, columnName) {
        // Method to find column values for the table
        return await this.getElText(ValidationPageLocators.get_column_values_for_sub_table(tableName, columnName), null);
    };

    async get_cell_color_by_name(name, rowId = null, tableName = null) {
        const locator = rowId ? ValidationPageLocators.get_low_level_cell(rowId, name, tableName)
            : ValidationPageLocators.get_cell_value(name)
        return await this.getStyles(locator, 'background-color');
    };

    async check_column_name_is_visible(tableName, columnName) {
        //todo: recheck
        const textSize = await this.getElementSize(ValidationPageLocators.get_table_header_span(tableName, columnName));
        const cellSize = await this.getElementSize(ValidationPageLocators.get_table_header_div(tableName, columnName));
        return cellSize.width > textSize.width && cellSize.height > textSize.height;
    };

    async check_cells_styling(textProp) {
        const styles = await this.getStyles(ValidationPageLocators.CURRENT_STATE_CELL, 'text-align', null);
        return styles.every(style => style === textProp);
    };

    async dropdown_sub_table_select(tableName) {
        await this.clickOnElement(ValidationPageLocators.dropdown_for_sub_table(tableName));
    };

    async set_bulk_changes_checkbox(tableName, rowId, fieldName, check) {
        // todo rewrite to checkbox
        const locator = ValidationPageLocators.bulk_changes_checkbox(tableName, rowId, fieldName)
        await this.checkCheckBox(locator, check);
        return await this.checkCheckBox(locator);
    };

    async get_time_from_calendar() {
        return await this.getElText(ValidationPageLocators.TIME_SELECT);
    };

    async get_time_from_input(tableName, fieldName) {
        return await this.getInputValues(ValidationPageLocators.get_new_value_sub_table_input(tableName, fieldName));
    };

    async get_auto_updated_fields() {
        return await this.getElText(ValidationPageLocators.AUTO_UPDATED_FIELDS);
    };

    async get_manual_override_fields() {
        return await this.getElText(ValidationPageLocators.MANUAL_OVERRIDE_FIELDS);
    };

    async add_sub_field_btn_click(tableName) {
        await this.clickOnElement(ValidationPageLocators.add_field_to_sub_table_btn(tableName))
    };


    async add_sub_table_field(tableName, fieldName) {
        await this.dropdown_sub_table_select(tableName);
        await this.selectOptionByText(fieldName);
        await this.add_sub_field_btn_click(tableName);
    };

    async get_calendar_widget_date() {
        // todo: recheck format
        const month_and_year = await this.getElText(ValidationPageLocators.CAL_MONTH_AND_YEAR);
        const day = await this.getElText(ValidationPageLocators.ACTIVE_CALENDAR_DATE);
        return moment(`${day} ${month_and_year}`).format('DD MMMM YYYY');
    };

    async get_calendar_input_value(field, tableName = null) {
        return await this.getInputValues(ValidationPageLocators.cal_dropdown(field, tableName));
    };

    async bulk_checkbox_present(tableName, rowId, fieldName) {
        return await this.checkElementPresentOrNot(ValidationPageLocators.bulk_changes_checkbox(tableName, rowId, fieldName))
    };

    async check_api_link_clickable(tableName, columnName) {
        const textsAndLinks = await this.getHrefsAndTexts(ValidationPageLocators.get_api_link_from_sub_table(tableName, columnName), null);
        return textsAndLinks.every(el => el.text === el.href);
    };

    async get_on_hover_field_hint(field, tableName = null, rowId = null) {
        const locator = tableName ? ValidationPageLocators.get_low_level_cell(rowId, field, tableName)
            : ValidationPageLocators.get_cell_value(field);

        await this.elementHover(locator);
        // huck click on el:
        const hint = await this.getHintText();
        await this.clickOnElement(this.BODY);
        return hint;
    };

    async check_dropdown_disabled(fieldName, rowId) {
        const attributes = await this.getElementAttribute(ValidationPageLocators.dropdown_sub_range_name(rowId, fieldName), "class");
        return attributes.includes('disabled');
    };

    async download_file(file, hub) {
        //todo: implement
        const fileName = file.slice(file.lastIndexOf('/') + 1);
        await this.clickOnElement(ValidationPageLocators.download_file_btn(fileName));
        if (hub) {
            return true;
        } else {
            let i = 0;
            while (i < 10) {
                if (fs.existsSync(file)) {
                    return true;
                } else {
                    i++;
                    sleep.sleep(1);
                }
            }
            return false;
        }
    };

    async get_field_comment(field) {
        return await this.getInputValues(ValidationPageLocators.field_comment(field));
    };

    async check_search_bar_presence() {
        return await this.checkElementPresentOrNot(ValidationPageLocators.SEARCH_BAR);
    };

    async add_transformation_click() {
        await this.clickOnElement(ValidationPageLocators.ADD_TRANSFORMATION_BTN);
    };

    async set_transformation(functionName = null, updatedField = null, functionFormula = null, comment = null,
                             saveFunctionName = null, saveFormula = null, applyChanges = true,
                             addTransformation = true) {
        if (addTransformation) {
            await this.clickOnElement(ValidationPageLocators.ADD_TRANSFORMATION_BTN);
        }

        if (functionName) {
            await this.clickOnElement(ValidationPageLocators.SELECT_FUNCTION_DROPDOWN);
            await this.selectOptionByText(functionName);
        }

        if (updatedField) {
            await this.clickOnElement(ValidationPageLocators.UPDATED_FIELD_DROPDOWN);
            await this.selectOptionByText(updatedField);
        }

        if (functionFormula) {
            await this.typeText(ValidationPageLocators.SET_FUNCTION_TEXTAREA, functionFormula);
        }

        if (comment) {
            await this.typeText(ValidationPageLocators.FUNCTION_COMMENT_INPUT, comment);
        }

        if (saveFunctionName) {
            await this.typeText(ValidationPageLocators.SAVE_FUNCTION_NAME_INPUT, saveFunctionName);
        }

        if (saveFormula) {
            await this.clickOnElement(ValidationPageLocators.SAVE_FUNCTION_BTN);
        }
        const elToClick = applyChanges ? ValidationPageLocators.APPLY_FUNCTION_BTN : ValidationPageLocators.CANCEL_FUNCTION_BTN;
        await this.clickOnElement(elToClick);
    };

    async get_error_msg() {
        return await this.getElText(ValidationPageLocators.ERROR_MSG);
    };

    async count_fields_or_sub_tables(fieldName, is_high) {
        const locator = is_high ? ValidationPageLocators.get_cell_value(fieldName) : ValidationPageLocators.sub_table_name(fieldName);
        return await this.countElements(locator);
    };

    async check_sub_table_is_displayed(subTableName) {
        return await this.checkElementPresentOrNot(ValidationPageLocators.sub_table_name(subTableName));
    };

    async check_btn_is_displayed(btnSave = true) {
        const locator = btnSave ? ValidationPageLocators.SAVE_BTN : ValidationPageLocators.SHOW_FIELDS_BTN
        return await this.checkElementPresentOrNot(locator);
    };

    // todo: check that 2 methods get_sub_table_field_upd_value and get_hof_upd_value were union
    async get_table_field_upd_value(rowId, columnName, isHighOrderField = true, isDropdown = false, index = 0) {
        const locator = isHighOrderField ? ValidationPageLocators.get_hof_new_value(columnName, isDropdown)
            : ValidationPageLocators.get_sub_field_new_value(rowId, columnName, isDropdown);
        const txt = isDropdown ? await this.getElText(locator, index)
            : await this.getInputValues(locator, index);
        return isDropdown ? txt.slice(txt.indexOf('\n') + 1) : txt;
    };

    async set_updated_dropdown_value(cellName, rowId = null, tableName = null, index = 0) {
        await this.clickOnElement(ValidationPageLocators.updated_field_value(cellName, tableName, rowId), index);
    };

    async reorder_column(table_name, column_name, to_right = true) {
        // todo: implement via js using https://www.selenium.dev/documentation/en/support_packages/mouse_and_keyboard_actions_in_detail/
    };

    async check_uneditable_field(fieldName, rowId = null) {
        if (rowId) {
            return await this.checkElementPresentOrNot(ValidationPageLocators.dropdown_sub_range_name(rowId, fieldName), false);
        } else {
            const pointer_events = await this.getStyles(ValidationPageLocators.get_dropdown(fieldName), 'pointer-events');
            return pointer_events === 'none';
        }

    };

    async add_delete_range_element(add, index = 0) {
        const locator = add ? ValidationPageLocators.ADD_RANGE_ELEMENT : ValidationPageLocators.DELETE_RANGE_ELEMENT;
        await this.clickOnElement(locator, index);
    };

    async remove_field(fieldName, index = 0) {
        await this.dblClickOnElement(ValidationPageLocators.get_div_row_by_id(fieldName), index);
    };

    async check_hof_is_displayed(fieldName, index) {
        return await this.checkElementPresentOrNot(ValidationPageLocators.get_row_by_id(fieldName), index);
    };

    async get_dropdown_for_sub_table_options(tableName) {
        await this.clickOnElement(ValidationPageLocators.dropdown_for_sub_table(tableName));
        return await this.getElText(ValidationPageLocators.dropdown_for_sub_table_items(tableName), null);
    };

    async auditField(field, added = false, apply_to_all = false, close_dropdown = false) {
        const errors = []
        const validation = new ValidationPage()
        const index = Params.INDEX in field ? field[Params.INDEX] : 0;
        let day, month, year;
        if (added) {
            field[DBFields.VALID] = false
        }
        const time_val = Params.TIME in field ? field[Params.TIME] : null;
        if (!field[DBFields.VALID] && field[DBFields.TYPE] === DBFields.DATE_TYPE && (
            !(Params.MIXED_VALUE in field) || field[Params.MIXED_VALUE] === false) && (
            DBFields.NEW_VALUE in field && field[
                DBFields.NEW_VALUE] !== null)) {
            day = field[DBFields.NEW_VALUE].slice(8);
            month = field[DBFields.NEW_VALUE].slice(5, 7);
            year = field[DBFields.NEW_VALUE].slice(0, 4);
        } else {
            day = null
            month = null
            year = null
        }
        if (Params.PARENT in field) {
            const table_name = field[Params.PARENT]
            if (!added) {
                await validation.validate_sub_field(field[Params.ROW_ID], field[Params.NAME], field[DBFields.VALID]);
            }
            if (!field[DBFields.VALID]) {
                await validation.set_bulk_changes_checkbox(field[Params.PARENT],
                    field[Params.ROW_ID].replace(field[
                        Params.PARENT], ''),
                    field[Params.NAME], apply_to_all)

                if (field[DBFields.TYPE] === DBFields.DATE_TYPE) {
                    if (Params.MIXED_VALUE in field && field[Params.MIXED_VALUE]) {
                        await validation.setNewSubRangeValue(field[Params.PARENT], field[Params.NAME],
                            field[DBFields.NEW_VALUE])
                    } else {
                        const date_error = await validation.select_cal_date_and_time(field[Params.NAME], day, month,
                            year, time_val, field[Params.PARENT])
                        date_error.forEach(error => {
                            errors.push(error);
                        })
                    }
                } else if (field[DBFields.TYPE] === DBFields.ENUM || field[DBFields.TYPE] === DBFields.BOOL && DBFields.NEW_VALUE in field && field[
                    DBFields.NEW_VALUE] !== null) {
                    await validation.select_value_input(field[DBFields.NEW_VALUE],
                        field[Params.NAME],
                        field[Params.ROW_ID], table_name)
                } else if (DBFields.NEW_VALUE in field && field[DBFields.NEW_VALUE] !== null) {
                    await validation.setNewSubRangeValue(field[Params.PARENT], field[Params.NAME],
                        field[DBFields.NEW_VALUE])
                }
            }
        } else {
            sleep.sleep(2)
            await validation.set_dropdown_is_valid(field[Params.NAME], field[DBFields.VALID], index)
            if (!field[DBFields.VALID] && DBFields.NEW_VALUE in field) {
                if (field[DBFields.TYPE] === DBFields.DATE_TYPE) {
                    if (Params.MIXED_VALUE in field && field[Params.MIXED_VALUE]) {
                        await validation.set_new_valid_value(field[Params.NAME],
                            field[DBFields.NEW_VALUE], index, true)
                    } else {
                        const date_error = await validation.select_cal_date_and_time(field[Params.NAME], day, month,
                            year, time_val, null, index);
                        date_error.forEach(error => {
                            errors.push(error);
                        })
                    }
                }

            } else if (field[DBFields.TYPE] === DBFields.ENUM || field[DBFields.TYPE] === DBFields.BOOL) {
                await validation.select_value_input(field[DBFields.NEW_VALUE], field[Params.NAME], null, null, index);
            } else {
                await validation.set_new_valid_value(field[Params.NAME], field[DBFields.NEW_VALUE], index);
            }
        }
        if (!field[DBFields.VALID] && field[DBFields.TYPE] === DBFields.DATE_TYPE) {
            if (Params.UTC in field && field[Params.UTC] !== 0) {
                const row_id = Params.PARENT in field ? field[Params.ROW_ID] : null;
                const table_name = Params.PARENT in field ? field[Params.PARENT] : null;
                await validation.set_utc_diff(field[Params.UTC], field[Params.NAME], row_id, table_name, index);
            }
        }
        if (!field[DBFields.VALID] && DBFields.COMMENT in field) {
            await validation.set_comment(field[Params.NAME], field[DBFields.COMMENT], index)
        }

        if (close_dropdown) {
            await validation.click_on_body()
        }

        return errors
    };

    async getUpdatedValuesForEnumArrayField(fieldName, isPrimaryValue) {
        return await this.getElText(ValidationPageLocators.getSubArrayFieldUpdatedValues(fieldName, isPrimaryValue));
    };

    async clickDefault() {
        await this.clickOnElement(ValidationPageLocators.VIEW_DROPDOWN);
        await this.clickOnElement(ValidationPageLocators.DEFAULT_VIEW);
    };

    async check_is_pass(fields) {
        const errors = [];
        if (fields.every(el => el[DBParams.NEW_VALUE_PASS] === true)) {
            const alertText = await this.handleAlert();
            if (alertText.includes(AlertTexts.EDIT_AUDITED_FIELDS)) {
                await this.check_is_pass(fields)
            } else if (!alertText.includes(AlertTexts.SUCCESSFULLY_UPDATED)) {
                errors.push(`expected text in alert to contain ${AlertTexts.SUCCESSFULLY_UPDATED} got: ${alertText}`);
            }
        } else {
            // check notifications for each non-pass field:
            const notPassedFields = fields.filter(field => field[DBParams.NEW_VALUE_PASS] === false);
            for (const field of notPassedFields) {
                const tableName = (Params.PARENT in field) ? field[Params.PARENT] : null;
                if (!await this.get_notification(field[Params.NAME], tableName)) {
                    errors.push("missing notification for non-valid value field");
                }
            }
        }
        return errors
    }

    async get_calendar_error() {
        return await this.getElText(ValidationPageLocators.CALENDAR_ERROR);
    };

    async addField(field) {
        await this.clickOnElement(ValidationPageLocators.ADD_FIELD_DROPDOWN);
        await this.clickOnElement(ValidationPageLocators.addFieldToSubTable(field));
        await this.clickOnElement(ValidationPageLocators.ADD_FIELD_BTN);
    };

    async selectValidationForSubtableField(field, option) {
        await this.scrollToElement(ValidationPageLocators.subField(field));
        await this.clickOnElement(ValidationPageLocators.subtableFieldValidation(field));
        await this.clickOnElement(ValidationPageLocators.get_validate_option(option));
    };

    async getListOfRegisteredUserEmails(field) {
        await this.clickOnElement(ValidationPageLocators.subtableFieldDropdown(field));
        return await this.getElText(ValidationPageLocators.OPEN_DROPDOWN_LIST);
    };

     async checkSaveButton() {
         await this.checkElementPresentOrNot(ValidationPageLocators.SAVE_BTN);
     };

    async goToPageWithDefaultView(url) {
        await this.goToPage(url);
        await this.remove_fixed_elements();
        await this.clickDefault();
    };

    async getResearcherData(rowId, fieldName) {
        return await this.getElText(ValidationPageLocators.getResearcherInfo(rowId, fieldName));
    };

    async scrollToRow(name) {
        await this.scrollToElement(ValidationPageLocators.getRowId(name));
    };

    async setNewEmail(field, email) {
        await this.clickOnElement(ValidationPageLocators.subtableFieldDropdown(field));
        await this.clickOnElement(ValidationPageLocators.selected_item_from_multidrop_by_div(email));
    };

}