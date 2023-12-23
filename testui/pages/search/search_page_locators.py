from selenium.webdriver.common.by import By


class SearchPageLocators:
    # todo: fix this xpath
    NUMBER_OF_RECORDS = (By.XPATH, "//body/div[@id='root']/div/div[@class='container']/div[4]")
    TABLE_HEADERS = "thead.full-width > tr"
    RESULT_TABLE = (By.XPATH, "//table[@class='ui celled fixed sortable striped table']")
    FOUND_RECORDS = "div[data-qa='show-all-records']"
    SEARCH_BTN = "button[data-qa='search-btn']"
    FILTER_REMOVE_BTN = "button[data-qa='filter-remove']"
    MINI_TABLE_ROW = (By.XPATH, "//tr[@class='tableRow ']")
    TABLE_ROW_CLICKED = "tr.tableRow.clicked"
    ROWS_BEFORE_SELECTED = (By.XPATH, "//tr[@class='tableRow clicked']/preceding-sibling::tr")
    PRE_LAST_PAGE_SEARCH_TABLE = "li:nth-last-child(2)"
    NEXT_LINK_SEARCH_TABLE = "li.next"
    SCORE_DROPDOWN = "div[data-qa='set-data'] > div[@class='ui selection dropdown']"
    ADD_NEW_RECORD = "button[data-qa=add-new-record]"
    ADD_PARAM_BTN = "button[data-qa=add-search-field]"
    DROPDOWN_INPUT = "div[role='combobox']"
    OPERATION_DROPDOWN = "div[data-qa=set-operation]"
    COLLECTION_DROPDOWN = "div[data-qa=collection-name]"
    FIELD_DROPDOWN = "div[data-qa=select-field]"
    FIELD_VALUE_INPUT = "input[data-qa=field-value]"
    FIELD_VALUE_DROPDOWN = "div[data-qa=field-val-dropdown]"
    ADD_COLUMN_DROPDOWN = "div[data-qa=add-field]"

    @staticmethod
    def get_row_by_cell_value(name, record_id):
        return By.XPATH, f"//td[@name='{name}-{record_id}']/parent::tr"

    @staticmethod
    def get_filter_input(placeholder):
        return f"input[placeholder*='{placeholder}']"

    @staticmethod
    def get_cell(name):
        return f"td[name*={name}]"

    @staticmethod
    def get_cell_value_of_selected_row(row_number, cell_name):
        return By.XPATH, f"(//tr[@class='tableRow clicked'])[{row_number}]/td[contains(@name,'{cell_name}')]"

    @staticmethod
    def get_cell_value_by_number_and_column_name(row_number, column_name):
        return By.XPATH, f"(//tr/td[contains(@name, '{column_name}')])[{row_number}]"

    @staticmethod
    def get_all_column_values(column_name):
        return f"td[name*='{column_name}']"

    @staticmethod
    def get_mini_filter(option, value):
        return By.XPATH, f"//span[@data-qa='{option}']//div[text()='{value}']"

    @staticmethod
    def get_mini_filter_set_data(option):
        return f"span[data-qa='{option}'] input[placeholder='{option}']"

    @staticmethod
    def remove_btn(column_name):
        return f"th[data-qa='{column_name}'] div.remove_field_button"
