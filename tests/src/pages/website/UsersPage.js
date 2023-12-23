import {CommonElementsAppPage} from "../CommonElementsAppPage";
import sleep from "sleep";
import {UiEndPoints} from "../../utils/end.points";


class UsersPageLocators {
    static NEW_USER_EMAIL = "[id=new_email_value]";
    static NEW_USER_NAME = "div[data-qa='FirstName'] input";
    static NEW_USER_LASTNAME = "div[data-qa='LastName'] input";
    static USER_TYPE_DROPDOWN = "div[data-qa='user-type']";
    static GENERATE_BTN = "button[data-qa='generate']";
    static NEW_USER_CREDENTIALS = "div[data-qa='new-user-created']";
    static EMAIL_INPUT = "[data-qa='email'] input";
    static PSWD_INPUT = "[data-qa='password'] input";
    static SUBMIT_FORM_BTN = "[data-qa=submit]";
    static REMOVE_USER_BTN = "[data-qa='delete-user']";

    static userTypeLocator(type) {
        return `[data-qa='${type}'`;
    };

    static externalUserFromList(email) {
        return `[data-qa='${email}']`;
    };

    static usersListLocator(usersType) {
        return `[data-qa='${usersType}']`;
    };

}

export class UsersPage extends CommonElementsAppPage {
    async openUsersList(userType) {
        await this.clickOnElement(UsersPageLocators.usersListLocator(userType));
    };

    async addNewUserData(email, firstName, lastName) {
        for (const x of [{locator: UsersPageLocators.NEW_USER_EMAIL, text: email}, {locator: UsersPageLocators.NEW_USER_NAME, text: firstName}, {locator: UsersPageLocators.NEW_USER_LASTNAME, text: lastName}]) {
            await this.typeText(x.locator, x.text);
        }
    };

    async chooseNewUserType(type) {
        await this.clickOnElement(UsersPageLocators.USER_TYPE_DROPDOWN);
        await this.clickOnElement(UsersPageLocators.userTypeLocator(type));
    };

    async generateNewUser() {
        await this.clickOnElement(UsersPageLocators.GENERATE_BTN);
        sleep.sleep(1)
        return await this.getElText(UsersPageLocators.NEW_USER_CREDENTIALS);
    };

    async createNewUser(userEmail, userName, userLastName, userType) {
        await this.goToPage(UiEndPoints.USERS);
        await this.openUsersList('new-user');
        await this.addNewUserData(userEmail, userName, userLastName);
        await this.chooseNewUserType(userType);
        return  await this.generateNewUser();
    };

    async logIn(email, password) {
        await this.typeText(UsersPageLocators.EMAIL_INPUT, email);
        await this.typeText(UsersPageLocators.PSWD_INPUT, password);
        await this.clickOnElement(UsersPageLocators.SUBMIT_FORM_BTN);
    };

    async removeUser(userEmail) {
        await this.clickOnElement(UsersPageLocators.externalUserFromList(userEmail));
        await this.clickOnElement(UsersPageLocators.REMOVE_USER_BTN);
    };
}