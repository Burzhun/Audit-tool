from selenium.webdriver.common.by import By


class AdminPageLocators:
    CLOSE_SEARCH_BTN = "button.ui.icon.button"
    SELECT_ALL_DROPDOWN = "div.ui.dropdown"
    SELECT_HEADER_LEFT = "div[data-qa='unselected select-header']"
    SELECT_HEADER_RIGHT = "div[data-qa='selected select-header']"
    ABORT_CHANGES_BTN = "button[data-qa='abort-changes']"
    SAVE_CHANGES_BTN = "button[data-qa='save-changes']"
    LABEL = "label"
    VISIBILITY_CHECKBOX = "div[data-qa='visibility'] > input[type='checkbox']"
    ACTIVE_DROPDOWN_ICON = ".active > .dropdown"
    CONTAINER_GRID = "div.grid.side-select"
    DEFAULT_SEARCH_INPUT = "div.six.wide.column input.search"
    CLEAR_DEFAULT_SEARCH_INPUT = "i.dropdown.icon.clear"
    DEFAULT_SEARCH_DROPDOWN = "div.six.wide.column div[role='combobox']"
    ACTIVE_SELECTED_ITEM_IN_DEFAULT_SEARCH = "div.six.wide.column div[@aria-live='polite']"
    SELECT_COLLECTION_DROPDOWN = "div[data-qa='select-collection']"
    SELECT_CONFIG_FIELD_DROPDOWN = "div[data-qa='select-config-field']"
    FILTER_VALIDATORS = "input[placeholder='Filter Fields']"
    VALIDATORS_FIELDS = "[data-qa='validators-fields']"
    VALIDATORS_VALUES = "[data-qa='validators-values']"
    FIELD_DATA_TYPE = "[data-qa='data-type']"
    API_FIELD_DROPDOWN_OPTION = "span[class='api_update_column'] div[data-qa='name']"
    FIELD_TO_BE_UPDATED_DROPDOWN_OPTION = "span[class='api_update_column'] div[data-qa='update-field']"
    FIELD_NAME_DROPDOWN = "div[data-qa='field-name']"
    FIELD_NAME_INPUT = f"{FIELD_NAME_DROPDOWN} > input"
    TO_JSON_SWITCHER = "div[data-qa='to-json']"
    TO_JSON_SWITCHER_LABEL = f"{TO_JSON_SWITCHER} > label"
    ADD_CONSTRAINT_BTN = "button[data-qa='add-constraint']"
    SAVE_USER_FUNCTIONS_BTN = "button[data-qa='save-functions']"
    SAVE_CONSTRAINT_BTN = "button[data-qa='save-validator']"
    DELETE_VALIDATOR_BTN = "button[data-qa='delete-validator']"
    REMOVE_VALIDATOR_BTN = "button[data-qa='remove-validator']"
    CANCEL_VALIDATOR_BTN = "button[data-qa='cancel-validator']"
    REMOVE_CONSTRAINT_BTN = "button[data-qa='remove-constraint']"
    REVISION = "div[data-qa='revision']"
    UPDATED_BY_FIELDS = "[data-qa=updated-by-fields]"
    SEARCH_VALIDATOR_INPUT = "div[data-qa=search-validator] > input"
    VALIDATOR_TOOLTIP = "[data-qa=validator-tooltip] div"
    MISSING_ITEM_TOOLTIP = "[data-qa=missing-item-tooltip] div"

    UPDATES_DROPDOWN = "div.dashboard div.dropdown-main div.text"
    UPDATES_SUB_DROPDOWN = "div.fourteen div.text"
    CREATE_NEW_UPDATE_BTN = (By.XPATH, "//button[contains(text(), 'Create new')]")
    NAME_FIELD = "[data-qa='name'] input"
    API_TOKEN = "[data-qa='token'] input"
    API_BASE_URL = "[data-qa='base_url'] input"
    DESCRIPTION_FIELD = "[data-qa='description']"
    PIPELINE_FIELD = "[data-qa='pipeline'] textarea"
    UPDATE_FUNCTION_FIELD = "[data-qa='function'] textarea"
    MATCHING_FIELDS_DROPDOWN = "[data-qa='matching_fields']"
    MATCHING_FIELDS_DROPDOWN_OPTIONS = "//div[@data-qa='matching_fields']/descendant::div[contains(@class, '-option')]"

    MAIN_ADMIN_PAGE_PROFILE_LINK = ".header-right-group a:first-child"
    PROFILE_LINK = ".menuLinkContainer a:first-child"
    LAST_EMAIL_ON_PAGE = (By.XPATH, "//div[text()='New Users']/following-sibling::div/descendant::span[last()]")
    GIVE_ACCESS_BTN = (By.XPATH, "//button[text()='Give Access']")
    DELETE_USER_BTN = (By.XPATH, "//button[text()='Delete user']")
    FIELD_CONSTRAINT = "[data-qa-name][data-qa-val]"
    FIELD_CONSTRAINT_INPUT = "[data-qa='constraint-name'] > input"

    @staticmethod
    def missing_validators(missing=True, is_no_type=False):
        if missing is True:
            qa_type = """='true'"""
            return f"""[data-qa-empty{qa_type}]"""
        elif missing is False and is_no_type is False:
            qa_type = """='false'"""
            return f"""[data-qa-empty{qa_type}]"""
        elif missing is False and is_no_type is True:
            qa_type = """='false'"""
            return f"""[class*="no_type"][data-qa-empty{qa_type}]"""
        else:
            qa_type = ""
            return f"""[data-qa-empty{qa_type}]"""



    @staticmethod
    def container_item(selected=True, text=None, is_missing=False):
        if selected:
            attr = "selected"
        else:
            attr = "unselected"
        if text:
            t = f"""div[data-qa-value='{text}']"""
        else:
            t = ""
        if is_missing:
            span = "span"
        else:
            span = ""
        return f"""div.select-container[data-qa='{attr}'] {t} {span}"""

    @staticmethod
    def container_item_by_name(is_right, field):
        if is_right:
            attr = "selected"
        else:
            attr = "unselected"
        return f"div[data-qa='{attr}'] div[data-qa-value='{field}']"

    @staticmethod
    def selected_unselected_items(is_dict_type, container_is_right=True, item_is_selected=True, parent=None):
        if container_is_right:
            container = "selected"
        else:
            container = "unselected"
        if is_dict_type is True:
            field_type = "dict-type"
        elif is_dict_type is False:
            field_type = "non-dict-type"
        else:
            field_type = "sub-field"
        if item_is_selected is True:
            item = f"""=item-selected"""
        elif item_is_selected is False:
            item = f"""=item-not-selected"""
        elif item_is_selected is None:
            item = ""
        if parent:
            par = f"[data-qa-parent={parent}]"
        else:
            par = ''
        return f"div[data-qa={container}] div[data-qa{item}][data-qa-type={field_type}]{par}"

    @staticmethod
    def arrow_button(right):
        if right:
            btn_type = "right"
        else:
            btn_type = "left"
        return f"button[data-qa='{btn_type}']"

    @staticmethod
    def validator_by_name(name):
        return f"div[data-qa='{name}']"

    @staticmethod
    def handle_constraint(key=True, is_dropdown=False, field_type="input"):
        if key:
            data_qa = "name"
        else:
            data_qa = "value"
        path = field_type if field_type else ""
        # if field_type:
        #     path =
        # elif field_type is False:
        #     path = ""
        # else:
        #     path = "i"
        if is_dropdown or key:
            return f"div[data-qa='constraint-{data_qa}'] {path}"
        elif not is_dropdown:
            return f"span[data-qa='constraint-{data_qa}'] {path}"

    @staticmethod
    def search_item_in_container(is_right=True, clear=False):
        if is_right:
            val = "selected"
        else:
            val = "unselected"
        if clear:
            el = "button"
        else:
            el = "input"
        return f"div[data-qa='{val}'] > div[data-qa='search-items'] > {el}"

    @staticmethod
    def field_by_attribute_value(field_name):
        return f"[data-qa='{field_name}'] input"

    @staticmethod
    def open_dropdown_fields_click(field_name):
        return f"[data-qa='{field_name}']"

    @staticmethod
    def select_option_from_visible_dropdown(text):
        return By.XPATH, f"//div[contains(@class, '-option') and text()='{text}']"\

    @staticmethod
    def click_add_field_button(text):
        return By.XPATH, f"//span[@class='api-names-column' and text()='{text}']/following-sibling::span[@class='api_update_column']/button"

    @staticmethod
    def click_give_access_btn(text):
        return By.XPATH, f"//span[text()='{text}']/following-sibling::button[text()='Give Access']"

    @staticmethod
    def click_delete_user_btn(text):
        return By.XPATH, f"//span[text()='{text}']/following-sibling::button[text()='Delete user']"