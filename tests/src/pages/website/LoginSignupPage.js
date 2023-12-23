import {UiEndPoints} from "../../utils/end.points";
import {LoginSignUpTexts} from "../../utils/texts";
import {CommonElementsAppPage} from "../CommonElementsAppPage";
import {By} from "selenium-webdriver";

export class LoginSignupPage extends CommonElementsAppPage {
    LOGIN_LNK = "[data-qa=login]";
    GO_TO_DASHBOARD_BTN = ".authBtn";
    EMAIL_INPUT = "[data-qa=email] > input";
    PSWD_INPUT = "[data-qa=password] > input";
    FIRST_NAME_INPUT = "[data-qa='first-name'] > input";
    LAST_NAME_INPUT = "[data-qa='last-name'] > input";
    SUBMIT_FORM_BTN = "[data-qa=submit]";
    SIGN_UP_LNK = "[data-qa='sign-up']";
    ENTER_BUTTON = "button.Button--primary"
    AUTH_BTN = "button.authBtn"
    ERROR_FRAME = By.xpath("//div[@class='error field']/div[@class='ui input']");

    PROFILE_LINK = ".menuLinkContainer a:first-child";
    CHANGE_PASSWORD_BTN = By.xpath("//button[text()='Change password']");

    OLD_PASSWORD = By.xpath("//span[text()='Old password']/following-sibling::div[1]/input");
    NEW_PASSWORD = By.xpath("//span[text()='New password']/following-sibling::div/input");
    SET_PASSWORD_BTN = By.xpath("//button[text()='Set password']");

    constructor() {
        super();
    }

    async gotoLoginForm() {
        await this.clickOnElement(this.LOGIN_LNK);
        return await this.waitForUrlContains(UiEndPoints.AUTH_LOGIN)
    }

    async goToSignUpForm() {
        await this.clickOnElement(this.SIGN_UP_LNK);
        return await this.waitForUrlContains(UiEndPoints.AUTH_REGISTER);
    }

    async fillLoginSignUpForm(login, password, firstName = null, lastName = null) {
        if (login !== null) {
            await this.typeText(this.EMAIL_INPUT, login);
        }
        if (password !== null) {
            await this.typeText(this.PSWD_INPUT, password);
        }

        if (firstName !== null) {
            await this.typeText(this.FIRST_NAME_INPUT, firstName);
        }
        if (lastName !== null) {
            await this.typeText(this.LAST_NAME_INPUT, lastName);
        }
    }

    async submitLoginSignUpForm() {
        await this.clickOnElement(this.SUBMIT_FORM_BTN);
    }

    async getFieldColor(field) {
        let locator;
        switch (field) {
            case LoginSignUpTexts.FIRST_NAME:
                locator = this.FIRST_NAME_INPUT;
                break
            case LoginSignUpTexts.LAST_NAME:
                locator = this.LAST_NAME_INPUT;
                break
            case LoginSignUpTexts.EMAIL_ADDRESS:
                locator = this.EMAIL_INPUT;
                break
            case LoginSignUpTexts.PASSWORD:
                locator = this.PSWD_INPUT;
                break
        }
        return await this.getStyles(locator.split(" ")[0], 'color');
    };

    async getErrorForField(label, with_text) {
        const common_xpath = `//*[text()='${label}']/following-sibling::div[@class='error field']`;
        const xpath = with_text ? `${common_xpath}/following-sibling::p` : common_xpath
        return await this.getElText(By.xpath(xpath));
    };

    async checkColorForError() {
        const colors = await this.getStyles(this.ERROR_FRAME, 'color', null);
        return colors.every(el => el === 'rgba(159, 58, 56, 1)');
    };

    async goToUserProfilePage() {
        await this.clickOnElement(this.PROFILE_LINK);
    };

    async clickChangePasswordBtn() {
        await this.clickOnElement(this.CHANGE_PASSWORD_BTN);
    };

    async fillChangePasswordForm(oldPassword, newPassword) {
        for (const el of [{name: this.OLD_PASSWORD, value: oldPassword}, {
            name: this.NEW_PASSWORD,
            value: newPassword
        }]) {
            await this.typeText(el.name, el.value);
        }

    };

    async clickSetPasswordBtn() {
        await this.clickOnElement(this.SET_PASSWORD_BTN);
    };
}