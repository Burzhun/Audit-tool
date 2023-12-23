import {CommonElementsAppPage} from "../CommonElementsAppPage";
import {By} from "selenium-webdriver";

export class AdminPageLocators {
    static CLOSE_SEARCH_BTN = "button.ui.icon.button";
    static SELECT_ALL_DROPDOWN = "div.ui.dropdown";
    static SELECT_HEADER_LEFT = "div[data-qa='unselected select-header']";
    static SELECT_HEADER_RIGHT = "div[data-qa='selected select-header']";
    static ABORT_CHANGES_BTN = "button[data-qa='abort-changes']";
    static SAVE_CHANGES_BTN = "button[data-qa='save-changes']";
    static LABEL = "label";
    static VISIBILITY_CHECKBOX = "div[data-qa='visibility'] > input[type='checkbox']";
    static ACTIVE_DROPDOWN_ICON = ".active > .dropdown";
    static CONTAINER_GRID = "div.grid.side-select";
    static DEFAULT_SEARCH_INPUT = "div.six.wide.column input.search";
    static CLEAR_DEFAULT_SEARCH_INPUT = "i.dropdown.icon.clear";
    static DEFAULT_SEARCH_DROPDOWN = "div.six.wide.column div[role='combobox']";
    static ACTIVE_SELECTED_ITEM_IN_DEFAULT_SEARCH = "div.six.wide.column div[@aria-live='polite']";
    static SELECT_COLLECTION_DROPDOWN = "div[data-qa='select-collection']";
    static SELECT_CONFIG_FIELD_DROPDOWN = "div[data-qa='select-config-field']";
    static FILTER_VALIDATORS = "input[placeholder='Filter Fields']";
    static VALIDATORS_FIELDS = "[data-qa='validators-fields']";
    static VALIDATORS_VALUES = "[data-qa='validators-values']";
    static FIELD_DATA_TYPE = "[data-qa='data-type']";
    static API_FIELD_DROPDOWN_OPTION = "span[class='api_update_column'] div[data-qa='name']";
    static FIELD_TO_BE_UPDATED_DROPDOWN_OPTION = "span[class='api_update_column'] div[data-qa='update-field']";
    static FIELD_NAME_DROPDOWN = "div[data-qa='field-name']";
    static FIELD_NAME_INPUT = `${AdminPageLocators.FIELD_NAME_DROPDOWN} > input`;
    static TO_JSON_SWITCHER = "div[data-qa='to-json']";
    static TO_JSON_SWITCHER_LABEL = `${AdminPageLocators.TO_JSON_SWITCHER} > label`;
    static ADD_CONSTRAINT_BTN = "button[data-qa='add-constraint']";
    static SAVE_USER_FUNCTIONS_BTN = "button[data-qa='save-functions']";
    static SAVE_CONSTRAINT_BTN = "button[data-qa='save-validator']";
    static DELETE_VALIDATOR_BTN = "button[data-qa='delete-validator']";
    static REMOVE_VALIDATOR_BTN = "button[data-qa='remove-validator']";
    static CANCEL_VALIDATOR_BTN = "button[data-qa='cancel-validator']";
    static REMOVE_CONSTRAINT_BTN = "button[data-qa='remove-constraint']";
    static REVISION = "div[data-qa='revision']";
    static UPDATED_BY_FIELDS = "[data-qa=updated-by-fields]";
    static SEARCH_VALIDATOR_INPUT = "div[data-qa=search-validator] > input";
    static VALIDATOR_TOOLTIP = "[data-qa=validator-tooltip] div";
    static MISSING_ITEM_TOOLTIP = "[data-qa=missing-item-tooltip] div";

    static UPDATES_DROPDOWN = "div.dashboard div.dropdown-main div.text";
    static UPDATES_SUB_DROPDOWN = "div.fourteen div.text";
    static CREATE_NEW_UPDATE_BTN = By.xpath("//button[contains(text(), 'Create new')]");
    static NAME_FIELD = "[data-qa='name'] input";
    static API_TOKEN = "[data-qa='token'] input";
    static API_BASE_URL = "[data-qa='base_url'] input";
    static DESCRIPTION_FIELD = "[data-qa='description']";
    static PIPELINE_FIELD = "[data-qa='pipeline'] textarea";
    static UPDATE_FUNCTION_FIELD = "[data-qa='function'] textarea";
    static MATCHING_FIELDS_DROPDOWN = "[data-qa='matching_fields']";
    static MATCHING_FIELDS_DROPDOWN_OPTIONS = "//div[@data-qa='matching_fields']/descendant::div[contains(@class, '-option')]";

    static MAIN_ADMIN_PAGE_PROFILE_LINK = ".header-right-group a:first-child";
    static PROFILE_LINK = ".menuLinkContainer a:first-child";
    static LAST_EMAIL_ON_PAGE = By.xpath("//div[text()='New Users']/following-sibling::div/descendant::span[last()]");
    static GIVE_ACCESS_BTN = By.xpath("//button[text()='Give Access']");
    static DELETE_USER_BTN = By.xpath("//button[text()='Delete user']");
    static FIELD_CONSTRAINT = "[data-qa-name][data-qa-val]";
    static FIELD_CONSTRAINT_INPUT = "[data-qa='constraint-name'] > input";

    async missing_validators(missing = true, isNoType = false) {
        let qaType;
        if (missing === true) {
            qaType = `='true'`;
            return `[data-qa-empty='true']`
        } else if (missing === false && isNoType === false) {
            return `[data-qa-empty='false']`;
        } else if (missing === false && isNoType === true) {
            return `[class*="no_type"][data-qa-empty='false']`
        } else {
            return `[data-qa-empty]`;
        }
    };

}

export class AdminPage extends CommonElementsAppPage {

}