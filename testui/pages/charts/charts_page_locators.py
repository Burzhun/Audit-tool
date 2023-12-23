from selenium.webdriver.common.by import By


class ChartsPageLocators:
    PALETTE_ITEM = "div.mini_search_selected_record"
    PALETTE_REMOVE_BTN = "span.selected_record_mini_remove"
    GRAPH_POINT = (
        By.XPATH, "//*[local-name()='svg']//*[local-name()='g' and @class='recharts-layer recharts-scatter-symbol']")
    POINT_TOOLTIP = "div.recharts-tooltip-wrapper"
    RED_POINT = (
        By.XPATH,
        "//*[local-name()='svg']//*[local-name()='g' and @class='recharts-layer recharts-reference-dot']/*[local-name()='circle']")
    X_AXIS_SELECTION = (By.XPATH, "//span[contains(text(),'Select X Axis')]//div[@class='text']")
    Y_AXIS_SELECTION = (
        By.XPATH, "(//span[contains(text(),'Select Y Axis')]/following-sibling::div[@role='listbox']/div)[1]")
    Y_AXIS_DROPDOWN = (By.XPATH, "//span[text()='Select Y Axis']/following-sibling::div[1]")
    X_AXIS_DROPDOWN = (By.XPATH, "//span[contains(text(),'Select X Axis')]/div")
