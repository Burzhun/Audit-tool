from selenium.webdriver.common.by import By


class LoginPageLocators:
    LOGIN_LNK = "a[href='/auth-login']"
    LOGIN_INPUT = "input[placeholder='User ID']"
    PASSWORD_INPUT = "input[type='password']"
    ENTER_BUTTON = "button.Button--primary"
    AUTH_BTN = "button.authBtn"
    SIGN_UP_LNK = (By.XPATH, "//p[text()='Sign Up']/parent::a")
    FIRST_NAME_INPUT = "input[placeholder='First Name']"
    LAST_NAME_INPUT = "input[placeholder='Last Name']"
    EMAIL_INPUT = "input[placeholder='Email']"
    ERROR_FRAME = (By.XPATH, "//div[@class='error field']/div[@class='ui input']")

    PROFILE_LINK = ".menuLinkContainer a:first-child"
    CHANGE_PASSWORD_BTN = (By.XPATH, "//button[text()='Change password']")

    OLD_PASSWORD = (By.XPATH, "//span[text()='Old password']/following-sibling::div[1]/input")
    NEW_PASSWORD = (By.XPATH, "//span[text()='New password']/following-sibling::div/input")
    SET_PASSWORD_BTN = (By.XPATH, "//button[text()='Set password']")

    @staticmethod
    def error(label, with_text):
        common_xpath = f"//*[text()='{label}']/following-sibling::div[@class='error field']"
        if with_text:
            xpath = f"{common_xpath}/following-sibling::p"
        else:
            xpath = common_xpath
        return By.XPATH, xpath
