from selenium.webdriver.common.by import By


class CommonElementsLocators:
    h2 = "h2"
    VISIBLE_MENU_TRANSITION = ".visible.menu"
    OPEN_DROPDOWN_OPTIONS = f"{VISIBLE_MENU_TRANSITION} > div[role=option]"
    ADD_FIELD_DROPDOWN = "div[data-qa=select-field]"
    GLOBAL_UPDATES_BTN = "button[data-qa='Update Calculated Fields']"
    IS_UPDATING_BTN = "button[data-qa='Updating...']"
    ADD_FIELD_BTN = "button[data-qa=add-field-btn]"
    COMMON_HINT = "div.ui.top.right.popup.transition.visible"
    TABLE_HEADER = "th"
    MENU_TAB = "div.tabular.menu a"
    BODY = "body"
    TITLE = "title"
    REACT_DROPDOWN_LIST = "div[class*=MenuList]"

    @staticmethod
    def add_btn(is_audit=True):
        addit = "" if is_audit else "-btn"
        return f"button[data-qa=add-field{addit}]"

    @staticmethod
    def select_option_from_visible_dropdown(text):
        return By.XPATH, f"//div[contains(@class, 'visible') and contains(@class, 'menu')]//span[text()='{text}']/parent::div"

    def select_option_from_visible_dropdown_by_cell_name(text, cell_name):
        return By.XPATH, f"//td[@class='{cell_name}']//div[text()='{text}']"

    @staticmethod
    def get_link_by_text(text):
        return By.XPATH, f"//a[contains(text(),'{text}')]"

    @staticmethod
    def option_from_react_dropdown(text):
        return By.XPATH, f"//div[contains(@class, 'option') and text()='{text}']"
